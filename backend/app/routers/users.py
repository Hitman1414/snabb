from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..storage_service import storage
from ..moderation import check_content_safety
from ..utils import get_client_platform
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])

# ─── Magic-byte helpers (audit #4) ───────────────────────────────────────────
_MAGIC = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"GIF8": "image/gif",
    b"RIFF": "image/webp",
}

async def _validate_image_magic(file: UploadFile) -> None:
    header = await file.read(16)
    await file.seek(0)
    for magic, mime in _MAGIC.items():
        if header[: len(magic)] == magic:
            return
    raise HTTPException(
        status_code=400,
        detail="Invalid image file — only JPEG, PNG, GIF, and WebP are accepted",
    )


@router.get("/pros", response_model=List[schemas.User])
def get_pro_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of verified Pro users."""
    # Audit #26: exclude soft-deleted users from public lists.
    query = db.query(models.User).filter(
        models.User.is_pro == True,
        models.User.is_active == True,
        models.User.is_bot == False,
        models.User.is_deleted == False,
    )
    if category:
        query = query.filter(models.User.pro_category == category)
    query = query.order_by(models.User.pro_rating.desc(), models.User.pro_completed_tasks.desc())
    return query.offset(skip).limit(limit).all()


@router.get("/pending-pros", response_model=List[schemas.User])
def get_pending_pros(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Admin-only: get all users with pro_status=pending."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return (
        db.query(models.User)
        .filter(models.User.pro_status == "pending")
        .order_by(models.User.created_at.asc())
        .all()
    )


@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get a public user profile by ID."""
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.is_active == True,
        models.User.is_deleted == False,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/me/avatar", response_model=schemas.User)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload user avatar — magic-byte validated (audit #4)"""
    await _validate_image_magic(file)

    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"avatars/{uuid.uuid4()}.{extension}"

    try:
        avatar_url = storage.upload_file(file.file, filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/id-card", response_model=schemas.User)
async def upload_id_card(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload government ID card for Pro verification — magic-byte validated (audit #4)"""
    await _validate_image_magic(file)

    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"id-cards/{uuid.uuid4()}.{extension}"

    try:
        id_card_url = storage.upload_file(file.file, filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not save file")

    current_user.id_card_url = id_card_url
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/push-token", status_code=status.HTTP_200_OK)
def update_push_token(
    token_data: schemas.PushToken,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update user's Expo Push Token"""
    current_user.expo_push_token = token_data.token
    db.commit()
    return {"message": "Push token updated successfully"}

@router.patch("/me", response_model=schemas.User)
def update_profile(
    request: Request,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update current user's profile information"""
    update_data = user_update.model_dump(exclude_unset=True)

    # Guard against duplicate username
    if "username" in update_data and update_data["username"] != current_user.username:
        existing = db.query(models.User).filter(models.User.username == update_data["username"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    # 1. Moderation check for profile bio
    if "pro_bio" in update_data and update_data["pro_bio"]:
        is_safe, reason = check_content_safety(update_data["pro_bio"])
        if not is_safe:
            logger.warning(f"Profile update blocked by moderation for user {current_user.id}. Reason: {reason}")
            
            # Save moderation log
            platform = get_client_platform(request)
            mod_log = models.ModerationLog(
                user_id=current_user.id,
                content_type="pro_bio_update",
                content_text=update_data["pro_bio"],
                flagged_reason=reason,
                platform=platform
            )
            db.add(mod_log)
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Your bio violates safety guidelines. {reason}"
            )

    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/apply-pro", response_model=schemas.User)
def apply_pro(
    request: Request,
    application: schemas.ProApplication,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Apply to become a Pro user (auto-approves for now)"""
    # Moderation Check
    is_safe, reason = check_content_safety(application.pro_bio)
    if not is_safe:
        platform = get_client_platform(request)
        mod_log = models.ModerationLog(
            user_id=current_user.id,
            content_type="pro_application",
            content_text=application.pro_bio,
            flagged_reason=reason,
            platform=platform
        )
        db.add(mod_log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Your bio violates safety guidelines. {reason}"
        )
        
    # Prevent reapplication if already pending or approved.
    if current_user.pro_status in ("pending", "approved") or current_user.is_pro:
        raise HTTPException(status_code=400, detail="Pro application already submitted or approved")

    current_user.pro_category = application.pro_category
    current_user.pro_bio = application.pro_bio
    if application.id_card_url:
        current_user.id_card_url = application.id_card_url

    # Mark as pending — admin must approve before is_pro / pro_verified are set.
    current_user.pro_status = "pending"
    db.commit()
    db.refresh(current_user)
    logger.info(f"Pro application submitted by user {current_user.id}, status=pending")
    return current_user


@router.post("/{user_id}/approve-pro", response_model=schemas.User)
def approve_pro(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Admin-only: approve a pending Pro application (audit #5)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_pro = True
    user.pro_verified = True
    user.pro_status = "approved"
    db.commit()
    db.refresh(user)
    logger.info(f"Admin {current_user.id} approved Pro application for user {user_id}")
    return user


@router.post("/{user_id}/reject-pro", response_model=schemas.User)
def reject_pro(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Admin-only: reject a pending Pro application."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pro_status = "rejected"
    user.is_pro = False
    user.pro_verified = False
    db.commit()
    db.refresh(user)
    logger.info(f"Admin {current_user.id} rejected Pro application for user {user_id}")
    return user


# ─── Account deletion (audit #26 — GDPR) ──────────────────────────────────
@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_my_account(
    delete_request: schemas.AccountDeleteRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Soft-delete the current user's account.

    GDPR design choices:
    - Soft delete (is_deleted=True, anonymize PII) rather than hard delete,
      because related rows (asks, reviews, payment records) must be retained
      for accounting / regulatory reasons.
    - PII fields are scrubbed: username/email replaced with placeholders;
      avatar and bio cleared.
    - Open asks owned by the user are closed; in-progress asks are left
      alone so the active server isn't surprised — user can manually
      cancel before requesting deletion.
    """
    from datetime import datetime, timezone

    # Re-confirm password before deletion.
    from ..auth import verify_password
    if not verify_password(delete_request.password, current_user.hashed_password):
        raise HTTPException(status_code=403, detail="Incorrect password")

    # Refuse if any ask is in progress — the active server needs to be
    # notified or the user needs to cancel first.
    in_progress = db.query(models.Ask).filter(
        models.Ask.user_id == current_user.id,
        models.Ask.status == "in_progress",
    ).count()
    if in_progress > 0:
        raise HTTPException(
            status_code=400,
            detail=(
                f"You have {in_progress} ask(s) in progress. Please close or "
                f"cancel them before deleting your account."
            ),
        )

    # Auto-close any still-open asks belonging to this user.
    db.query(models.Ask).filter(
        models.Ask.user_id == current_user.id,
        models.Ask.status == "open",
    ).update({"status": "closed"})

    # Scrub PII while preserving the row for FK integrity.
    deleted_marker = f"deleted-user-{current_user.id}"
    current_user.username = deleted_marker
    current_user.email = f"{deleted_marker}@deleted.local"
    current_user.phone_number = None
    current_user.avatar_url = None
    current_user.location = None
    current_user.pro_bio = None
    current_user.expo_push_token = None
    current_user.is_active = False
    current_user.is_deleted = True
    current_user.deleted_at = datetime.now(timezone.utc)

    db.commit()
    logger.info(f"User {current_user.id} soft-deleted (GDPR)")
    return {"message": "Account deleted", "user_id": current_user.id}
