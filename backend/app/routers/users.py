from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..storage_service import storage
import uuid

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me/avatar", response_model=schemas.User)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload user avatar"""
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{extension}"
    
    # Save file via storage service
    try:
        avatar_url = storage.upload_file(file.file, filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
        
    current_user.avatar_url = avatar_url
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
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update current user's profile information"""
    update_data = user_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user
