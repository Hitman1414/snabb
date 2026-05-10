from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import json
import os
from app import auth, models
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.moderation import check_content_safety
from app.ai_service import generate_with_fallback
from app.utils import get_client_platform

router = APIRouter(
    prefix="/ai",
    tags=["AI Features"]
)


def check_ai_subscription(user: models.User):
    if user.is_admin or user.ai_override or user.is_ai_subscribed:
        return
    raise HTTPException(
        status_code=402,  # Payment Required
        detail="Snabb AI Pro subscription required to use this feature."
    )


@router.post("/subscribe")
async def toggle_ai_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Toggle AI subscription for testing/demo purposes."""
    current_user.is_ai_subscribed = not current_user.is_ai_subscribed
    db.commit()
    return {"is_ai_subscribed": current_user.is_ai_subscribed}


@router.post("/toggle-override/{user_id}")
async def toggle_ai_override(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Admin only: Toggle AI access override for any user."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.ai_override = not user.ai_override
    db.commit()
    return {"username": user.username, "ai_override": user.ai_override}

# Load categories from shared constants
shared_constants_path = os.path.join(os.path.dirname(__file__), "../../../shared/constants.json")
try:
    with open(shared_constants_path, "r") as f:
        constants = json.load(f)
        ALLOWED_CATEGORIES = constants.get("CATEGORIES", [])
except Exception as e:
    print(f"Warning: Failed to load shared categories: {e}")
    ALLOWED_CATEGORIES = ["Digital & Support", "Food & Delivery", "Home & Repairs", "Errands & Shopping", "Ride & Transport", "Financial Assistance", "Pet Care", "Health & Wellness", "Freelance Tasks", "Other"]


class MagicAskRequest(BaseModel):
    text: str


class EnhanceDescriptionRequest(BaseModel):
    description: str


@router.post("/magic-ask")
async def magic_ask(
    req: Request,
    request: MagicAskRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    check_ai_subscription(current_user)

    # 1. Moderation Check
    is_safe, reason = check_content_safety(request.text)
    if not is_safe:
        platform = get_client_platform(req)
                
        mod_log = models.ModerationLog(
            user_id=current_user.id,
            content_type="magic_ask",
            content_text=request.text,
            flagged_reason=reason,
            platform=platform
        )
        db.add(mod_log)
        db.commit()
        
        raise HTTPException(
            status_code=400,
            detail=reason
        )

    try:
        categories_str = ", ".join(ALLOWED_CATEGORIES)
        prompt = f"""
        You are an AI assistant for a local service marketplace called 'Snabb'. 
        The user wants to post a task and has provided the following raw text:
        "{request.text}"
        
        Extract the details and return a strictly formatted JSON object. 
        The allowed categories are: [{categories_str}].
        If no category perfectly matches, choose 'Other'.
        If no budget is mentioned, leave budget_min and budget_max as null.
        If a single price is mentioned, set it as budget_max and leave budget_min as null.
        If a range is mentioned, set budget_min and budget_max.
        
        You must output ONLY valid JSON in this exact structure, with no markdown formatting or extra text:
        {{
            "title": "A short, clear title (max 50 chars)",
            "description": "A professional, detailed description of what needs to be done. Make it at least 2 sentences.",
            "category": "One of the allowed categories",
            "budget_min": null or a number,
            "budget_max": null or a number
        }}
        """
        response_text = generate_with_fallback(prompt)

        # Clean up in case Gemini returns markdown block
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        try:
            parsed_json = json.loads(response_text)
            return parsed_json
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="AI failed to generate a valid response structure")

    except HTTPException:
        raise
    except Exception as e:
        print(f"AI API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance-description")
async def enhance_description(
    req: Request,
    request: EnhanceDescriptionRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    check_ai_subscription(current_user)

    # 1. Moderation Check
    is_safe, reason = check_content_safety(request.description)
    if not is_safe:
        platform = get_client_platform(req)
                
        mod_log = models.ModerationLog(
            user_id=current_user.id,
            content_type="enhance_description",
            content_text=request.description,
            flagged_reason=reason,
            platform=platform
        )
        db.add(mod_log)
        db.commit()
        
        raise HTTPException(
            status_code=400,
            detail=reason
        )

    try:
        prompt = f"""
        You are an AI assistant for a local service marketplace called 'Snabb'.
        Take the following brief task description and rewrite it to be professional, clear, and comprehensive. 
        It should sound like someone looking to hire a professional.
        Keep it under 4 sentences. Do not add any conversational filler. Just return the enhanced text.
        
        Original description: "{request.description}"
        """
        response_text = generate_with_fallback(prompt)
        return {"enhanced_text": response_text}

    except HTTPException:
        raise
    except Exception as e:
        print(f"AI API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class MagicSearchRequest(BaseModel):
    query: str


@router.post("/magic-search")
async def magic_search(
    request: MagicSearchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    check_ai_subscription(current_user)
    
    # Fetch Pros
    # Limit to top 20 by rating to keep prompt size manageable
    pros = db.query(models.User).filter(models.User.is_pro == True).order_by(models.User.pro_rating.desc()).limit(20).all()
    
    if not pros:
        return []

    # Construct Pros metadata for Gemini
    pros_metadata = []
    for p in pros:
        pros_metadata.append({
            "id": p.id,
            "username": p.username,
            "category": p.pro_category,
            "bio": p.pro_bio[:100] + "..." if p.pro_bio and len(p.pro_bio) > 100 else p.pro_bio,
            "rating": p.pro_rating,
            "completed_tasks": p.pro_completed_tasks
        })
    
    try:
        prompt = f"""
        You are an AI Matchmaker for Snabb, a local service marketplace.
        The user is searching for: "{request.query}"
        
        Here is a list of available Professionals:
        {json.dumps(pros_metadata)}
        
        Task:
        1. Analyze the user's intent from their search query.
        2. Select up to 3 Pros who are the best fit for this specific request.
        3. For each selected Pro, provide a 'match_reason' explaining why they were chosen (e.g., based on their bio, rating, or expertise).
        
        Return ONLY a strictly formatted JSON array of objects:
        [
            {{
                "pro_id": number,
                "match_reason": "string (1 short sentence)"
            }}
        ]
        
        If no good matches are found, return an empty array [].
        Do not include any markdown formatting, no backticks, just the raw JSON array.
        """
        
        response_text = generate_with_fallback(prompt)
        
        # Clean up in case Gemini returns markdown block
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()
        
        try:
            matches = json.loads(response_text)
            # Fetch the full user objects for the matches
            results = []
            for m in matches:
                pro_id = m.get("pro_id")
                reason = m.get("match_reason")
                pro_user = db.query(models.User).filter(models.User.id == pro_id).first()
                if pro_user:
                    results.append({
                        "user": pro_user,
                        "match_reason": reason
                    })
            return results
        except json.JSONDecodeError:
            print(f"AI Search Failed to parse: {response_text}")
            return []

    except Exception as e:
        print(f"AI Search Error: {str(e)}")
        return []
