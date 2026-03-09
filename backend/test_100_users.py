import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

from app.main import app
from app.database import Base, get_db

# Mock dummy OpenAI key so bot_service doesn't crash during imports
os.environ["OPENAI_API_KEY"] = "dummy"

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

def test_100_users_load():
    users = []
    tokens = []
    print("\nRegistering 100 users...")
    for i in range(100):
        user_data = {
            "username": f"user_{i}",
            "email": f"user_{i}@example.com",
            "password": "password123",
            "phone_number": f"+1000000{i:03d}",
            "location": f"City_{i%10}"
        }
        # Register
        resp = client.post("/auth/register", json=user_data)
        if resp.status_code != 201:
            print("Register error:", resp.json())
        assert resp.status_code == 201
        
        # Login
        resp_login = client.post("/auth/login", data={"username": user_data["username"], "password": user_data["password"]})
        if resp_login.status_code != 200:
            print("Login error:", resp_login.json())
        assert resp_login.status_code == 200
        token = resp_login.json()["access_token"]
        
        users.append(resp.json())
        tokens.append(token)
        
    print("100 users registered and logged in successfully.")
    
    # 20 users create an Ask
    ask_ids = []
    print("Creating 20 asks...")
    for i in range(20):
        token = tokens[i]
        headers = {"Authorization": f"Bearer {token}"}
        ask_payload = {
            "title": f"Need help with task {i}",
            "description": f"Description for task {i}",
            "category": "General",
            "location": "Some location",
            "latitude": 40.0 + i*0.1,
            "longitude": -74.0 + i*0.1,
            "budget_min": 50,
            "budget_max": 200
        }
        resp_ask = client.post("/asks/", data=ask_payload, headers=headers)
        if resp_ask.status_code != 201:
            assert False, f"Ask error: {resp_ask.json()}"
        assert resp_ask.status_code == 201
        ask_ids.append(resp_ask.json()["id"])
        
    print("20 asks created successfully.")
    
    # 80 other users respond to the first ask
    print("80 users responding to ask 1...")
    ask_id = ask_ids[0]
    for i in range(20, 100):
        token = tokens[i]
        headers = {"Authorization": f"Bearer {token}"}
        resp_payload = {
            "message": f"I can help you with this! (User {i})",
            "bid_amount": 100 + i
        }
        resp_res = client.post(f"/responses/asks/{ask_id}/responses", json=resp_payload, headers=headers)
        if resp_res.status_code != 201:
            print("Response error:", resp_res.json())
        assert resp_res.status_code == 201
        
    print("80 responses created successfully.")
    
    # Validate responses count on the ask
    resp_get_res = client.get(f"/responses/asks/{ask_id}/responses", params={"limit": 100})
    assert resp_get_res.status_code == 200
    assert len(resp_get_res.json()) == 80
    
    print("Verified 80 responses were added successfully.")
    print("Testing 100 users completed successfully!")
