"""
Shared AI generation utilities.
Extracted from routers/ai.py to avoid circular imports with moderation.py.

Uses Google Gemini exclusively. Model priority list tries each in order
if one is rate-limited or unavailable.
"""
from fastapi import HTTPException
from google import genai
from .config import settings

# Model priority list — gemini-2.5-flash is the primary model.
# Falls back through stable models if rate-limited.
GEMINI_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]


def get_gemini_client():
    """Get a configured Gemini client using the google-genai SDK."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


def generate_with_fallback(prompt: str) -> str:
    """
    Generate content using Gemini with automatic model fallback.
    Tries each model in GEMINI_MODELS in order.
    Raises HTTPException if all models fail.
    """
    errors = []

    gemini_client = get_gemini_client()
    if not gemini_client:
        raise HTTPException(
            status_code=503,
            detail="AI features are not configured. Please set GEMINI_API_KEY."
        )

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
                print(f"Gemini rate limited on {model_name}, trying next model...")
                continue
            # For non-rate-limit errors, still try the next model
            print(f"Gemini error on {model_name}: {error_str}")
            continue

    # All models exhausted
    error_details = " | ".join(errors)
    raise HTTPException(
        status_code=500,
        detail=f"AI generation failed across all Gemini models. Details: {error_details}"
    )
