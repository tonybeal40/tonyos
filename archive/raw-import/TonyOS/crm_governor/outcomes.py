"""
Outcome Scoring
Beyond success/failure - score impact as positive/neutral/negative.
If learning is rewarded, data quality goes up.
"""
import json
import os
from datetime import datetime

FILE = os.path.join(os.path.dirname(__file__), 'data', 'outcomes.json')

def _ensure_dir():
    os.makedirs(os.path.dirname(FILE), exist_ok=True)
    if not os.path.exists(FILE):
        with open(FILE, 'w') as f:
            json.dump([], f)

def score_outcome(account_id, account_name, action, outcome, notes='', learnings=None):
    """
    Score an outcome for an account action.
    
    Args:
        account_id: The account ID
        account_name: Company name
        action: What action was taken (research, outreach, meeting, etc.)
        outcome: positive | neutral | negative
        notes: What happened
        learnings: What you learned (especially from negative)
    """
    _ensure_dir()
    
    with open(FILE, 'r') as f:
        data = json.load(f)
    
    entry = {
        'account_id': account_id,
        'account_name': account_name,
        'action': action,
        'outcome': outcome,
        'notes': notes,
        'learnings': learnings,
        'time': datetime.now().isoformat()
    }
    
    data.append(entry)
    
    with open(FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    return entry

def get_outcomes(limit=50, outcome_filter=None):
    """Get outcomes, optionally filtered by type."""
    _ensure_dir()
    with open(FILE, 'r') as f:
        data = json.load(f)
    
    if outcome_filter:
        data = [o for o in data if o.get('outcome') == outcome_filter]
    
    return sorted(data, key=lambda x: x['time'], reverse=True)[:limit]

def get_account_outcomes(account_id):
    """Get all outcomes for a specific account."""
    _ensure_dir()
    with open(FILE, 'r') as f:
        data = json.load(f)
    return [o for o in data if str(o.get('account_id')) == str(account_id)]

def get_outcome_summary():
    """Get summary counts of outcomes."""
    _ensure_dir()
    with open(FILE, 'r') as f:
        data = json.load(f)
    
    summary = {'positive': 0, 'neutral': 0, 'negative': 0, 'total': len(data)}
    for o in data:
        outcome = o.get('outcome', 'neutral')
        if outcome in summary:
            summary[outcome] += 1
    
    return summary
