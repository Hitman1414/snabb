import logging
import re
from typing import Tuple
from app.config import settings

logger = logging.getLogger(__name__)

# ── Layer 1: Offline keyword blocklist (zero API calls, instant) ──────────────
BLOCKED_PATTERNS = [
    # Sexual content
    r'\bsex\s*(addict|partner|worker|slave|service)\b',
    r'\bescort\b', r'\bprostitut\b', r'\bhooker\b', r'\bcall\s*girl\b',
    r'\bone\s*night\s*stand\b', r'\bnsfw\b', r'\bporn\b',
    r'\bnude\b', r'\bnaked\b', r'\berotic\b', r'\bstrip(per|tease)\b',
    
    # Violence & crime
    r'\b(need|hire|find|want|get)\s*(a\s*)?(rapist|murderer|killer|hitman|assassin|thief|robber|hacker)\b',
    r'\brape\b', r'\brapist\b', r'\bmurder(er)?\b', r'\bkill(er|ing)?\b',
    r'\bhitman\b', r'\bassassin\b', r'\bassault\b', r'\bkidnap\b',
    r'\barson\b', r'\bbomb\b', r'\bterroris[tm]\b',
    
    # Drugs
    r'\b(buy|sell|need|get)\s*(weed|cocaine|meth|heroin|drugs|lsd|mdma|ecstasy)\b',
    r'\bdrug\s*dealer\b', r'\bnarcotics\b',
    
    # Weapons
    r'\b(buy|sell|need|get)\s*(a\s*)?(gun|firearm|weapon|explosive)\b',
    r'\billegal\s*weapon\b', r'\bunlicensed\s*(gun|firearm)\b',
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in BLOCKED_PATTERNS]


def _check_keyword_blocklist(text: str) -> Tuple[bool, str]:
    """Layer 1: Instant regex-based blocklist check. No API calls."""
    for pattern in COMPILED_PATTERNS:
        match = pattern.search(text)
        if match:
            reason = f"Blocked by content filter: matched prohibited pattern '{match.group()}'"
            logger.warning(f"Keyword blocklist flagged: {reason}")
            return False, reason
    return True, ""


def _check_openai_moderation(text: str) -> Tuple[bool, str]:
    """Layer 2: OpenAI Moderation API (fast, free, accurate)."""
    try:
        if not settings.OPENAI_API_KEY:
            return True, ""  # Skip if no key
            
        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        response = client.moderations.create(input=text)
        result = response.results[0]
        
        if result.flagged:
            flagged_categories = [cat for cat, flagged in result.categories.model_dump().items() if flagged]
            reason = f"Content flagged for: {', '.join(flagged_categories)}"
            logger.warning(f"Moderation API flagged text: {reason}")
            return False, reason
            
        return True, ""
    except Exception as e:
        logger.error(f"OpenAI Moderation API failed: {e}")
        return True, ""  # Can't determine, let other layers decide


def _check_llm_moderation(text: str) -> Tuple[bool, str]:
    """Layer 3: LLM-based contextual analysis (catches nuanced violations)."""
    try:
        from app.ai_service import generate_with_fallback
        
        prompt = f"""
        You are a strict safety and moderation AI for a local service marketplace app. 
        Users post "Asks" (jobs they need done) or "Serves" (services they offer).
        
        Analyze the following user input and determine if it violates our safety policies.
        VIOLATIONS INCLUDE:
        - Soliciting or offering sexual services (sex partners, escorts, etc.)
        - Soliciting or offering illegal acts (murder, assault, theft, hacking, etc.)
        - Hate speech, harassment, or extreme profanity.
        
        User Input: "{text}"
        
        If the content is SAFE, output exactly: "SAFE"
        If the content is UNSAFE, output exactly: "UNSAFE: [Brief reason why]"
        
        Respond ONLY with "SAFE" or "UNSAFE: [Reason]". Do not add any other text.
        """
        
        response_text = generate_with_fallback(prompt)
        response_text = response_text.strip().upper()
        
        if response_text.startswith("UNSAFE"):
            reason = response_text.replace("UNSAFE:", "").strip()
            logger.warning(f"LLM Moderation flagged text: {reason}")
            return False, reason
            
        return True, ""
    except Exception as e:
        logger.error(f"LLM Moderation failed: {e}")
        return True, ""  # Can't determine, let other layers decide


def check_content_safety(text: str) -> Tuple[bool, str]:
    """
    Multi-layer content safety check.
    
    Layer 1: Keyword blocklist (instant, offline, catches obvious violations)
    Layer 2: OpenAI Moderation API (fast, free, catches nuanced content)
    Layer 3: LLM contextual check (catches marketplace-specific violations)
    
    FAIL-CLOSED: If Layer 1 catches it, block immediately.
    Layers 2 & 3 are best-effort — if both APIs are down, Layer 1 still protects.
    """
    if not text or len(text.strip()) == 0:
        return True, ""

    # Layer 1: Keyword blocklist — ALWAYS runs, zero dependencies
    is_safe, reason = _check_keyword_blocklist(text)
    if not is_safe:
        return False, reason

    # Layer 2: OpenAI Moderation API
    is_safe, reason = _check_openai_moderation(text)
    if not is_safe:
        return False, reason

    # Layer 3: LLM contextual check
    is_safe, reason = _check_llm_moderation(text)
    if not is_safe:
        return False, reason

    return True, ""
