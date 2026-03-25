"""
Weekly Signal Compression
Summarize patterns, not events.
Answer: "What is actually happening?" not "What happened last?"
"""
from datetime import datetime, timedelta
from collections import defaultdict

def summarize_signals(signals, days=7):
    """
    Compress signals into a weekly summary.
    
    Args:
        signals: List of signal dicts with 'type' and 'time'
        days: How many days to look back
    
    Returns:
        Summary with counts and patterns
    """
    cutoff = datetime.now() - timedelta(days=days)
    
    recent = []
    for s in signals:
        try:
            signal_time = datetime.fromisoformat(s.get('time', '').replace('Z', '+00:00'))
            if signal_time.replace(tzinfo=None) > cutoff:
                recent.append(s)
        except:
            continue
    
    type_counts = defaultdict(int)
    for s in recent:
        type_counts[s.get('type', 'unknown')] += 1
    
    return {
        'period_days': days,
        'total_signals': len(recent),
        'by_type': dict(type_counts),
        'generated_at': datetime.now().isoformat()
    }

def get_pipeline_health(outcomes, days=30):
    """
    Analyze pipeline health from recent outcomes.
    
    Returns health assessment with actionable insights.
    """
    cutoff = datetime.now() - timedelta(days=days)
    
    recent = []
    for o in outcomes:
        try:
            outcome_time = datetime.fromisoformat(o.get('time', '').replace('Z', '+00:00'))
            if outcome_time.replace(tzinfo=None) > cutoff:
                recent.append(o)
        except:
            continue
    
    if not recent:
        return {
            'health': 'unknown',
            'reason': 'No recent outcomes to analyze',
            'recommendation': 'Log some outcomes to enable health tracking'
        }
    
    positive = sum(1 for o in recent if o.get('outcome') == 'positive')
    negative = sum(1 for o in recent if o.get('outcome') == 'negative')
    total = len(recent)
    
    positive_rate = positive / total if total else 0
    negative_rate = negative / total if total else 0
    
    if positive_rate >= 0.5:
        health = 'strong'
        reason = f'{positive}/{total} outcomes positive'
        recommendation = 'Keep doing what works. Document the patterns.'
    elif negative_rate >= 0.5:
        health = 'needs_attention'
        reason = f'{negative}/{total} outcomes negative'
        recommendation = 'Review recent assumptions. Something may have changed.'
    else:
        health = 'stable'
        reason = 'Mixed outcomes'
        recommendation = 'Normal variance. Continue monitoring.'
    
    return {
        'health': health,
        'reason': reason,
        'recommendation': recommendation,
        'stats': {
            'positive': positive,
            'neutral': total - positive - negative,
            'negative': negative,
            'total': total,
            'positive_rate': round(positive_rate * 100, 1)
        },
        'period_days': days,
        'generated_at': datetime.now().isoformat()
    }
