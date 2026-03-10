from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from .. import models, auth
from ..database import get_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard", response_class=HTMLResponse)
def get_dashboard(
    token: str = None,
    db: Session = Depends(get_db)
):
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
        
    current_user = auth.get_current_user(token, db)
    
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not an admin")
    import json
    from ..cache import cache_service
    from datetime import datetime

    total_asks = db.query(models.Ask).count()
    active_users = db.query(models.User).count()
    total_responses = db.query(models.Response).count()
    
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

        # Endpoint popularity
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
        <style>
            :root {{ --snabb-primary: #FF7E5F; --snabb-dark: #1A1C1E; }}
            body {{ background-color: #f0f2f5; font-family: 'Inter', sans-serif; }}
            .sidebar {{ min-height: 100vh; background: var(--snabb-dark); color: white; padding: 25px; }}
            .nav-link {{ color: #adb5bd; transition: 0.3s; border-radius: 8px; margin-bottom: 5px; }}
            .nav-link:hover, .nav-link.active {{ background: rgba(255,255,255,0.1); color: white; }}
            .card {{ border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: transform 0.2s; }}
            .card:hover {{ transform: translateY(-5px); }}
            .stats-icon {{ width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }}
            .table thead th {{ border-top: none; color: #6c757d; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; }}
        </style>
    </head>
    <body>
        <div class="container-fluid">
            <div class="row">
                <!-- Sidebar -->
                <div class="col-md-2 d-none d-md-block sidebar shadow">
                    <div class="d-flex align-items-center mb-4">
                        <i class="bi bi-rocket-takeoff-fill me-2 fs-3 text-warning"></i>
                        <h4 class="mb-0">Snabb Pro</h4>
                    </div>
                    <hr class="opacity-10">
                    <ul class="nav flex-column">
                        <li class="nav-item"><a class="nav-link active" href="#"><i class="bi bi-speedometer2 me-2"></i> Dashboard</a></li>
                        <li class="nav-item"><a class="nav-link" href="#"><i class="bi bi-people me-2"></i> User Manager</a></li>
                        <li class="nav-item"><a class="nav-link" href="#"><i class="bi bi-chat-left-dots me-2"></i> Moderation</a></li>
                        <li class="nav-item"><a class="nav-link" href="#"><i class="bi bi-graph-up me-2"></i> Analytics</a></li>
                        <li class="nav-item"><a class="nav-link" href="#"><i class="bi bi-gear me-2"></i> API Config</a></li>
                    </ul>
                </div>

                <!-- Main Content -->
                <div class="col-md-10 p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 class="fw-bold mb-0">System Control Center</h2>
                            <p class="text-muted small">Real-time monitoring and management</p>
                        </div>
                        <div class="d-flex align-items-center">
                            <div class="text-end me-3">
                                <p class="mb-0 fw-semibold">{current_user.username}</p>
                                <span class="badge bg-primary">ADMIN</span>
                            </div>
                            <img src="https://ui-avatars.com/api/?name={current_user.username}&background=random" class="rounded-circle" width="45">
                        </div>
                    </div>
                    
                    <!-- Top Stats -->
                    <div class="row g-4 mb-4">
                        <div class="col-md-3">
                            <div class="card p-3">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <p class="text-muted small mb-1">Total Asks</p>
                                        <h3 class="fw-bold">{total_asks}</h3>
                                    </div>
                                    <div class="stats-icon bg-primary-subtle text-primary"><i class="bi bi-cart-check"></i></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card p-3">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <p class="text-muted small mb-1">Total Requests</p>
                                        <h3 class="fw-bold">{total_api_requests}</h3>
                                    </div>
                                    <div class="stats-icon bg-success-subtle text-success"><i class="bi bi-activity"></i></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card p-3">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <p class="text-muted small mb-1">Avg Latency</p>
                                        <h3 class="fw-bold">{avg_resp_time*1000:.1f}ms</h3>
                                    </div>
                                    <div class="stats-icon bg-info-subtle text-info"><i class="bi bi-clock-history"></i></div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card p-3">
                                <div class="d-flex justify-content-between">
                                    <div>
                                        <p class="text-muted small mb-1">Active Users</p>
                                        <h3 class="fw-bold">{active_users}</h3>
                                    </div>
                                    <div class="stats-icon bg-warning-subtle text-warning"><i class="bi bi-people"></i></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="row g-4">
                        <!-- Recent Activity -->
                        <div class="col-md-8">
                            <div class="card shadow-sm mb-4">
                                <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                    <h5 class="mb-0 fw-bold">Recent API Traffic</h5>
                                    <div id="status-badges">{status_codes_html}</div>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-hover align-middle mb-0">
                                            <thead class="bg-light">
                                                <tr>
                                                    <th class="ps-4">Method</th>
                                                    <th>Endpoint</th>
                                                    <th>Status</th>
                                                    <th>Latency</th>
                                                    <th>Time</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {"".join([f'''
                                                <tr>
                                                    <td class="ps-4"><span class="badge bg-secondary-subtle text-dark border">{r['method']}</span></td>
                                                    <td class="text-primary fw-medium">{r['path']}</td>
                                                    <td><span class="badge bg-{'success' if str(r['status']).startswith('2') else 'danger' if str(r['status']).startswith('5') else 'warning'}">{r['status']}</span></td>
                                                    <td>{r['duration']*1000:.1f}ms</td>
                                                    <td class="text-muted small">{datetime.fromtimestamp(r['timestamp']).strftime('%H:%M:%S')}</td>
                                                </tr>
                                                ''' for r in recent_api_requests]) if recent_api_requests else '<tr><td colspan="5" class="text-center py-4 text-muted">No API logs available yet. Make some requests in the app!</td></tr>'}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div class="card shadow-sm">
                                <div class="card-header bg-white py-3">
                                    <h5 class="mb-0 fw-bold">Recent Asks Marketplace</h5>
                                </div>
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-hover align-middle mb-0">
                                            <thead class="bg-light">
                                                <tr>
                                                    <th class="ps-4">Ask Details</th>
                                                    <th>Category</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {"".join([f'''
                                                <tr>
                                                    <td class="ps-4">
                                                        <div class="fw-bold">{a.title[:40]}...</div>
                                                        <div class="text-muted small">ID: #{a.id}</div>
                                                    </td>
                                                    <td><span class="badge rounded-pill bg-info-subtle text-info border border-info">{a.category}</span></td>
                                                    <td><span class="badge bg-{'success' if a.status=='open' else 'secondary'}">{a.status}</span></td>
                                                    <td class="text-muted small">{a.created_at.strftime("%b %d, %H:%M")}</td>
                                                </tr>
                                                ''' for a in recent_asks])}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Side Metrics -->
                        <div class="col-md-4">
                            <div class="card shadow-sm p-4 mb-4 bg-dark text-white">
                                <h5 class="fw-bold mb-4"><i class="bi bi-fire me-2 text-warning"></i>Popular Endpoints</h5>
                                {"".join([f'''
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span class="text-white-50 small">{path}</span>
                                        <span class="fw-bold">{count}</span>
                                    </div>
                                    <div class="progress" style="height: 6px;">
                                        <div class="progress-bar bg-warning" style="width: {(int(count)/int(total_api_requests)*100) if total_api_requests else 0}%"></div>
                                    </div>
                                </div>
                                ''' for path, count in endpoint_hits]) if endpoint_hits else '<p class="text-muted">No traffic data</p>'}
                            </div>

                            <div class="card shadow-sm p-4">
                                <h5 class="fw-bold mb-3">Service Health</h5>
                                <div class="d-flex align-items-center mb-3">
                                    <div class="flex-grow-1">
                                        <div class="fw-bold">Database (Supabase)</div>
                                        <div class="small text-success"><i class="bi bi-check-circle-fill me-1"></i>Connected</div>
                                    </div>
                                    <div class="ms-3 text-success fs-4"><i class="bi bi-database-check"></i></div>
                                </div>
                                <div class="d-flex align-items-center mb-3">
                                    <div class="flex-grow-1">
                                        <div class="fw-bold">Cache (Redis)</div>
                                        <div class="small text-{'success' if cache_service.enabled else 'danger'}">
                                            <i class="bi bi-{'check-circle-fill' if cache_service.enabled else 'exclamation-circle-fill'} me-1"></i>
                                            {'Active' if cache_service.enabled else 'Offline'}
                                        </div>
                                    </div>
                                    <div class="ms-3 text-{'success' if cache_service.enabled else 'danger'} fs-4">
                                        <i class="bi bi-lightning-charge"></i>
                                    </div>
                                </div>
                                <button class="btn btn-outline-primary w-100 mt-3" onclick="location.reload()">
                                    <i class="bi bi-arrow-clockwise me-2"></i>Refresh Live Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
    return HTMLResponse(content=html_content)

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """API endpoint for stats with monitoring details"""
    from ..cache import cache_service
    
    db_stats = {
        "total_asks": db.query(models.Ask).count(),
        "total_users": db.query(models.User).count(),
        "total_responses": db.query(models.Response).count()
    }
    
    api_stats = {}
    if cache_service.enabled:
        api_stats = {
            "total_requests": int(cache_service.redis_client.get("stats:total_requests") or 0),
            "status_codes": cache_service.redis_client.hgetall("stats:status_codes"),
            "avg_latency_ms": 0
        }
        resp_times = cache_service.redis_client.lrange("stats:response_times", 0, 99)
        if resp_times:
             api_stats["avg_latency_ms"] = round((sum([float(t) for t in resp_times]) / len(resp_times)) * 1000, 2)
             
    return {**db_stats, "api_monitor": api_stats}
