import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.otp_service import OTP_STORE

# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module")
def user1_data():
    return {
        "username": "testuser1",
        "email": "test1@example.com",
        "password": "password123",
        "phone_number": "+1234567890",
        "location": "NY"
    }

@pytest.fixture(scope="module")
def user2_data():
    return {
        "username": "testuser2",
        "email": "test2@example.com",
        "password": "password123",
        "phone_number": "+0987654321",
        "location": "SF"
    }

def test_registration(user1_data, user2_data):
    response1 = client.post("/auth/register", json=user1_data)
    assert response1.status_code == 201
    assert response1.json()["username"] == user1_data["username"]

    response2 = client.post("/auth/register", json=user2_data)
    assert response2.status_code == 201
    assert response2.json()["username"] == user2_data["username"]

def test_login_and_push_token(user1_data):
    # Login
    response = client.post("/auth/login", data={"username": user1_data["username"], "password": user1_data["password"]})
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Save push token
    headers = {"Authorization": f"Bearer {token}"}
    push_resp = client.put("/users/me/push-token", json={"token": "ExponentPushToken[12345]"}, headers=headers)
    assert push_resp.status_code == 200

    # Get me
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["expo_push_token"] == "ExponentPushToken[12345]"

def test_otp_flow():
    email = "otpuser@example.com"
    # Send OTP
    resp_send = client.post("/auth/send-otp", json={"email_or_phone": email})
    assert resp_send.status_code == 200
    
    # Introspect mock OTP store to get the code
    code = OTP_STORE[email]["code"]
    
    # Verify OTP
    resp_verify = client.post("/auth/verify-otp", json={"email_or_phone": email, "code": code})
    assert resp_verify.status_code == 200
    assert resp_verify.json()["is_new_user"] is True # Since user doesn't exist

def test_create_ask_and_geo_filter(user1_data):
    # Login
    token = client.post("/auth/login", data={"username": user1_data["username"], "password": user1_data["password"]}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create Ask
    ask_payload = {
        "title": "Need a plumber",
        "description": "Fix my sink",
        "category": "plumbing",
        "location": "123 Plumber St",
        "latitude": 40.7128,  # NY
        "longitude": -74.0060,
        "date_needed": "2026-03-10",
        "time_needed": "Morning",
        "budget_min": 100,
        "budget_max": 200,
        "status": "open"
    }
    resp_ask = client.post("/asks/", json=ask_payload, headers=headers)
    print(resp_ask.json())
    assert resp_ask.status_code == 201
    ask_id = resp_ask.json()["id"]

    # Filter Asks via GET /asks with Geo
    # This should match (radius 30km around NY is inclusive of 40.7128, -74.0060)
    resp_geo = client.get("/asks/?lat=40.7128&lng=-74.0060&radius_km=10")
    assert resp_geo.status_code == 200
    assert len(resp_geo.json()["items"]) > 0
    assert resp_geo.json()["items"][0]["id"] == ask_id
    
    # Ask 100km away should NOT match
    resp_geo_far = client.get("/asks/?lat=41.7128&lng=-74.0060&radius_km=10")
    assert resp_geo_far.status_code == 200
    assert len(resp_geo_far.json()["items"]) == 0

def test_payments_intent(user1_data):
    # Login user 1
    token = client.post("/auth/login", data={"username": user1_data["username"], "password": user1_data["password"]}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Since ask 1 was created by user1, let's grab it
    resp_asks = client.get("/asks/")
    ask_id = resp_asks.json()["items"][0]["id"]
    
    # Try to mock payment intent
    resp_pay = client.post("/payments/create-payment-intent", json={"amount": 15000, "currency": "usd", "ask_id": ask_id}, headers=headers)
    assert resp_pay.status_code == 200
    assert "client_secret" in resp_pay.json()
    assert resp_pay.json()["client_secret"].startswith("pi_")

def test_direct_messaging_ws_and_push(user1_data, user2_data):
    # Login user 1
    token1 = client.post("/auth/login", data={"username": user1_data["username"], "password": user1_data["password"]}).json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    
    # Login user 2
    token2 = client.post("/auth/login", data={"username": user2_data["username"], "password": user2_data["password"]}).json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # Get user 2 ID
    user2_id = client.get("/auth/me", headers=headers2).json()["id"]
    
    # Test WebSocket connection for User 2
    with client.websocket_connect(f"/ws/chat?token={token2}") as websocket:
        # User 1 sends message to User 2
        msg_payload = {
            "receiver_id": user2_id,
            "ask_id": None, # general msg
            "content": "Hello User 2!"
        }
        resp_msg = client.post("/messages/", json=msg_payload, headers=headers1)
        assert resp_msg.status_code == 201
        
        # User 2 should receive WebSocket event 
        ws_data = websocket.receive_json()
        assert ws_data["type"] == "NEW_MESSAGE"
        assert ws_data["data"]["content"] == "Hello User 2!"

def test_image_upload_mock(user1_data):
    token = client.post("/auth/login", data={"username": user1_data["username"], "password": user1_data["password"]}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Upload a dummy file
    files = {"file": ("avatar.jpg", b"dummy image content", "image/jpeg")}
    resp = client.post("/users/me/avatar", files=files, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["avatar_url"] is not None
