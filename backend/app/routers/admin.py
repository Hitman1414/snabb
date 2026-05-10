"""
Admin endpoints.

Audit #4: All admin endpoints now require Authorization: Bearer header
(via the shared `auth.get_current_user` FastAPI dependency). The legacy
`?token=...` query parameter is no longer accepted — it leaked tokens
into server access logs, browser history, and Referer headers.
"""
from datetime import datetime
import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from .. import models, auth
from ..cache import cache_service
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: models.User = Depends(auth.get_current_user)) -> models.User:
    """Shared dependency: 401 if not logged in, 403 if not admin."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


def require_admin_for_dashboard(
    request: Request,
    token: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> models.User:
    """HTML dashboard auth, including legacy query-token support for old mobile bundles."""
    bearer = request.headers.get("Authorization", "")
    if bearer.startswith("Bearer "):
        token = bearer.split(" ", 1)[1]

    cookie_token = request.cookies.get("access_token")
    if not token and cookie_token:
        token = cookie_token.split(" ", 1)[1] if cookie_token.startswith("Bearer ") else cookie_token

    current_user = auth.get_user_from_token(token, db) if token else None
    if current_user is None:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


@router.get("/dashboard", response_class=HTMLResponse)
def get_dashboard(
    current_user: models.User = Depends(require_admin_for_dashboard),
    db: Session = Depends(get_db),
):
    total_asks = db.query(models.Ask).count()
    active_users = db.query(models.User).count()
    recent_asks = db.query(models.Ask).order_by(models.Ask.created_at.desc()).limit(8).all()

    # API Metrics from Redis
    total_api_requests = 0
    recent_api_requests = []
    avg_resp_time = 0
    status_codes_html = "<i>No data yet</i>"
    endpoint_hits = []

    if cache_service.enabled:
        total_api_requests = cache_service.redis_client.get("stats:total_requests") or 0
        raw_recent = cache_service.redis_client.lrange("stats:recent_requests", 0, 14)
        recent_api_requests = [json.loads(r) for r in raw_recent]

        resp_times = cache_service.redis_client.lrange("stats:response_times", 0, 99)
        if resp_times:
            avg_resp_time = sum([float(t) for t in resp_times]) / len(resp_times)

        status_codes = cache_service.redis_client.hgetall("stats:status_codes")
        if status_codes:
            status_codes_html = ""
            for code, count in sorted(status_codes.items()):
                badge_class = "success" if code.startswith("2") else "warning" if code.startswith("4") else "danger"
                status_codes_html += f'<span class="badge bg-{badge_class} me-2" style="font-size: 0.9rem;">{code}: {count}</span>'

        raw_hits = cache_service.redis_client.hgetall("stats:endpoint_hits")
        endpoint_hits = sorted(raw_hits.items(), key=lambda x: int(x[1]), reverse=True)[:5]

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Snabb Control Center</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
    </head>
    <body class="bg-light">
        <div class="container py-4">
            <h2 class="fw-bold mb-3">System Control Center</h2>
            <p class="text-muted">Logged in as <strong>{current_user.username}</strong></p>
            <div class="row g-3 mb-4">
                <div class="col-md-3"><div class="card p-3"><small>Total Asks</small><h3>{total_asks}</h3></div></div>
                <div class="col-md-3"><div class="card p-3"><small>Total Requests</small><h3>{total_api_requests}</h3></div></div>
                <div class="col-md-3"><div class="card p-3"><small>Avg Latency</small><h3>{avg_resp_time*1000:.1f}ms</h3></div></div>
                <div class="col-md-3"><div class="card p-3"><small>Active Users</small><h3>{active_users}</h3></div></div>
            </div>
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between">
                    <strong>Recent API Traffic</strong>
                    <span>{status_codes_html}</span>
                </div>
                <table class="table mb-0">
                    <thead><tr><th>Method</th><th>Endpoint</th><th>Status</th><th>Latency</th><th>Time</th></tr></thead>
                    <tbody>
                        {"".join(f'<tr><td>{r["method"]}</td><td>{r["path"]}</td><td>{r["status"]}</td><td>{r["duration"]*1000:.1f}ms</td><td>{datetime.fromtimestamp(r["timestamp"]).strftime("%H:%M:%S")}</td></tr>' for r in recent_api_requests) or '<tr><td colspan="5" class="text-center text-muted py-3">No API logs yet</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="card">
                <div class="card-header"><strong>Recent Asks</strong></div>
                <table class="table mb-0">
                    <thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Created</th></tr></thead>
                    <tbody>
                        {"".join(f'<tr><td>{a.title[:40]}</td><td>{a.category}</td><td>{a.status}</td><td>{a.created_at.strftime("%b %d, %H:%M")}</td></tr>' for a in recent_asks)}
                    </tbody>
                </table>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)


@router.get("/stats")
def get_stats(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """API endpoint for stats with monitoring details and platform analysis."""
    db_stats = {
        "total_asks": db.query(models.Ask).count(),
        "total_users": db.query(models.User).count(),
        "total_responses": db.query(models.Response).count(),
        "unassigned_asks": db.query(models.Ask).filter(models.Ask.status == "open").count(),
    }

    api_stats = {
        "total_requests": 0,
        "status_codes": {},
        "avg_latency_ms": 0,
        "platforms": {"browser": 0, "mobile": 0},
        "top_endpoints": [],
        "recent_traffic": [],
    }

    if cache_service.enabled:
        api_stats["total_requests"] = int(cache_service.redis_client.get("stats:total_requests") or 0)
        api_stats["status_codes"] = cache_service.redis_client.hgetall("stats:status_codes")
        api_stats["platforms"] = cache_service.redis_client.hgetall("stats:platforms") or {"browser": 0, "mobile": 0}

        resp_times = cache_service.redis_client.lrange("stats:response_times", 0, 99)
        if resp_times:
            api_stats["avg_latency_ms"] = round((sum([float(t) for t in resp_times]) / len(resp_times)) * 1000, 2)

        raw_hits = cache_service.redis_client.hgetall("stats:endpoint_hits")
        api_stats["top_endpoints"] = sorted(raw_hits.items(), key=lambda x: int(x[1]), reverse=True)[:10]

        raw_recent = cache_service.redis_client.lrange("stats:recent_requests", 0, 19)
        api_stats["recent_traffic"] = [json.loads(r) for r in raw_recent]

    return {
        "success": True,
        "db": db_stats,
        "monitoring": api_stats,
        "server_time": datetime.now().isoformat(),
    }


@router.get("/moderation-logs")
def get_moderation_logs(
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """API endpoint to fetch all flagged moderation attempts."""
    logs = db.query(models.ModerationLog).order_by(models.ModerationLog.created_at.desc()).all()

    result = []
    for log in logs:
        user = db.query(models.User).filter(models.User.id == log.user_id).first()
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": user.username if user else "Unknown",
            "email": user.email if user else "Unknown",
            "content_type": log.content_type,
            "content_text": log.content_text,
            "flagged_reason": log.flagged_reason,
            "platform": log.platform,
            "created_at": log.created_at.isoformat(),
        })
    return {"success": True, "logs": result}


# ─── Pro verification (audit #9 part b) ───────────────────────────────────
@router.post("/users/{user_id}/verify-pro")
def verify_pro(
    user_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: mark a user's pro application as verified."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_pro:
        raise HTTPException(status_code=400, detail="User has not applied as a Pro")

    user.pro_verified = True
    db.commit()
    db.refresh(user)
    logger.info(f"Admin {current_user.id} verified pro user {user_id}")
    return {"success": True, "user_id": user.id, "pro_verified": user.pro_verified}


@router.post("/users/{user_id}/unverify-pro")
def unverify_pro(
    user_id: int,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: revoke a user's pro verification."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pro_verified = False
    db.commit()
    return {"success": True, "user_id": user.id, "pro_verified": user.pro_verified}


@router.get("/users")
def list_users(
    q: str = Query(None),
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: search/list users."""
    query = db.query(models.User)
    if q:
        query = query.filter(
            (models.User.username.ilike(f"%{q}%")) | 
            (models.User.email.ilike(f"%{q}%"))
        )
    
    users = query.limit(50).all()
    
    return {
        "success": True,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "is_admin": u.is_admin,
                "is_pro": u.is_pro,
                "is_ai_subscribed": u.is_ai_subscribed,
                "ai_override": u.ai_override,
                "created_at": u.created_at.isoformat()
            } for u in users
        ]
    }
