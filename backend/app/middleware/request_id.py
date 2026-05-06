"""
X-Request-ID middleware.

Stamps every incoming request with a unique ID (UUID4).  If the client
already supplies one we use theirs (useful for end-to-end tracing from the
mobile / web app).  The ID is:

  1. Stored in a thread-local-style context var so any logger inside the
     request handler can read it via `get_request_id()`.
  2. Echoed in the response header so the client can correlate with its own
     logs.
  3. Injected into Sentry's scope so every event includes the request ID.
"""
import uuid
from contextvars import ContextVar
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

_request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


def get_request_id() -> str:
    """Return the request ID for the current async context."""
    return _request_id_var.get()


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = _request_id_var.set(request_id)

        # Inject into Sentry scope so every event has the request ID
        try:
            import sentry_sdk
            sentry_sdk.set_tag("request_id", request_id)
        except Exception:
            pass

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        _request_id_var.reset(token)
        return response
