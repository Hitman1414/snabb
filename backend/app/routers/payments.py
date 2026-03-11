from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, auth
from ..database import get_db
import logging
import uuid
from pydantic import BaseModel
import stripe
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

class PaymentIntentRequest(BaseModel):
    amount: int
    currency: str = "usd"
    ask_id: int

@router.post("/create-payment-intent")
def create_payment_intent(
    request: PaymentIntentRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mock endpoint to create a Stripe payment intent.
    In a real app, you would use:
      stripe.api_key = settings.STRIPE_SECRET_KEY
      intent = stripe.PaymentIntent.create(
          amount=request.amount,
          currency=request.currency,
          metadata={'ask_id': request.ask_id, 'user_id': current_user.id}
      )
      return {"client_secret": intent.client_secret}
    """
    logger.info(f"User {current_user.id} requested payment intent for ask {request.ask_id} of amount {request.amount}")
    
    # Verify the ask exists
    ask = db.query(models.Ask).filter(models.Ask.id == request.ask_id).first()
    if not ask:
        raise HTTPException(status_code=404, detail="Ask not found")

    # Use real Stripe if configured
    if settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.create(
                amount=request.amount,
                currency=request.currency or settings.CURRENCY,
                metadata={'ask_id': request.ask_id, 'user_id': current_user.id}
            )
            logger.info(f"Created real Stripe PaymentIntent: {intent.id}")
            return {"client_secret": intent.client_secret}
        except Exception as e:
            logger.error(f"Stripe Error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Payment Error: {str(e)}")
            
    # Fallback to mock for development
    logger.info("Using mock payment intent (STRIPE_SECRET_KEY not set)")
    mock_client_secret = f"pi_{uuid.uuid4().hex}_secret_{uuid.uuid4().hex}"
    return {"client_secret": mock_client_secret}
