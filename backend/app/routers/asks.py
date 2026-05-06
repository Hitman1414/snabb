from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Form, File, UploadFile, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Annotated
from datetime import datetime, timezone
import logging
import json
import math
import io

from .. import models, schemas, auth
from ..database import get_db
from ..config import settings
from ..cache import cache_service
from ..bot_service import process_new_ask
from ..storage_service import storage
from ..moderation import check_content_safety

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/asks", tags=["asks"])


# ─── File upload validation (audit #13) ───────────────────────────────────
# Magic bytes for the image formats we accept. We sniff the first few bytes
# of the uploaded stream rather than trusting the client's content-type
# header, which is trivially spoofable.
_IMAGE_MAGIC = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"RIFF": "image/webp",      # plus offset 8: "WEBP"
}
_ALLOWED_MIME = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _sniff_image_mime(head: bytes) -> Optional[str]:
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if head.startswith(b"RIFF") and b"WEBP" in head[:16]:
        return "image/webp"
    return None


def _validate_image_upload(image: UploadFile, max_size_bytes: int) -> bytes:
    """Read upload into memory, verify magic + size. Returns the bytes."""
    image.file.seek(0)
    data = image.file.read(max_size_bytes + 1)
    if len(data) > max_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Image '{image.filename}' exceeds the {max_size_bytes // (1024 * 1024)}MB limit",
        )
    sniffed = _sniff_image_mime(data[:16])
    if sniffed is None or sniffed not in _ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"File '{image.filename}' is not a supported image (jpeg/png/gif/webp)",
        )
    return data


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
    sort: Optional[str] = Query("latest", description="Sort by: latest, nearby, most_rated"),
    db: Session = Depends(get_db)
):
    """Get paginated list of asks with advanced filters."""
    cache_key = f"asks_list:{skip}:{limit}:{search}:{category}:{status}:{min_budget}:{max_budget}:{lat}:{lng}:{radius_km}:{sort}"
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

    # ─── Proximity filter (audit #20) ───────────────────────────────────
    # Old behavior: when lat/lng was provided we ALWAYS included rows with
    # null coordinates, which polluted nearby-results with every legacy ask.
    # New behavior: when sort==nearby, exclude rows without coordinates
    # entirely. For the default "latest" sort with explicit lat/lng we still
    # show coord-less asks (they remain discoverable) — but ONLY if no
    # geographic intent is implied by `sort`.
    is_nearby_sort = sort == "nearby"
    if lat is not None and lng is not None:
        radius = radius_km if radius_km is not None else 30.0
        lat_delta = radius / 111.0
        import math
        cos_lat = math.cos(math.radians(lat))
        if abs(cos_lat) < 0.0001:
            cos_lat = 0.0001
        lng_delta = radius / (111.0 * cos_lat)

        in_box = (
            (models.Ask.latitude >= lat - lat_delta) &
            (models.Ask.latitude <= lat + lat_delta) &
            (models.Ask.longitude >= lng - lng_delta) &
            (models.Ask.longitude <= lng + lng_delta)
        )
        if is_nearby_sort:
            # Strict: only asks with coordinates in the bounding box.
            query = query.filter(in_box)
        else:
            # Lenient: include uncoded asks AND in-box asks.
            query = query.filter((models.Ask.latitude == None) | in_box)
    elif radius_km is not None and (lat is None or lng is None):
        logger.warning(
            f"Proximity search requested with radius_km={radius_km} but missing "
            f"coordinates (lat={lat}, lng={lng})"
        )

    from sqlalchemy import func

    count_query = query.add_columns(func.count().over().label('total_count'))

    if sort == "most_rated":
        results = count_query.join(models.User, models.Ask.user_id == models.User.id).order_by(
            models.User.pro_rating.desc(), models.Ask.created_at.desc()
        ).offset(skip).limit(limit).all()
    else:
        results = count_query.order_by(models.Ask.created_at.desc()).offset(skip).limit(limit).all()

    asks = [r[0] for r in results] if results else []
    total = results[0][1] if results else 0

    response_data = {
        "items": [jsonable_encoder(schemas.Ask.model_validate(ask)) for ask in asks],
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + limit) < total
    }

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

    asks = db.query(models.Ask).options(
        joinedload(models.Ask.responses)
    ).filter(
        models.Ask.user_id == current_user.id
    ).order_by(
        models.Ask.created_at.desc()
    ).offset(skip).limit(limit).all()

    result = []
    for ask in asks:
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

    interested_ask_ids = db.query(models.Response.ask_id).filter(
        models.Response.user_id == current_user.id,
        models.Response.is_interested
    ).distinct().subquery()

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
    request: Request,
    background_tasks: BackgroundTasks,
    title: Annotated[str, Form()],
    description: Annotated[str, Form()],
    category: Annotated[str, Form()],
    location: Annotated[str, Form()],
    budget_min: Annotated[Optional[float], Form()] = None,
    budget_max: Annotated[Optional[float], Form()] = None,
    latitude: Annotated[Optional[float], Form()] = None,
    longitude: Annotated[Optional[float], Form()] = None,
    contact_phone: Annotated[Optional[str], Form()] = None,
    images: Annotated[List[UploadFile], File()] = [],
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    logger.info(f"User {current_user.id} creating ask: {title}")

    # 1. Moderation Check
    combined_text = f"{title}\n{description}"
    is_safe, reason = check_content_safety(combined_text)
    if not is_safe:
        logger.warning(f"Ask creation blocked by moderation for user {current_user.id}. Reason: {reason}")

        platform = get_client_platform(request)

        mod_log = models.ModerationLog(
            user_id=current_user.id,
            content_type="ask_creation",
            content_text=combined_text,
            flagged_reason=reason,
            platform=platform
        )
        db.add(mod_log)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content violates safety guidelines. {reason}"
        )

    # ─── Audit #13: validate file content + cap image count ──────────────
    real_images = [img for img in (images or []) if img and img.filename]
    if len(real_images) > settings.MAX_IMAGES_PER_ASK:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {settings.MAX_IMAGES_PER_ASK} images per ask",
        )

    max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    image_urls: List[str] = []
    for image in real_images:
        # Read + validate FIRST so we never touch S3 with junk.
        data = _validate_image_upload(image, max_bytes)
        # Re-wrap as a stream for the storage layer.
        import io
        url = storage.upload_file(io.BytesIO(data), image.filename, image.content_type)
        if url:
            image_urls.append(url)

    db_ask = models.Ask(
        title=title,
        description=description,
        category=category,
        location=location,
        budget_min=budget_min,
        budget_max=budget_max,
        latitude=latitude,
        longitude=longitude,
        contact_phone=contact_phone,
        images=image_urls if image_urls else None,
        user_id=current_user.id
    )

    try:
        db.add(db_ask)
        db.commit()
        db.refresh(db_ask)
        logger.info(f"Ask {db_ask.id} created successfully with {len(image_urls)} images.")

        cache_service.delete_pattern("asks_list:*")

        background_tasks.add_task(process_new_ask, db_ask.id)

        return db_ask
    except Exception as e:
        logger.error(f"Failed to save ask to database: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred"
        )


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
        raise HTTPException(status_code=404, detail="Ask not found")
    if db_ask.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this ask")

    for key, value in ask_update.model_dump(exclude_unset=True).items():
        setattr(db_ask, key, value)

    db.commit()
    db.refresh(db_ask)

    cache_service.delete_pattern("asks_list:*")
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
        raise HTTPException(status_code=404, detail="Ask not found")
    if db_ask.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this ask")

    # Audit #12: do not allow deletion of asks that are actively being worked.
    # The server has accepted the bid; silent deletion would leave them
    # stranded. Asker must close or cancel first.
    if db_ask.status == "in_progress":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete an ask that is in progress. Close or cancel it first.",
        )

    db.delete(db_ask)
    db.commit()

    cache_service.delete_pattern("asks_list:*")
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
        raise HTTPException(status_code=404, detail="Ask not found")
    if db_ask.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to close this ask")

    server_user: Optional[models.User] = None
    if server_id:
        server_user = db.query(models.User).filter(models.User.id == server_id).first()
        if not server_user:
            raise HTTPException(status_code=404, detail="Server user not found")
        db_ask.server_id = server_id

    db_ask.status = "closed"

    # Audit #8: increment the server's completed_tasks counter on close.
    if server_user is not None:
        server_user.pro_completed_tasks = (server_user.pro_completed_tasks or 0) + 1

    # Audit #10: capture held funds when the asker confirms the work is done.
    # We only attempt this if a PaymentIntent has been authorized for this ask.
    if db_ask.payment_intent_id and db_ask.payment_status in ("authorized", "pending"):
        if settings.STRIPE_SECRET_KEY:
            try:
                import stripe
                stripe.api_key = settings.STRIPE_SECRET_KEY
                stripe.PaymentIntent.capture(db_ask.payment_intent_id)
                logger.info(f"Captured PaymentIntent {db_ask.payment_intent_id} on close of ask {ask_id}")
            except Exception as e:
                # Don't block the close; the webhook + retry endpoint will recover.
                logger.error(f"Capture on close failed for ask {ask_id}: {e}")
        # Optimistically mark paid; the webhook is the authoritative source.
        db_ask.payment_status = "paid"
        db_ask.paid_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(db_ask)

    cache_service.delete_pattern("asks_list:*")
    logger.info(f"Ask {ask_id} closed successfully (server_id: {server_id})")
    return db_ask
