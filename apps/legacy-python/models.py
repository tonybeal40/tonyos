from datetime import datetime

from app import db
from flask_dance.consumer.storage.sqla import OAuthConsumerMixin
from flask_login import UserMixin
from sqlalchemy import UniqueConstraint


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=True)
    first_name = db.Column(db.String, nullable=True)
    last_name = db.Column(db.String, nullable=True)
    profile_image_url = db.Column(db.String, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime,
                           default=datetime.now,
                           onupdate=datetime.now)


class OAuth(OAuthConsumerMixin, db.Model):
    user_id = db.Column(db.String, db.ForeignKey(User.id))
    browser_session_key = db.Column(db.String, nullable=False)
    user = db.relationship(User)

    __table_args__ = (UniqueConstraint(
        'user_id',
        'browser_session_key',
        'provider',
        name='uq_user_browser_session_key_provider',
    ),)


class Resume(db.Model):
    __tablename__ = 'resumes'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, default='Untitled Resume')
    data_json = db.Column(db.Text, nullable=False, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    versions = db.relationship('ResumeVersion', backref='resume', lazy=True, cascade='all, delete-orphan')


class ResumeVersion(db.Model):
    __tablename__ = 'resume_versions'
    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id'), nullable=False)
    label = db.Column(db.String(255), nullable=False, default='Snapshot')
    data_json = db.Column(db.Text, nullable=False, default='{}')
    created_at = db.Column(db.DateTime, default=datetime.now)


class MarketScan(db.Model):
    __tablename__ = 'market_scans'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, default='Industry Discovery')
    status = db.Column(db.String(50), nullable=False, default='pending')
    industries_json = db.Column(db.Text, nullable=False, default='[]')
    companies_json = db.Column(db.Text, nullable=False, default='[]')
    current_industry = db.Column(db.Integer, nullable=False, default=0)
    total_industries = db.Column(db.Integer, nullable=False, default=0)
    total_companies = db.Column(db.Integer, nullable=False, default=0)
    options_json = db.Column(db.Text, nullable=False, default='{}')
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)


class ScanMemory(db.Model):
    __tablename__ = 'scan_memory'
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    industry = db.Column(db.String(255), nullable=True)
    territory = db.Column(db.String(100), nullable=True)
    sales_rep = db.Column(db.String(100), nullable=True)
    ai_decision = db.Column(db.String(50), nullable=True)
    ai_compression = db.Column(db.String(50), nullable=True)
    ai_division = db.Column(db.String(50), nullable=True)
    ai_confidence = db.Column(db.Integer, nullable=True)
    ai_summary = db.Column(db.Text, nullable=True)
    pressure_signals = db.Column(db.Text, nullable=True)
    competitors = db.Column(db.Text, nullable=True)
    final_decision = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    scan_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)


class OverrideLog(db.Model):
    __tablename__ = 'override_logs'
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(255), nullable=False)
    original_decision = db.Column(db.String(50), nullable=False)
    new_decision = db.Column(db.String(50), nullable=False)
    reason = db.Column(db.Text, nullable=True)
    changed_by = db.Column(db.String(100), nullable=True)
    scan_memory_id = db.Column(db.Integer, db.ForeignKey('scan_memory.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)


class PressureSignal(db.Model):
    __tablename__ = 'pressure_signals'
    id = db.Column(db.Integer, primary_key=True)
    keyword = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    weight = db.Column(db.Integer, nullable=False, default=1)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
