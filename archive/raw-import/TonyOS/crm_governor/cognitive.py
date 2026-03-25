"""
TonyOS Cognitive Layer
Operator intelligence, not automation.

- Protects attention
- Forces second-order thinking
- Separates confidence from certainty
- Stops momentum mistakes
- Aligns actions with identity
- Helps recovery and closure
"""
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

ATTENTION_LOG = os.path.join(DATA_DIR, 'attention_log.json')
MOMENTUM_LOG = os.path.join(DATA_DIR, 'momentum_log.json')
SESSIONS_LOG = os.path.join(DATA_DIR, 'sessions_log.json')

def _ensure_file(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            json.dump([], f)

# ===== ATTENTION CONTROL =====

class Attention:
    IGNORE = "ignore"
    MONITOR = "monitor"
    ACT_NOW = "act_now"

URGENT_SIGNALS = ["HUMAN_REVIEW", "DECISION_FAILED", "PIPELINE_CRITICAL", "STALE_ASSUMPTION"]
MONITOR_SIGNALS = ["DECISION_COMPLETE", "RESEARCH_COMPLETE", "OUTCOME_LOGGED", "ASSUMPTION_ADDED"]

def classify_attention(signal_type):
    """Decide what deserves attention and what doesn't."""
    if signal_type in URGENT_SIGNALS:
        return Attention.ACT_NOW
    if signal_type in MONITOR_SIGNALS:
        return Attention.MONITOR
    return Attention.IGNORE

def log_attention_decision(signal_type, decision, context=None):
    """Log attention classification for learning."""
    _ensure_file(ATTENTION_LOG)
    with open(ATTENTION_LOG, 'r') as f:
        data = json.load(f)
    
    data.append({
        'signal': signal_type,
        'decision': decision,
        'context': context,
        'time': datetime.now().isoformat()
    })
    
    with open(ATTENTION_LOG, 'w') as f:
        json.dump(data[-100:], f, indent=2)  # Keep last 100

# ===== SECOND-ORDER THINKING =====

def second_order_check(action, next_implication):
    """Force consideration of what this action creates next."""
    return {
        'action': action,
        'next_implication': next_implication,
        'acknowledged': True,
        'time': datetime.now().isoformat()
    }

def get_second_order_prompt(action):
    """Get prompts for common second-order effects."""
    prompts = {
        'send_email': "This creates follow-up responsibility. Are you ready for that?",
        'cold_outreach': "This opens a relationship. What's the next touch if they respond?",
        'pricing_quote': "This sets expectations. Is this the number you'll defend?",
        'meeting_request': "This commits your time. Is this the best use of the next hour?",
        'commit': "This becomes permanent history. Is this the message you want recorded?",
        'publish': "This is public and searchable. Are you ready for that visibility?"
    }
    return prompts.get(action.lower(), "What does this action force next?")

# ===== CONFIDENCE vs CERTAINTY =====

class ConfidenceLevel:
    SPECULATION = "speculation"      # Gut feeling, no data
    INFORMED_GUESS = "informed_guess"  # Some signals, not verified
    SUPPORTED = "supported"          # Multiple data points align
    VERIFIED = "verified"            # Confirmed by direct evidence

def tag_confidence(statement, level, evidence=None):
    """Tag a statement with confidence level."""
    return {
        'statement': statement,
        'confidence_level': level,
        'evidence': evidence,
        'time': datetime.now().isoformat()
    }

def get_confidence_warning(level):
    """Get appropriate warning for confidence level."""
    warnings = {
        ConfidenceLevel.SPECULATION: "This is a guess. Do not act on it alone.",
        ConfidenceLevel.INFORMED_GUESS: "This has some support but isn't verified.",
        ConfidenceLevel.SUPPORTED: "Multiple signals align. Reasonable to act.",
        ConfidenceLevel.VERIFIED: "This is confirmed. Proceed with confidence."
    }
    return warnings.get(level, "Unknown confidence level.")

# ===== MOMENTUM GUARD =====

def momentum_check(action, limit=3, window_minutes=10):
    """Prevent streak mistakes by limiting repeated actions."""
    _ensure_file(MOMENTUM_LOG)
    
    with open(MOMENTUM_LOG, 'r') as f:
        recent_actions = json.load(f)
    
    cutoff = datetime.now() - timedelta(minutes=window_minutes)
    
    # Filter to recent window
    recent_actions = [
        a for a in recent_actions 
        if datetime.fromisoformat(a['time']) > cutoff
    ]
    
    # Add current action
    recent_actions.append({
        'action': action,
        'time': datetime.now().isoformat()
    })
    
    # Save back
    with open(MOMENTUM_LOG, 'w') as f:
        json.dump(recent_actions[-50:], f, indent=2)
    
    # Count same action
    count = sum(1 for a in recent_actions if a['action'] == action)
    
    return {
        'allowed': count <= limit,
        'count': count,
        'limit': limit,
        'reason': f"Momentum limit reached ({count}/{limit})" if count > limit else None
    }

# ===== IDENTITY ALIGNMENT =====

def identity_check(action, aligns_with_identity, identity_note=None):
    """Check if action aligns with who you want to be."""
    return {
        'action': action,
        'aligns_with_identity': aligns_with_identity,
        'identity_note': identity_note,
        'time': datetime.now().isoformat()
    }

def get_identity_prompt(action):
    """Get identity-checking prompts."""
    return f"Would future-you stand behind '{action}'? Is this the operator you want to be?"

# ===== SESSION RECOVERY =====

def close_session(summary, wins=None, learnings=None, next_focus=None):
    """Close a work session cleanly - mental hygiene."""
    _ensure_file(SESSIONS_LOG)
    
    with open(SESSIONS_LOG, 'r') as f:
        sessions = json.load(f)
    
    session = {
        'closed': True,
        'summary': summary,
        'wins': wins or [],
        'learnings': learnings or [],
        'next_focus': next_focus,
        'time': datetime.now().isoformat()
    }
    
    sessions.append(session)
    
    with open(SESSIONS_LOG, 'w') as f:
        json.dump(sessions[-30:], f, indent=2)  # Keep last 30 sessions
    
    return session

def get_recent_sessions(limit=5):
    """Get recent session closes for continuity."""
    _ensure_file(SESSIONS_LOG)
    with open(SESSIONS_LOG, 'r') as f:
        sessions = json.load(f)
    return sessions[-limit:]

# ===== PRE-ACTION GATE (ties it together) =====

def pre_action_gate(action, aligns_with_identity=True, momentum_limit=3):
    """
    Main gate before any significant action.
    Checks momentum and identity alignment.
    """
    # Check momentum
    momentum = momentum_check(action, limit=momentum_limit)
    if not momentum['allowed']:
        return {
            'allowed': False,
            'reason': momentum['reason'],
            'gate': 'momentum'
        }
    
    # Check identity
    if not aligns_with_identity:
        return {
            'allowed': False,
            'reason': 'Identity misalignment - would future-you stand behind this?',
            'gate': 'identity'
        }
    
    return {
        'allowed': True,
        'second_order_prompt': get_second_order_prompt(action)
    }
