import os
import traceback
from dotenv import load_dotenv
from google import genai

with open('test_gemini_log.txt', 'w', encoding='utf-8') as f:
    try:
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        f.write(f"API KEY: {api_key}\n")
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model='gemini-2.0-flash', contents='Test')
        f.write("SUCCESS:\n")
        f.write(response.text + "\n")
    except Exception as e:
        f.write("ERROR CAUGHT:\n")
        f.write(str(e) + "\n")
        f.write(traceback.format_exc() + "\n")
