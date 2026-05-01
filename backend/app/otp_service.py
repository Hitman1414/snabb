"""
OTP service.

Audit #6: real email delivery via Resend (https://resend.com — 3,000
free emails/month). When `RESEND_API_KEY` is unset we fall back to logging
the OTP for local development. SMS providers cost money and have no
permanent free tier, so phone-number identifiers also fall through to the
log fallback for now — left as a TODO in the codebase.

Audit #15: codes generated with `secrets.randbelow`, not `random.randint`.
The `random` module is seeded predictably and is unsafe for security tokens.
"""
from __future__ import annotations

import logging
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Protocol

from .cache import cache_service
from .config import settings

logger = logging.getLogger(__name__)

_OTP_STORE: Dict[str, dict] = {}
OTP_STORE = _OTP_STORE
OTP_TTL_SECONDS = 600
OTP_LENGTH = 6


class EmailProvider(Protocol):
    def send_otp(self, to: str, code: str) -> bool: ...


@dataclass
class LogOnlyProvider:
    def send_otp(self, to: str, code: str) -> bool:
        logger.info("=" * 50)
        logger.info(f"[DEV] OTP for {to}: {code}")
        logger.info("=" * 50)
        return True


class ResendProvider:
    def __init__(self, api_key: str, from_email: str):
        self.api_key = api_key
        self.from_email = from_email

    def send_otp(self, to: str, code: str) -> bool:
        try:
            import resend  # type: ignore
        except ImportError:
            logger.error(
                "RESEND_API_KEY is set but the `resend` package is not installed. "
                "Run: pip install resend"
            )
            return False

        resend.api_key = self.api_key
        try:
            resend.Emails.send({
                "from": self.from_email,
                "to": [to],
                "subject": "Your Snabb verification code",
                "html": _render_email_html(code),
                "text": f"Your Snabb verification code is: {code}\n\nIt expires in 10 minutes.",
            })
            logger.info(f"OTP email sent to {to}")
            return True
        except Exception as e:
            logger.error(f"Resend email send failed: {e}")
            return False


def _render_email_html(code: str) -> str:
    return (
        '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#1a1a1a;">'
        '<h2 style="margin:0 0 16px;font-weight:800;">Your verification code</h2>'
        '<p style="margin:0 0 24px;color:#6b7280;">Enter this code in the Snabb app. It expires in 10 minutes.</p>'
        f'<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;font-size:34px;font-weight:800;letter-spacing:0.4em;">{code}</div>'
        '<p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">If you did not request this, ignore this email.</p>'
        '</div>'
    )


def _build_provider() -> EmailProvider:
    if settings.RESEND_API_KEY:
        return ResendProvider(api_key=settings.RESEND_API_KEY, from_email=settings.OTP_FROM_EMAIL)
    return LogOnlyProvider()


_provider: Optional[EmailProvider] = None


def _get_provider() -> EmailProvider:
    global _provider
    if _provider is None:
        _provider = _build_provider()
    return _provider


def generate_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000:06d}"


def _is_email(identifier: str) -> bool:
    return "@" in identifier and "." in identifier.split("@")[-1]


def _store_code(identifier: str, code: str) -> None:
    if cache_service.enabled and cache_service.redis_client:
        try:
            cache_service.redis_client.setex(f"otp:{identifier}", OTP_TTL_SECONDS, code)
            return
        except Exception as e:
            logger.error(f"Failed to store OTP in Redis: {e}; falling back to in-memory")
    _OTP_STORE[identifier] = {
        "code": code,
        "expires_at": datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS),
    }


def _read_code(identifier: str) -> Optional[str]:
    if cache_service.enabled and cache_service.redis_client:
        try:
            stored = cache_service.redis_client.get(f"otp:{identifier}")
            if stored is not None:
                return stored
        except Exception as e:
            logger.error(f"Failed to read OTP from Redis: {e}; falling back to in-memory")

    record = _OTP_STORE.get(identifier)
    if not record:
        return None
    if record["expires_at"] < datetime.now(timezone.utc):
        _OTP_STORE.pop(identifier, None)
        return None
    return record["code"]


def _consume_code(identifier: str) -> None:
    if cache_service.enabled and cache_service.redis_client:
        try:
            cache_service.redis_client.delete(f"otp:{identifier}")
        except Exception:
            pass
    _OTP_STORE.pop(identifier, None)


def send_otp(identifier: str) -> bool:
    code = generate_otp()
    _store_code(identifier, code)

    if _is_email(identifier):
        return _get_provider().send_otp(identifier, code)

    logger.warning(
        f"SMS OTP requested for {identifier} but no SMS provider is configured. "
        f"Code logged below for development:"
    )
    LogOnlyProvider().send_otp(identifier, code)
    return True


def verify_otp(identifier: str, code: str) -> bool:
    stored = _read_code(identifier)
    if stored is None:
        return False
    if not secrets.compare_digest(stored, code):
        return False
    _consume_code(identifier)
    return True
