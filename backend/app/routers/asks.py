from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Form, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Annotated
import logging
from .. import models, schemas, auth
from ..database import get_db
from ..config import settings
from ..cache import cache_service
from ..bot_service import process_new_ask_sync
from ..storage_service import storage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/asks", tags=["asks"])

@router.get("", response_model=dict)
def get_asks(
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE, description="Number of items to return"),
    search: Optional[str] = Query(None, description="Search term for title/description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by status (open/closed)"),
    min_budget: Optional[float] = Query(None, description="Minimum budget"),
    max_budget: Optional[float] = Query(None, description="Maximum budget"),
    lat: Optional[float] = Query(None, description="Latitude for proximity search"),
    lng: Optional[float] = Query(None, description="Longitude for proximity search"),
    radius_km: Optional[float] = Query(30.0, description="Radius in kilometers for proximity search"),
    db: Session = Depends(get_db)
):
    """Get paginated list of asks with advanced filters."""
    # Try to get from cache first
    cache_key = f"asks_list:{skip}:{limit}:{search}:{category}:{status}:{min_budget}:{max_budget}:{lat}:{lng}:{radius_km}"
    cached_data = cache_service.get(cache_key)
    if cached_data:
        import json
        return JSONResponse(
            content=json.loads(cached_data),
            headers={
                "Cache-Control": f"public, max-age={settings.CACHE_TTL}",
                "X-Cache": "HIT"
            }
        )

    logger.info(f"Fetching asks - search: {search}, category: {category}, status: {status}")
    
    # Build query with eager loading for user data
    query = db.query(models.Ask).options(joinedload(models.Ask.user))
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.Ask.title.ilike(search_term)) | 
            (models.Ask.description.ilike(search_term))
        )
    
    if category:
        query = query.filter(models.Ask.category == category)
    if status:
        query = query.filter(models.Ask.status == status)
    if min_budget:
        query = query.filter(models.Ask.budget_min >= min_budget)
    if max_budget:
        query = query.filter(models.Ask.budget_max <= max_budget)
        
    if lat is not None and lng is not None and radius_km:
        lat_delta = radius_km / 111.0
        import math
        lng_delta = radius_km / (111.0 * math.cos(math.radians(lat))) if lat != 0 else radius_km / 111.0
        
        query = query.filter(
            models.Ask.latitude >= lat - lat_delta,
            models.Ask.latitude <= lat + lat_delta,
            models.Ask.longitude >= lng - lng_delta,
            models.Ask.longitude <= lng + lng_delta
        )
    
    total = query.count()
    asks = query.order_by(models.Ask.created_at.desc()).offset(skip).limit(limit).all()
    
    # Return paginated response with metadata
    response_data = {
        "items": [jsonable_encoder(schemas.Ask.model_validate(ask)) for ask in asks],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }
    
    # Store in cache
    import json
    cache_service.set(cache_key, json.dumps(response_data), ttl=settings.CACHE_TTL)
    
    return JSONResponse(
        content=response_data,
        headers={
            "Cache-Control": f"public, max-age={settings.CACHE_TTL}",
            "X-Total-Count": str(total),
            "X-Cache": "MISS"
        }
    )

@router.get("/my", response_model=List[dict])
@router.get("/my-asks", response_model=List[dict])
def get_my_asks(
    skip: int = Query(0, ge=0),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"Fetching asks for user {current_user.id} (skip: {skip}, limit: {limit})")
    
    # Eager load responses to avoid N+1 problem
    asks = db.query(models.Ask).options(
        joinedload(models.Ask.responses)
    ).filter(
        models.Ask.user_id == current_user.id
    ).order_by(
        models.Ask.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    result = []
    for ask in asks:
        # Since responses are eager loaded, len(ask.responses) won't trigger new queries
        ask_dict = schemas.Ask.model_validate(ask).model_dump()
        ask_dict['response_count'] = len(ask.responses)
        ask_dict['interested_count'] = sum(1 for r in ask.responses if r.is_interested)
        result.append(ask_dict)
    
    logger.info(f"Found {len(result)} asks for user {current_user.id}")
    return result

@router.get("/interested", response_model=List[schemas.Ask])
def get_interested_asks(
    skip: int = Query(0, ge=0),
    limit: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get all asks where the current user has responses marked as interested"""
    logger.info(f"Fetching interested asks for user {current_user.id} (skip: {skip}, limit: {limit})")
    
    # Find all responses by current user that are marked as interested
    # We use a subquery to get unique ask IDs efficiently
    interested_ask_ids = db.query(models.Response.ask_id).filter(
        models.Response.user_id == current_user.id,
        models.Response.is_interested == True
    ).distinct().subquery()
    
    # Fetch the asks with pagination
    asks = db.query(models.Ask).filter(
        models.Ask.id.in_(interested_ask_ids)
    ).order_by(
        models.Ask.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    logger.info(f"Found {len(asks)} interested asks for user {current_user.id}")
    return asks

@router.get("/{ask_id}", response_model=schemas.Ask)
def get_ask(ask_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching ask {ask_id}")
    ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
    if not ask:
        logger.warning(f"Ask {ask_id} not found")
        raise HTTPException(status_code=404, detail="Ask not found")
    return ask

@router.post("", response_model=schemas.Ask, status_code=status.HTTP_201_CREATED)
async def create_ask(
    background_tasks: BackgroundTasks,
    title: Annotated[str, Form()],
    description: Annotated[str, Form()],
    category: Annotated[str, Form()],
    location: Annotated[str, Form()],
    budget_min: Annotated[Optional[float], Form()] = None,
    budget_max: Annotated[Optional[float], Form()] = None,
    latitude: Annotated[Optional[float], Form()] = None,
    longitude: Annotated[Optional[float], Form()] = None,
    images: Annotated[List[UploadFile], File()] = [],
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} creating ask: {title}")
    
    # Process image uploads to S3
    image_urls = []
    if images:
        for image in images:
            if image and image.filename:
                # Use original filename for extension check
                extension = image.filename.split(".")[-1] if "." in image.filename else "jpg"
                url = storage.upload_file(image.file, image.filename, image.content_type)
                if url:
                    image_urls.append(url)

    # Reconstruct the Ask object manually since we're using Form data instead of JSON
    db_ask = models.Ask(
        title=title,
        description=description,
        category=category,
        location=location,
        budget_min=budget_min,
        budget_max=budget_max,
        latitude=latitude,
        longitude=longitude,
        images=image_urls if image_urls else None,
        user_id=current_user.id
    )
    
    db.add(db_ask)
    db.commit()
    db.refresh(db_ask)
    logger.info(f"Ask {db_ask.id} created successfully with {len(image_urls)} images.")
    
    # Trigger bot processing
    background_tasks.add_task(process_new_ask_sync, db_ask.id)
    
    return db_ask

@router.put("/{ask_id}", response_model=schemas.Ask)
def update_ask(
    ask_id: int,
    ask_update: schemas.AskUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} updating ask {ask_id}")
    db_ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
    if not db_ask:
        logger.warning(f"Ask {ask_id} not found")
        raise HTTPException(status_code=404, detail="Ask not found")
    if db_ask.user_id != current_user.id:
        logger.warning(f"User {current_user.id} not authorized to update ask {ask_id}")
        raise HTTPException(status_code=403, detail="Not authorized to update this ask")
    
    for key, value in ask_update.model_dump(exclude_unset=True).items():
        setattr(db_ask, key, value)
    
    db.commit()
    db.refresh(db_ask)
    logger.info(f"Ask {ask_id} updated successfully")
    return db_ask

@router.delete("/{ask_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ask(
    ask_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} deleting ask {ask_id}")
    db_ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
    if not db_ask:
        logger.warning(f"Ask {ask_id} not found")
        raise HTTPException(status_code=404, detail="Ask not found")
    if db_ask.user_id != current_user.id:
        logger.warning(f"User {current_user.id} not authorized to delete ask {ask_id}")
        raise HTTPException(status_code=403, detail="Not authorized to delete this ask")
    
    db.delete(db_ask)
    db.commit()
    logger.info(f"Ask {ask_id} deleted successfully")
    return None

@router.post("/{ask_id}/close", response_model=schemas.Ask)
def close_ask(
    ask_id: int,
    server_id: Optional[int] = Query(None, description="ID of the user who fulfilled the ask"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} closing ask {ask_id}")
    db_ask = db.query(models.Ask).filter(models.Ask.id == ask_id).first()
    if not db_ask:
        logger.warning(f"Ask {ask_id} not found")
        raise HTTPException(status_code=404, detail="Ask not found")
    if db_ask.user_id != current_user.id:
        logger.warning(f"User {current_user.id} not authorized to close ask {ask_id}")
        raise HTTPException(status_code=403, detail="Not authorized to close this ask")
    
    # If server_id provided, verify user exists
    if server_id:
        server = db.query(models.User).filter(models.User.id == server_id).first()
        if not server:
            raise HTTPException(status_code=404, detail="Server user not found")
        db_ask.server_id = server_id

    db_ask.status = "closed"
    db.commit()
    db.refresh(db_ask)
    logger.info(f"Ask {ask_id} closed successfully (server_id: {server_id})")
    return db_ask
