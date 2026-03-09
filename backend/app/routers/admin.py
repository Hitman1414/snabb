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
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # In a real app, you would check if current_user.is_admin
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Not an admin")

    total_asks = db.query(models.Ask).count()
    active_users = db.query(models.User).count()
    total_responses = db.query(models.Response).count()
    
    recent_asks = db.query(models.Ask).order_by(models.Ask.created_at.desc()).limit(5).all()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Snabb Admin Dashboard</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
            body {{ background-color: #f8f9fa; padding: 20px; }}
            .stats-card {{ border-radius: 15px; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .sidebar {{ height: 100vh; background: #212529; color: white; padding: 20px; }}
        </style>
    </head>
    <body>
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-2 sidebar">
                    <h3>Snabb Admin</h3>
                    <hr>
                    <ul class="nav flex-column">
                        <li class="nav-item"><a class="nav-link text-white" href="#">Overview</a></li>
                        <li class="nav-item"><a class="nav-link text-white" href="#">Users</a></li>
                        <li class="nav-item"><a class="nav-link text-white" href="#">Asks</a></li>
                        <li class="nav-item"><a class="nav-link text-white" href="#">Payments</a></li>
                    </ul>
                </div>
                <div class="col-md-10">
                    <nav class="navbar navbar-light bg-white mb-4 rounded shadow-sm">
                        <div class="container-fluid">
                            <span class="navbar-brand mb-0 h1">System Overview</span>
                            <span>Logged in as: <strong>{current_user.username}</strong></span>
                        </div>
                    </nav>
                    
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <div class="card stats-card p-4 text-center">
                                <h1 class="text-primary">{total_asks}</h1>
                                <p class="text-secondary">Total Asks</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card stats-card p-4 text-center">
                                <h1 class="text-success">{active_users}</h1>
                                <p class="text-secondary">Active Users</p>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card stats-card p-4 text-center">
                                <h1 class="text-info">{total_responses}</h1>
                                <p class="text-secondary">Total Bids</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card shadow-sm border-0 rounded-3">
                        <div class="card-header bg-white">
                            <h5 class="mb-0">Recent Asks</h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {"".join([f'<tr><td>{a.title}</td><td>{a.category}</td><td><span class="badge bg-secondary">{a.status}</span></td><td>{a.created_at.strftime("%Y-%m-%d %H:%M")}</td></tr>' for a in recent_asks])}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """API endpoint for stats (used by mobile app if needed)"""
    return {
        "total_asks": db.query(models.Ask).count(),
        "total_users": db.query(models.User).count(),
        "total_responses": db.query(models.Response).count()
    }
