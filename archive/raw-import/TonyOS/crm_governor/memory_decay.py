"""
Memory Decay
Old context quietly becomes wrong.
Flag stale insights for re-evaluation.
"""
from datetime import datetime, timedelta

def is_stale(timestamp, days=60):
    """
    Check if a timestamp is older than threshold.
    
    Args:
        timestamp: ISO format timestamp string
        days: Number of days before considered stale (default 60)
    
    Returns:
        True if stale, False if fresh
    """
    if not timestamp:
        return True
    
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        age = datetime.now(dt.tzinfo) - dt if dt.tzinfo else datetime.now() - dt
        return age.days > days
    except:
        return True

def get_freshness_label(timestamp, thresholds=None):
    """
    Get a human-readable freshness label.
    
    Returns: 'fresh' | 'aging' | 'stale' | 'unknown'
    """
    if not timestamp:
        return 'unknown'
    
    thresholds = thresholds or {'fresh': 14, 'aging': 45, 'stale': 90}
    
    try:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        age = datetime.now(dt.tzinfo) - dt if dt.tzinfo else datetime.now() - dt
        days = age.days
        
        if days <= thresholds['fresh']:
            return 'fresh'
        elif days <= thresholds['aging']:
            return 'aging'
        else:
            return 'stale'
    except:
        return 'unknown'

def flag_stale_assumptions(assumptions, days=60):
    """
    Flag which assumptions are stale and need re-evaluation.
    
    Returns list of stale assumptions with staleness info.
    """
    stale = []
    for a in assumptions:
        if is_stale(a.get('time'), days):
            stale.append({
                **a,
                'stale': True,
                'freshness': get_freshness_label(a.get('time'))
            })
    return stale
