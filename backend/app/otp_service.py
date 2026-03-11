import logging
import random
from typing import Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Simple in-memory store for OTPs for MVP 
# For production, use Redis!
OTP_STORE: Dict[str, dict] = {}

def generate_otp() -> str:
    """Generate a random 6-digit OTP."""
    return str(random.randint(100000, 999999))

def send_otp(identifier: str) -> bool:
    """
    Mock sending an OTP to email or phone number.
    In a real application, you would integrate Twilio or SendGrid here.
    """
    code = generate_otp()
    OTP_STORE[identifier] = {
        "code": code,
        "expires_at": datetime.utcnow() + timedelta(minutes=10)
    }
    
    # Mock sending
    logger.info("========== OTP MOCK ==========")
    logger.info(f"Sending OTP {code} to {identifier}")
    logger.info("==============================")
    
    return True

def verify_otp(identifier: str, code: str) -> bool:
    """Verify an OTP code."""
    record = OTP_STORE.get(identifier)
    
    if not record:
        return False
        
    if record["expires_at"] < datetime.utcnow():
        # Clean up expired code
        del OTP_STORE[identifier]
        return False
        
    if record["code"] == code:
        # One-time use, clean it up
        del OTP_STORE[identifier]
        return True
        
    return False
