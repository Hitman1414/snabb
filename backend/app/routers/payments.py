"""
Payments router — Stripe integration with escrow-style manual capture.

Audit fixes:
- #3:  payment_intent.succeeded webhook now actually updates Ask.payment_status
       and stamps `paid_at`, instead of just logging.
- #10: PaymentIntents are created with capture_method=manual when
       PAYMENTS_CAPTURE_METHOD=manual (default). Funds are AUTHORIZED
       (held on the asker's card) but not captured until the asker closes
       the ask. On close → /asks/{id}/close endpoint will trigger the
       capture; on cancel/dispute → the auth is voided.

State machine for Ask.payment_status:
    unpaid → pending → authorized → paid
                              ↘ refunded
                              ↘ failed
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from .. import models, auth
from ..database import get_db
from ..config import settings
import logging
import uuid
from pydantic import BaseModel, Field
import stripe

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])


class PaymentIntentRequest(BaseModel):
    # `amount` is in the smallest currency unit (e.g. cents for USD).
    amount: int = Field(..., gt=0)
    currency: str = Field("usd", max_length=8)
    ask_id: int


@router.post("/create-payment-intent")
def create_payment_intent(
    request: PaymentIntentRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Create a Stripe PaymentIntent. Uses manual capture (escrow) by default."""
    logger.info(
        f"User {current_user.id} requested payment intent for ask {request.ask_id} "
        f"of amount {request.amount} {request.currency}"
    )

    ask = db.query(models.Ask).filter(models.Ask.id == request.ask_id).first()
    if not ask:
        raise HTTPException(status_code=404, detail="Ask not found")

    # Only the asker (the buyer) can authorize payment for an ask.
    if ask.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the ask owner can pay")

    # Use real Stripe if configured.
    if settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.create(
                amount=request.amount,
                currency=request.currency or settings.CURRENCY,
                # Audit #10: escrow. funds are held on auth, captured on close.
                capture_method=settings.PAYMENTS_CAPTURE_METHOD,
                metadata={
                    "ask_id": request.ask_id,
                    "user_id": current_user.id,
                },
            )
            logger.info(f"Created Stripe PaymentIntent: {intent.id}")

            # Persist intent on the ask so we can capture/cancel later.
            ask.payment_intent_id = intent.id
            ask.payment_amount = request.amount
            ask.payment_currency = request.currency or settings.CURRENCY
            ask.payment_status = "pending"
            db.commit()

            return {"client_secret": intent.client_secret, "payment_intent_id": intent.id}
        except stripe.error.StripeError as e:
            logger.error(f"Stripe Error: {e}")
            raise HTTPException(status_code=400, detail=f"Payment Error: {e}")

    # ─── Mock fallback for local dev ──────────────────────────────────────
    logger.info("Using mock payment intent (STRIPE_SECRET_KEY not set)")
    mock_intent_id = f"pi_mock_{uuid.uuid4().hex}"
    mock_client_secret = f"{mock_intent_id}_secret_{uuid.uuid4().hex}"
    ask.payment_intent_id = mock_intent_id
    ask.payment_amount = request.amount
    ask.payment_currency = request.currency or settings.CURRENCY
    ask.payment_status = "pending"
    db.commit()
    return {"client_secret": mock_client_secret, "payment_intent_id": mock_intent_id}


@router.post("/capture/{ask_id}")
def capture_payment(
    ask_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Capture an authorized PaymentIntent — releases held funds.

    Called when the asker closes the ask successfully. In the typical flow
    this is invoked from `POST /asks/{id}/close` rather than directly by the
    client, but exposing it as an endpoint helps for retries.
    """
    ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
    if not ask:
        raise HTTPException(status_code=404, detail="Ask not found")
    if ask.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the ask owner can capture")
    if not ask.payment_intent_id:
        raise HTTPException(status_code=400, detail="No payment to capture")
    if ask.payment_status == "paid":
        return {"status": "already_paid", "payment_status": ask.payment_status}

    if settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.capture(ask.payment_intent_id)
            logger.info(f"Captured PaymentIntent {intent.id} for ask {ask_id}")
        except stripe.error.StripeError as e:
            logger.error(f"Stripe capture failed: {e}")
            raise HTTPException(status_code=400, detail=f"Capture failed: {e}")

    ask.payment_status = "paid"
    ask.paid_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "captured", "payment_status": ask.payment_status}


@router.post("/cancel/{ask_id}")
def cancel_payment(
    ask_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Void an uncaptured PaymentIntent — releases the auth hold."""
    ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
    if not ask:
        raise HTTPException(status_code=404, detail="Ask not found")
    if ask.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the ask owner can cancel")
    if not ask.payment_intent_id:
        raise HTTPException(status_code=400, detail="No payment to cancel")

    if settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            stripe.PaymentIntent.cancel(ask.payment_intent_id)
            logger.info(f"Canceled PaymentIntent {ask.payment_intent_id} for ask {ask_id}")
        except stripe.error.StripeError as e:
            logger.error(f"Stripe cancel failed: {e}")
            # Continue: we mark our record canceled even if Stripe rejects
            # (e.g., the intent was already auto-expired).

    ask.payment_status = "canceled"
    db.commit()
    return {"status": "canceled", "payment_status": ask.payment_status}


# ─── Webhook ──────────────────────────────────────────────────────────────
@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Stripe webhook — verifies signature and updates Ask.payment_status."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.warning("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured.")
        return {"status": "ignored"}

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.error("Invalid Stripe payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid Stripe signature")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    payment_intent = event["data"]["object"]
    metadata = payment_intent.get("metadata", {}) or {}
    ask_id = metadata.get("ask_id")

    if not ask_id:
        logger.warning(f"Webhook event {event_type} missing ask_id metadata")
        return {"status": "no_ask"}

    ask = db.query(models.Ask).filter(models.Ask.id == int(ask_id)).first()
    if not ask:
        logger.warning(f"Webhook event {event_type} for unknown ask {ask_id}")
        return {"status": "ask_not_found"}

    # ─── Audit #3: actually update the database ──────────────────────────
    if event_type == "payment_intent.amount_capturable_updated":
        # Manual-capture flow: funds authorized and held.
        ask.payment_status = "authorized"
    elif event_type == "payment_intent.succeeded":
        ask.payment_status = "paid"
        ask.paid_at = datetime.now(timezone.utc)
    elif event_type == "payment_intent.payment_failed":
        ask.payment_status = "failed"
        err = payment_intent.get("last_payment_error", {}).get("message")
        logger.warning(f"Payment failed for ask {ask_id}: {err}")
    elif event_type == "payment_intent.canceled":
        ask.payment_status = "canceled"
    elif event_type == "charge.refunded":
        ask.payment_status = "refunded"

    db.commit()
    logger.info(f"Webhook {event_type} → ask {ask_id}.payment_status = {ask.payment_status}")
    return {"status": "success"}
