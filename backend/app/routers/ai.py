from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import json
from app import auth, models
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.moderation import check_content_safety
from app.ai_service import generate_with_fallback

router = APIRouter(
    prefix="/ai",
    tags=["AI Features"]
)



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
    # 1. Moderation Check
    is_safe, reason = check_content_safety(request.text)
    if not is_safe:
        platform = req.headers.get("x-client-platform")
        if not platform:
            user_agent = req.headers.get("user-agent", "").lower()
            if "mozilla" in user_agent or "chrome" in user_agent or "safari" in user_agent:
                platform = "web"
            else:
                platform = "unknown"
                
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
            detail=f"Content violates safety guidelines. {reason}"
        )

    try:
        prompt = f"""
        You are an AI assistant for a local service marketplace called 'Snabb'. 
        The user wants to post a task and has provided the following raw text:
        "{request.text}"
        
        Extract the details and return a strictly formatted JSON object. 
        The allowed categories are: [Electronics, Furniture, Vehicles, Real Estate, Services, Jobs, Education, Fashion, Sports, Other].
        If no category perfectly matches, choose 'Services'.
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
    # 1. Moderation Check
    is_safe, reason = check_content_safety(request.description)
    if not is_safe:
        platform = req.headers.get("x-client-platform")
        if not platform:
            user_agent = req.headers.get("user-agent", "").lower()
            if "mozilla" in user_agent or "chrome" in user_agent or "safari" in user_agent:
                platform = "web"
            else:
                platform = "unknown"
                
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
            detail=f"Content violates safety guidelines. {reason}"
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
