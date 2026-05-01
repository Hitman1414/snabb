import os
from dotenv import load_dotenv
from google import genai
import traceback

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')
print("API KEY:", api_key)

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='Test prompt'
    )
    print("SUCCESS:")
    print(response.text)
except Exception as e:
    print("ERROR CAUGHT:")
    traceback.print_exc()
