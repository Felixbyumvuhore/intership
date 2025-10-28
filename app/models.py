from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)  # student or employer
    full_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100))
    skills = db.Column(db.PickleType)  # simple list of skills
    company_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Internship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employer_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    department = db.Column(db.String(100))
    required_skills = db.Column(db.PickleType)
    location = db.Column(db.String(100))
    company_id = db.Column(db.Integer, db.ForeignKey('profile.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    internship_id = db.Column(db.Integer, db.ForeignKey('internship.id'))
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

