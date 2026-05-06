"""
Payments router integration tests.

Covers: create-payment-intent (mock Stripe + cash), capture, cancel,
ownership guards, and ask-not-found handling.
Stripe is not configured in test env so all intents use the mock fallback.
"""
import pytest
from .conftest import register_user, login_user, auth_headers


def _create_ask(client, headers):
    resp = client.post("/asks", data={
        "title": "Payment test ask",
        "description": "Need service for payment test",
        "category": "services",
        "location": "Test City",
        "budget_min": "100",
        "budget_max": "500",
    }, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestCreatePaymentIntent:
    def test_mock_stripe_intent_created(self, client, user_a):
        ask_id = _create_ask(client, user_a["headers"])
        resp = client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id,
            "amount": 10000,
            "currency": "usd",
        }, headers=user_a["headers"])
        assert resp.status_code == 200
        body = resp.json()
        assert "client_secret" in body
        assert "payment_intent_id" in body
        # In test mode (no STRIPE_SECRET_KEY) the mock id starts with pi_mock_
        assert body["payment_intent_id"].startswith("pi_mock_")

    def test_cash_payment_skips_stripe(self, client, user_a):
        ask_id = _create_ask(client, user_a["headers"])
        resp = client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id,
            "bid_amount": 75.0,
            "currency": "usd",
            "payment_method": "cash",
        }, headers=user_a["headers"])
        assert resp.status_code == 200
        body = resp.json()
        assert body["method"] == "cash"
        assert body["client_secret"] is None
        assert body["payment_intent_id"].startswith("pi_cash_")

    def test_non_owner_cannot_pay(self, client, user_a, user_b):
        ask_id = _create_ask(client, user_a["headers"])
        resp = client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id,
            "amount": 5000,
            "currency": "usd",
        }, headers=user_b["headers"])
        assert resp.status_code == 403

    def test_ask_not_found(self, client, user_a):
        resp = client.post("/payments/create-payment-intent", json={
            "ask_id": 999999,
            "amount": 5000,
            "currency": "usd",
        }, headers=user_a["headers"])
        assert resp.status_code == 404

    def test_zero_amount_rejected_for_stripe(self, client, user_a):
        ask_id = _create_ask(client, user_a["headers"])
        resp = client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id,
            "amount": 0,
            "currency": "usd",
            "payment_method": "stripe",
        }, headers=user_a["headers"])
        assert resp.status_code == 422

    def test_unauthenticated_rejected(self, client, user_a):
        ask_id = _create_ask(client, user_a["headers"])
        resp = client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id,
            "amount": 5000,
            "currency": "usd",
        })
        assert resp.status_code == 401


class TestCapturePayment:
    def test_capture_mock_intent(self, client, user_a):
        ask_id = _create_ask(client, user_a["headers"])
        client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id, "amount": 10000, "currency": "usd",
        }, headers=user_a["headers"])

        resp = client.post(f"/payments/capture/{ask_id}", headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["payment_status"] == "paid"

    def test_capture_already_paid_is_idempotent(self, client, user_a):
        ask_id = _create_ask(client, user_a["headers"])
        client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id, "amount": 5000, "currency": "usd",
        }, headers=user_a["headers"])
        client.post(f"/payments/capture/{ask_id}", headers=user_a["headers"])

        # Second capture must not error — returns already_paid.
        resp = client.post(f"/payments/capture/{ask_id}", headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["status"] == "already_paid"

    def test_non_owner_cannot_capture(self, client, user_a, user_b):
        ask_id = _create_ask(client, user_a["headers"])
        client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id, "amount": 5000, "currency": "usd",
        }, headers=user_a["headers"])
        resp = client.post(f"/payments/capture/{ask_id}", headers=user_b["headers"])
        assert resp.status_code == 403


class TestCancelPayment:
    def test_cancel_mock_intent(self, client, user_a):
        ask_id = _create_ask(client, user_a["headers"])
        client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id, "amount": 10000, "currency": "usd",
        }, headers=user_a["headers"])

        resp = client.post(f"/payments/cancel/{ask_id}", headers=user_a["headers"])
        assert resp.status_code == 200
        assert resp.json()["payment_status"] == "canceled"

    def test_non_owner_cannot_cancel(self, client, user_a, user_b):
        ask_id = _create_ask(client, user_a["headers"])
        client.post("/payments/create-payment-intent", json={
            "ask_id": ask_id, "amount": 5000, "currency": "usd",
        }, headers=user_a["headers"])
        resp = client.post(f"/payments/cancel/{ask_id}", headers=user_b["headers"])
        assert resp.status_code == 403
