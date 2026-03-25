import os
from app import app
from flask import session
from replit_auth import require_login, make_replit_blueprint
from flask_login import current_user
from datetime import timedelta

app.register_blueprint(make_replit_blueprint(), url_prefix="/auth")

is_production = os.environ.get('REPL_SLUG') is not None or os.environ.get('FLASK_ENV') == 'production'
app.config['SESSION_COOKIE_SECURE'] = is_production
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)


@app.before_request
def make_session_permanent():
    session.permanent = True


@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response


if __name__ == "__main__":
    debug_mode = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    port = int(os.environ.get('TONYOS_PORT', 8787))
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
