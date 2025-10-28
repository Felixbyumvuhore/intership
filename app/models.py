from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import random

db = SQLAlchemy()

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(20), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100))
    skills = db.Column(db.PickleType)
    company_name = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Internship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employer_id = db.Column(db.Integer, db.ForeignKey('profile.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    department = db.Column(db.String(100))
    required_skills = db.Column(db.PickleType)
    location = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    employer = db.relationship('Profile', backref='posted_internships', foreign_keys=[employer_id])
    technical_questions = db.relationship('TechnicalQuestion', backref='internship', lazy=True, cascade='all, delete-orphan')

class TechnicalQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    internship_id = db.Column(db.Integer, db.ForeignKey('internship.id'), nullable=False)
    question = db.Column(db.Text, nullable=False)
    correct_answer = db.Column(db.Boolean, nullable=False)  # True for Yes, False for No
    notes = db.Column(db.Text)

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('profile.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internship.id'), nullable=False)
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    quiz_passed = db.Column(db.Boolean, default=False)
    quiz_score = db.Column(db.Integer, default=0)
    
    # Relationships
    student = db.relationship('Profile', foreign_keys=[student_id], backref='applications')
    internship = db.relationship('Internship', backref='applications')

# General questions pool (stored in database for flexibility)
GENERAL_QUESTIONS = [
    {
        "question": "Should your résumé include your most recent education and any relevant skills or experiences?",
        "answer": True,
        "notes": "A résumé must highlight current and relevant qualifications."
    },
    {
        "question": "Is it acceptable to use your personal email address like coolguy123@gmail.com when applying for internships?",
        "answer": False,
        "notes": "Use a professional email format: firstname.lastname@email.com."
    },
    {
        "question": "Should you research a company before attending its interview?",
        "answer": True,
        "notes": "Always research to tailor your answers and show genuine interest."
    },
    {
        "question": "Is being late to an interview acceptable if you inform the recruiter afterward?",
        "answer": False,
        "notes": "Punctuality shows professionalism; always plan to arrive early."
    },
    {
        "question": "Should you send a thank-you message or email after an interview?",
        "answer": True,
        "notes": "It shows appreciation and professionalism."
    },
    {
        "question": "Is it okay to lie slightly on your résumé to make it look stronger?",
        "answer": False,
        "notes": "Honesty is critical; false claims can disqualify you."
    },
    {
        "question": "Should you read and follow all instructions carefully when submitting an application?",
        "answer": True,
        "notes": "Following instructions shows attention to detail."
    },
    {
        "question": "If you don't understand a question in an interview, should you guess instead of asking for clarification?",
        "answer": False,
        "notes": "It's better to ask for clarification; it shows communication skills."
    }
]

def get_random_general_questions(count=4):
    """Get random general questions"""
    return random.sample(GENERAL_QUESTIONS, min(count, len(GENERAL_QUESTIONS)))

