from app import db
from flask_login import UserMixin

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))

class DetectionJob(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    result_filename = db.Column(db.String(255))
    objects_detected = db.Column(db.Integer, default=0)
    status = db.Column(db.String(20), default='processing')  # processing, completed, failed
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    user = db.relationship('User', backref=db.backref('detection_jobs', lazy=True))
