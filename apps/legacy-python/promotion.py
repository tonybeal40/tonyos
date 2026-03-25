import re
import time
import hashlib
from dataclasses import dataclass
from typing import Tuple

PROMOTE_KEYWORDS = [
    "remember", "save this", "store this", "from now on", "going forward",
    "my preference", "always", "never"
]

FACT_PATTERNS = [
    r"\bi am\b",
    r"\bi prefer\b",
    r"\bi want\b",
    r"\bmy goal\b",
    r"\bi need\b",
    r"\bi will\b"
]


@dataclass
class PromotionResult:
    should_candidate: bool
    memory_type: str
    confidence: float
    cleaned_text: str
    reason: str


def _clean(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def classify_memory_type(user_text: str) -> Tuple[str, float, str]:
    t = (user_text or "").lower()

    if any(k in t for k in ["my goal", "goal is", "i want to", "i need to"]):
        return "goal", 0.70, "goal phrasing"

    if any(k in t for k in ["i prefer", "i like", "i dislike", "i hate", "i love"]):
        return "preference", 0.75, "preference phrasing"

    if any(k in t for k in ["from now on", "going forward", "always", "never", "i will"]):
        return "decision", 0.70, "commitment phrasing"

    if any(re.search(p, t) for p in FACT_PATTERNS):
        return "fact", 0.55, "self-statement pattern"

    return "other", 0.30, "weak signal"


def should_create_candidate(user_text: str) -> PromotionResult:
    raw = _clean(user_text)
    if not raw:
        return PromotionResult(False, "other", 0.0, "", "empty")

    low = raw.lower()

    if any(k in low for k in PROMOTE_KEYWORDS):
        mtype, base, why = classify_memory_type(raw)
        return PromotionResult(True, mtype, min(1.0, base + 0.25), raw, f"explicit: {why}")

    mtype, base, why = classify_memory_type(raw)
    if base >= 0.70:
        return PromotionResult(True, mtype, base, raw, f"strong implicit: {why}")

    return PromotionResult(False, mtype, base, raw, f"not promoted: {why}")


def candidate_id(session_id: str, text: str) -> str:
    h = hashlib.sha256((session_id + "|" + text).encode("utf-8")).hexdigest()
    return h[:24]
