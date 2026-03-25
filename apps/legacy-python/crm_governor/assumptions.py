"""
Assumption Tracking
Log what you assumed was true when making decisions.
Six weeks later you'll know why you thought it was Tier-1.
"""
import json
import os
from datetime import datetime

FILE = os.path.join(os.path.dirname(__file__), 'data', 'assumptions.json')

def _ensure_dir():
    os.makedirs(os.path.dirname(FILE), exist_ok=True)
    if not os.path.exists(FILE):
        with open(FILE, 'w') as f:
            json.dump([], f)

def log_assumption(account_id, account_name, assumption, confidence='medium', context=None):
    """
    Log an assumption about an account.
    
    Args:
        account_id: The account ID
        account_name: Company name for readability
        assumption: What you assumed was true
        confidence: low | medium | high
        context: Optional additional context
    """
    _ensure_dir()
    
    with open(FILE, 'r') as f:
        data = json.load(f)
    
    entry = {
        'account_id': account_id,
        'account_name': account_name,
        'assumption': assumption,
        'confidence': confidence,
        'context': context,
        'time': datetime.now().isoformat(),
        'validated': None,
        'validation_note': None
    }
    
    data.append(entry)
    
    with open(FILE, 'w') as f:
        json.dump(data, f, indent=2)
    
    return entry

def get_assumptions(limit=50):
    """Get all assumptions, most recent first."""
    _ensure_dir()
    with open(FILE, 'r') as f:
        data = json.load(f)
    return sorted(data, key=lambda x: x['time'], reverse=True)[:limit]

def get_account_assumptions(account_id):
    """Get all assumptions for a specific account."""
    _ensure_dir()
    with open(FILE, 'r') as f:
        data = json.load(f)
    return [a for a in data if str(a.get('account_id')) == str(account_id)]

def validate_assumption(account_id, assumption_time, validated, note=None):
    """Mark an assumption as validated true or false."""
    _ensure_dir()
    with open(FILE, 'r') as f:
        data = json.load(f)
    
    for entry in data:
        if str(entry.get('account_id')) == str(account_id) and entry.get('time') == assumption_time:
            entry['validated'] = validated
            entry['validation_note'] = note
            entry['validated_at'] = datetime.now().isoformat()
            break
    
    with open(FILE, 'w') as f:
        json.dump(data, f, indent=2)
