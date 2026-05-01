import sys
import os
import asyncio
sys.path.append(os.getcwd())

from app.routers.ai import generate_with_fallback

def test_ai():
    try:
        print("Testing AI...")
        res = generate_with_fallback("I need a plumber to fix my sink for $50")
        print("AI Success! Response:", res)
    except Exception as e:
        print("AI Error:", e)

if __name__ == "__main__":
    test_ai()
