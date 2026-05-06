"""
Shared test fixtures -- in-memory SQLite DB, TestClient, and pre-authenticated
user helpers.  All tests in this suite use these fixtures so the DB is always
clean and each test module gets its own isolated session.
"""
import os
os.environ.setdefault("DEBUG", "False")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("REDIS_ENABLED", "false")
# Force OTP to log-only mode so tests never make real network calls to Resend,
# even when RESEND_API_KEY is populated in .env.  Must be set before any app
# module is imported so _build_provider() sees it on its first invocation.
os.environ["OTP_LOG_ONLY"] = "1"

# Monkey-patch RateLimitMiddleware.dispatch to a passthrough BEFORE app.main is
# imported.  BaseHTTPMiddleware stores self.dispatch_func = self.dispatch at
# __init__ time; patching the class here means every instance (including those
# created lazily inside build_middleware_stack on the first request) will
# inherit the no-op, so no test ever gets a 429.
from app.middleware.rate_limit import RateLimitMiddleware as _RLM

async def _noop_dispatch(self, request, call_next):
    return await call_next(request)

_RLM.dispatch = _noop_dispatch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

# In-memory SQLite -- one engine per test session
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def client():
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest.fixture(autouse=True)
def clear_client_cookies(client):
    """Wipe any cookies the session-scoped client picked up during the test.

    The session client shares a cookie jar across all tests.  Without this,
    a login in test A leaks its access_token cookie into test B, making
    "unauthenticated" assertions fail.
    """
    yield
    client.cookies.clear()


# Convenience helpers

def register_user(client, username, email, password="Password1"):
    return client.post("/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "phone_number": "+10000000001",
        "location": "Test City",
    })


def login_user(client, username, password="Password1"):
    resp = client.post("/auth/login", data={"username": username, "password": password})
    assert resp.status_code == 200, resp.text
    # Clear any Set-Cookie the server returned so the session-scoped client
    # doesn't accidentally authenticate "unauthenticated" test requests via cookie.
    client.cookies.clear()
    return resp.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# Session-scoped shared users

@pytest.fixture(scope="session")
def user_a(client):
    register_user(client, "user_a", "user_a@test.com")
    token = login_user(client, "user_a")
    return {"token": token, "headers": auth_headers(token)}


@pytest.fixture(scope="session")
def user_b(client):
    register_user(client, "user_b", "user_b@test.com")
    token = login_user(client, "user_b")
    return {"token": token, "headers": auth_headers(token)}


@pytest.fixture(scope="session")
def admin_user(client):
    """Create an admin user by directly promoting via DB after registration."""
    register_user(client, "admin_user", "admin@test.com")
    db = TestingSessionLocal()
    from app import models
    u = db.query(models.User).filter(models.User.username == "admin_user").first()
    u.is_admin = True
    db.commit()
    db.close()
    token = login_user(client, "admin_user")
    return {"token": token, "headers": auth_headers(token)}


# JPEG / PNG magic bytes for upload tests
JPEG_MAGIC = b"\xff\xd8\xff\xe0" + b"\x00" * 12
PNG_MAGIC  = b"\x89PNG\r\n\x1a\n" + b"\x00" * 8

def fake_jpeg(name="test.jpg") -> tuple:
    """Return (name, bytes, content_type) for multipart uploads."""
    return (name, JPEG_MAGIC, "image/jpeg")

def fake_png(name="test.png") -> tuple:
    return (name, PNG_MAGIC, "image/png")


# ── SQLite / Postgres divergence notes ────────────────────────────────────────
#
# The test suite runs against an in-memory SQLite database for speed and
# zero-dependency CI.  SQLAlchemy abstracts most differences, but a few
# known divergences exist:
#
# 1. ILIKE  — SQLAlchemy translates `.ilike()` to LIKE on SQLite (which is
#    case-insensitive by default) and to ILIKE on Postgres.  Behaviour is
#    equivalent for ASCII text; non-ASCII case-folding differs.
#
# 2. JSON columns — `Column(JSON)` stores as TEXT in SQLite vs native JSONB
#    in Postgres.  JSON path operators (`->`, `->>`, `@>`) are Postgres-only
#    and will raise OperationalError on SQLite.  The codebase currently reads
#    JSON columns as Python objects via SQLAlchemy ORM (safe), but never
#    queries inside them at the DB level (safe).  If that changes, add a
#    `postgres_only` marker.
#
# 3. RETURNING clause — Postgres supports `INSERT … RETURNING`; SQLite ≥3.35
#    does too, but older SQLite versions do not.  We use ORM `.add()` +
#    `.refresh()` everywhere, so this is not an issue.
#
# 4. Constraints — Postgres enforces deferrable FK constraints and check
#    constraints at statement level; SQLite enforces them lazily (or not at
#    all without PRAGMA foreign_keys = ON).  The test DB does NOT enable this
#    pragma, so FK violations silently succeed in tests.
#
# Marking Postgres-only tests:
#   @pytest.mark.postgres_only
#   def test_json_path_query(client): ...
#
# The fixture below auto-skips them when running against SQLite.


def pytest_collection_modifyitems(config, items):
    """Skip `postgres_only` tests when the test DB is SQLite (the default)."""
    skip_sqlite = pytest.mark.skip(reason="Requires Postgres — skipped on SQLite test DB")
    for item in items:
        if "postgres_only" in item.keywords:
            item.add_marker(skip_sqlite)
