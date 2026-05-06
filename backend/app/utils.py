from fastapi import Request

def get_client_platform(request: Request) -> str:
    """Detect client platform from request headers."""
    platform = request.headers.get("x-client-platform")
    if not platform:
        user_agent = request.headers.get("user-agent", "").lower()
        if "mozilla" in user_agent or "chrome" in user_agent or "safari" in user_agent:
            platform = "web"
        else:
            platform = "unknown"
    return platform
