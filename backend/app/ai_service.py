"""
Shared AI generation utilities.
Extracted from routers/ai.py to avoid circular imports with moderation.py.
"""
from fastapi import HTTPException
from google import genai
from openai import OpenAI
from .config import settings

# Model priority list — tries each in order if one is rate-limited
GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
    "gemini-1.0-pro"
]


def get_gemini_client():
    """Get a configured Gemini client using the new google-genai SDK."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


def get_openai_client():
    """Get a configured OpenAI client."""
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        return None
    return OpenAI(api_key=api_key)


def generate_with_fallback(prompt: str) -> str:
    """Try generating content with model fallback (Gemini -> OpenAI)."""
    errors = []
    
    # 1. Try Gemini Models first
    gemini_client = get_gemini_client()
    if gemini_client:
        for model_name in GEMINI_MODELS:
            try:
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                error_str = str(e)
                errors.append(f"Gemini {model_name}: {error_str}")
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "Quota" in error_str:
                    print(f"Gemini Rate limited on {model_name}, trying next...")
                    continue
                print(f"Gemini Error on {model_name}: {error_str}")
                continue

    # 2. Try OpenAI Fallback
    openai_client = get_openai_client()
    if openai_client:
        openai_models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]
        for model_name in openai_models:
            try:
                response = openai_client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.7,
                )
                if response.choices[0].message.content:
                    return response.choices[0].message.content.strip()
            except Exception as e:
                error_str = str(e)
                errors.append(f"OpenAI {model_name}: {error_str}")
                if "429" in error_str:
                    print(f"OpenAI Rate limited on {model_name}, trying next...")
                    continue
                print(f"OpenAI Error on {model_name}: {error_str}")
                continue

    # All models exhausted
    error_details = " | ".join(errors)
    raise HTTPException(
        status_code=500,
        detail=f"AI features failed. Details: {error_details}"
    )
