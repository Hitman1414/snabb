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
    """Layer 1: Instant regex-based blocklist check. No API calls, zero latency."""
    for pattern in COMPILED_PATTERNS:
        match = pattern.search(text)
        if match:
            reason = f"Blocked by content filter: matched prohibited pattern '{match.group()}'"
            logger.warning(f"Keyword blocklist flagged: {reason}")
            return False, reason
    return True, ""


def _check_gemini_moderation(text: str) -> Tuple[bool, str]:
    """
    Layer 2: Gemini quick-scan moderation (replaces OpenAI Moderation API).
    Uses a fast, structured prompt designed for binary SAFE/UNSAFE classification.
    This is intentionally lightweight — a short, focused prompt for speed.
    """
    try:
        if not settings.GEMINI_API_KEY:
            return True, ""  # Skip if no key configured

        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Lightweight prompt — binary classification only, no explanation needed
        prompt = f"""You are a content safety classifier for a local service marketplace app.

Classify the following user input as SAFE or UNSAFE.

UNSAFE content includes: sexual services, illegal activities, drug dealing, weapons trafficking, hate speech, harassment, or violence.

User Input: "{text}"

Reply with ONLY one word: SAFE or UNSAFE"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        if response and response.text:
            result = response.text.strip().upper()
            if result.startswith("UNSAFE"):
                reason = "Prohibited or harmful content detected."
                logger.warning(f"Gemini moderation scan flagged text: {reason}")
                return False, reason

        return True, ""
    except Exception as e:
        logger.error(f"Gemini moderation scan failed: {e}")
        return True, ""  # Fail-open for Layer 2 — Layer 3 is the deeper check


def _check_llm_moderation(text: str) -> Tuple[bool, str]:
    """
    Layer 3: Gemini contextual analysis (catches nuanced, marketplace-specific violations).
    Uses a detailed prompt to catch sophisticated evasions that bypass the keyword list
    and the quick-scan in Layer 2.
    """
    try:
        from app.ai_service import generate_with_fallback

        prompt = f"""You are a strict safety and moderation AI for a local service marketplace app called Snabb. 
Users post "Asks" (jobs they need done) or "Serves" (services they offer).

Analyze the following user input and determine if it violates our safety policies.
VIOLATIONS INCLUDE:
- Soliciting or offering sexual services (sex partners, escorts, etc.)
- Soliciting or offering illegal acts (murder, assault, theft, hacking, etc.)
- Hate speech, harassment, or extreme profanity.
- Drug dealing or weapons trafficking (even with coded language).

User Input: "{text}"

If the content is SAFE, output exactly: "SAFE"
If the content is UNSAFE, output exactly: "UNSAFE: [Brief reason why]"

Respond ONLY with "SAFE" or "UNSAFE: [Reason]". Do not add any other text."""

        response_text = generate_with_fallback(prompt)
        response_text = response_text.strip().upper()

        if response_text.startswith("UNSAFE"):
            reason = response_text.replace("UNSAFE:", "").strip()
            logger.warning(f"LLM contextual moderation flagged text: {reason}")
            return False, reason

        return True, ""
    except Exception as e:
        logger.error(f"LLM contextual moderation failed: {e}")
        return True, ""  # Fail-open — Layer 1 already caught the obvious violations


def check_content_safety(text: str) -> Tuple[bool, str]:
    """
    Multi-layer content safety check powered entirely by Google Gemini.

    Layer 1: Keyword blocklist (instant, offline, catches obvious violations)
    Layer 2: Gemini quick-scan (fast binary classifier, catches standard violations)
    Layer 3: Gemini contextual LLM check (catches nuanced/coded marketplace violations)

    FAIL-CLOSED on Layer 1: if the regex fires, block immediately — no API call needed.
    Layers 2 & 3 are best-effort — if the Gemini API is down, Layer 1 still protects.
    """
    if not text or len(text.strip()) == 0:
        return True, ""

    # Layer 1: Blocklist (Regex) - The "Shield"
    is_safe, reason = _check_keyword_blocklist(text)
    if not is_safe:
        return False, reason

    # Layer 2: Gemini Fast Scan (Binary Classifier) - The "Sword"
    is_safe, reason = _check_gemini_moderation(text)
    if not is_safe:
        return False, f"This content violates our safety guidelines: {reason}"

    # Layer 3: Gemini Contextual LLM (Deep Analysis) - The "Brain"
    is_safe, reason = _check_llm_moderation(text)
    if not is_safe:
        return False, f"Safety violation: {reason}"

    return True, ""
