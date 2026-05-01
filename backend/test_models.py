import sys
import os
sys.path.append(os.getcwd())

from google import genai
from app.config import settings

def list_models():
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    for m in client.models.list():
        print(m.name)

if __name__ == "__main__":
    list_models()
