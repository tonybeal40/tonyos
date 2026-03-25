import os
import time
import logging
from functools import wraps
from flask import request, jsonify

API_KEY = os.getenv("TONYOS_API_KEY", "")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_RAW.split(",") if o.strip()]

RATE_LIMITS = {}
RATE_WINDOW = 60.0
DEFAULT_RATE_LIMIT = 30


def has_authenticated_session():
    """Check if request has an authenticated Flask-Login session"""
    try:
        from flask_login import current_user
        return current_user and current_user.is_authenticated
    except Exception:
        return False


def is_same_origin_request():
    """Check if request is from the same origin (internal browser request)"""
    origin = request.headers.get("Origin", "")
    referer = request.headers.get("Referer", "")
    host = request.headers.get("Host", "")
    
    if not origin and not referer:
        return True
    
    if origin:
        origin_host = origin.replace("https://", "").replace("http://", "").split("/")[0]
        if host and (origin_host == host or origin_host.endswith(".replit.dev") or origin_host.endswith(".replit.app")):
            return True
    
    if referer:
        referer_host = referer.replace("https://", "").replace("http://", "").split("/")[0]
        if host and (referer_host == host or referer_host.endswith(".replit.dev") or referer_host.endswith(".replit.app")):
            return True
    
    return False


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not API_KEY:
            logging.warning("[security] TONYOS_API_KEY not configured - API key check skipped")
            return f(*args, **kwargs)
        
        if has_authenticated_session():
            return f(*args, **kwargs)
        
        if is_same_origin_request():
            return f(*args, **kwargs)
        
        provided_key = request.headers.get("X-TonyOS-Key", "")
        if provided_key != API_KEY:
            logging.warning(f"[security] Unauthorized API access attempt from {get_client_ip()}")
            return jsonify({"error": "Unauthorized"}), 401
        
        return f(*args, **kwargs)
    return decorated


def rate_limit(max_per_minute=DEFAULT_RATE_LIMIT):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            ip = get_client_ip()
            now = time.time()
            
            if ip not in RATE_LIMITS:
                RATE_LIMITS[ip] = []
            
            RATE_LIMITS[ip] = [t for t in RATE_LIMITS[ip] if now - t < RATE_WINDOW]
            
            if len(RATE_LIMITS[ip]) >= max_per_minute:
                logging.warning(f"[security] Rate limit exceeded for {ip}")
                return jsonify({"error": "Rate limit exceeded. Try again in a minute."}), 429
            
            RATE_LIMITS[ip].append(now)
            return f(*args, **kwargs)
        return decorated
    return decorator


def get_client_ip():
    if request.headers.get("X-Forwarded-For"):
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    return request.remote_addr or "unknown"


def add_cors_headers(response):
    origin = request.headers.get("Origin", "")
    
    if not ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = "*"
    elif origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-TonyOS-Key"
    response.headers["Access-Control-Max-Age"] = "3600"
    
    return response


def handle_cors_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        return add_cors_headers(response)
    return None
