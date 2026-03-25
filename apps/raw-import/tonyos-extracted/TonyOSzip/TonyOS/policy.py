from dataclasses import dataclass
from typing import Dict, List, Any

APP_CAPABILITIES: Dict[str, List[str]] = {
    "AI Chat": ["chat", "plan", "write", "explain", "summarize", "research"],
    "CRM": ["analyze", "summarize", "suggest_next_steps", "draft_outreach"],
    "Jobs": ["match", "gap_analysis", "resume_edit", "interview_prep", "summarize"],
    "Journal": ["reflect", "reframe", "extract_lessons", "summarize"],
    "Outreach": ["write_copy", "personalize", "tone_check", "sequence"],
    "Money": ["budget", "summarize", "plan"]
}

CROSS_APP_ACCESS: Dict[str, List[str]] = {
    "AI Chat": ["AI Chat", "CRM", "Jobs", "Journal", "Outreach", "Money"],
    "CRM": ["CRM", "Outreach"],
    "Jobs": ["Jobs", "CRM"],
    "Outreach": ["Outreach", "CRM", "Journal"],
    "Journal": ["Journal"],
    "Money": ["Money"]
}

ALLOWED_MODES: Dict[str, List[str]] = {
    "AI Chat": ["truth", "deep", "fast", "code"],
    "CRM": ["truth", "deep"],
    "Jobs": ["truth", "deep"],
    "Journal": ["deep"],
    "Outreach": ["truth", "deep"],
    "Money": ["truth", "deep"]
}


@dataclass
class PolicyDecision:
    ok: bool
    reason: str
    app: str
    mode: str
    allowed_apps_for_memory: List[str]
    capabilities: List[str]


def normalize_app(app: str) -> str:
    a = (app or "").strip()
    return a if a else "AI Chat"


def enforce_policy(app: str, mode: str, intent: str) -> PolicyDecision:
    app = normalize_app(app)
    mode = (mode or "truth").strip()

    capabilities = APP_CAPABILITIES.get(app, [])
    allowed_modes = ALLOWED_MODES.get(app, ["truth"])
    allowed_mem_apps = CROSS_APP_ACCESS.get(app, [app])

    if mode not in allowed_modes:
        return PolicyDecision(
            ok=False,
            reason=f"Mode '{mode}' is not allowed for {app}. Allowed: {', '.join(allowed_modes)}",
            app=app,
            mode=mode,
            allowed_apps_for_memory=allowed_mem_apps,
            capabilities=capabilities
        )

    if intent and capabilities and intent not in capabilities:
        return PolicyDecision(
            ok=False,
            reason=f"Intent '{intent}' is not allowed for {app}. Allowed: {', '.join(capabilities)}",
            app=app,
            mode=mode,
            allowed_apps_for_memory=allowed_mem_apps,
            capabilities=capabilities
        )

    return PolicyDecision(
        ok=True,
        reason="ok",
        app=app,
        mode=mode,
        allowed_apps_for_memory=allowed_mem_apps,
        capabilities=capabilities
    )
