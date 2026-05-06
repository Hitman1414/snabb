"""
Review Router
Handles review creation, retrieval, updates, and deletion
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=schemas.Review, status_code=status.HTTP_201_CREATED)
def create_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new review"""
    # Validate rating range
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )
    
    # Check if ask exists
    ask = db.query(models.Ask).filter(models.Ask.id == review.ask_id).first()
    if not ask:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ask not found"
        )
    
    # Check if ask is closed
    if ask.status != "closed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only review closed asks"
        )
    
    # Check if user is part of the ask (either asker or responder)
    is_asker = ask.user_id == current_user.id
    is_responder = db.query(models.Response).filter(
        models.Response.ask_id == review.ask_id,
        models.Response.user_id == current_user.id
    ).first() is not None
    
    if not (is_asker or is_responder):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be part of this ask to leave a review"
        )
    
    # Check if user is trying to review themselves
    if review.reviewee_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot review yourself"
        )
    
    # Check if review already exists
    existing_review = db.query(models.Review).filter(
        models.Review.ask_id == review.ask_id,
        models.Review.reviewer_id == current_user.id,
        models.Review.reviewee_id == review.reviewee_id
    ).first()
    
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this user for this ask"
        )
    
    # Create review
    db_review = models.Review(
        **review.model_dump(),
        reviewer_id=current_user.id
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    # Audit #7: keep User.pro_rating in sync with the reviews table so the
    # /users/pros listing (which sorts on this column) reflects new reviews.
    _recompute_pro_rating(db, review.reviewee_id)

    # Re-query with joinedload to populate nested user objects for the response
    db_review = db.query(models.Review).options(
        joinedload(models.Review.reviewer),
        joinedload(models.Review.reviewee)
    ).filter(models.Review.id == db_review.id).first()

    logger.info(f"Review created: {db_review.id} by user {current_user.id}")
    return db_review


def _recompute_pro_rating(db: Session, user_id: int) -> None:
    """Recompute and persist a user's pro_rating from the reviews table."""
    from sqlalchemy import func

    avg = db.query(func.avg(models.Review.rating)).filter(
        models.Review.reviewee_id == user_id
    ).scalar()
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is not None:
        user.pro_rating = float(avg) if avg is not None else 0.0
        db.commit()


@router.get("/ask/{ask_id}", response_model=List[schemas.Review])
def get_ask_reviews(
    ask_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific ask"""
    reviews = db.query(models.Review).options(
        joinedload(models.Review.reviewer),
        joinedload(models.Review.reviewee)
    ).filter(
        models.Review.ask_id == ask_id
    ).all()
    return reviews


@router.get("/user/{user_id}", response_model=List[schemas.Review])
def get_user_reviews(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews received by a user"""
    reviews = db.query(models.Review).options(
        joinedload(models.Review.reviewer),
        joinedload(models.Review.reviewee)
    ).filter(
        models.Review.reviewee_id == user_id
    ).all()
    return reviews


@router.get("/user/{user_id}/rating")
def get_user_rating(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get average rating for a user"""
    from sqlalchemy import func
    
    result = db.query(
        func.avg(models.Review.rating).label('average_rating'),
        func.count(models.Review.id).label('review_count')
    ).filter(
        models.Review.reviewee_id == user_id
    ).first()
    
    return {
        "user_id": user_id,
        "average_rating": float(result.average_rating) if result.average_rating else 0.0,
        "review_count": result.review_count
    }


@router.put("/{review_id}", response_model=schemas.Review)
def update_review(
    review_id: int,
    review_update: schemas.ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing review"""
    db_review = db.query(models.Review).filter(
        models.Review.id == review_id
    ).first()
    
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Check if user owns the review
    if db_review.reviewer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own reviews"
        )
    
    # Validate rating if provided
    if review_update.rating is not None:
        if review_update.rating < 1 or review_update.rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be between 1 and 5"
            )
    
    # Update review
    update_data = review_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_review, field, value)

    db.commit()
    db.refresh(db_review)

    # Audit #7: recompute averaged rating after edit.
    _recompute_pro_rating(db, db_review.reviewee_id)

    logger.info(f"Review updated: {review_id} by user {current_user.id}")
    return db_review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a review"""
    db_review = db.query(models.Review).filter(
        models.Review.id == review_id
    ).first()
    
    if not db_review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    # Check if user owns the review
    if db_review.reviewer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews"
        )
    
    reviewee_id = db_review.reviewee_id
    db.delete(db_review)
    db.commit()

    # Audit #7: recompute averaged rating after deletion.
    _recompute_pro_rating(db, reviewee_id)

    logger.info(f"Review deleted: {review_id} by user {current_user.id}")
    return None
