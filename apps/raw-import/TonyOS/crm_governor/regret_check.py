"""
Regret Minimization Check
Before irreversible actions, ask: "If this goes wrong, will I regret it?"
Adult decision-making encoded.
"""
from datetime import datetime

IRREVERSIBLE_ACTIONS = [
    'send_email',
    'send_message', 
    'publish',
    'export',
    'commit',
    'cold_outreach',
    'pricing_quote',
    'contract_send'
]

def needs_regret_check(action):
    """Check if an action should trigger a regret check."""
    return action.lower() in IRREVERSIBLE_ACTIONS

def regret_check(action, downside, acceptable, notes=None):
    """
    Perform a regret minimization check.
    
    Args:
        action: The action being considered
        downside: What's the worst case?
        acceptable: Is that downside acceptable? True/False
        notes: Additional context
    
    Returns:
        Dict with proceed recommendation and metadata
    """
    return {
        'action': action,
        'downside': downside,
        'acceptable': acceptable,
        'proceed': acceptable,
        'notes': notes,
        'time': datetime.now().isoformat()
    }

def get_regret_prompt(action, account_name=None):
    """Get a prompt to help think through regret check."""
    prompts = {
        'cold_outreach': f"If {account_name or 'this account'} ignores or blocks you, is that acceptable?",
        'send_email': f"If this email is forwarded to someone unintended, is that acceptable?",
        'pricing_quote': "If this price is shared publicly, is that acceptable?",
        'publish': "If this content is permanent and searchable, is that acceptable?",
        'default': f"If this action goes wrong, will you regret taking it?"
    }
    return prompts.get(action.lower(), prompts['default'])
