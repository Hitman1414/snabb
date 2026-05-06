import os
import traceback
from dotenv import load_dotenv
from google import genai

load_dotenv()

try:
    api_key = os.getenv('GEMINI_API_KEY')
    print("API KEY:", api_key[:5] + "..." if api_key else "None")
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(model='gemini-2.0-flash', contents='Test')
    print("SUCCESS:")
    print(response.text)
except Exception as e:
    print('ERROR:', str(e))
    traceback.print_exc()
