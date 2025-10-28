from flask import Blueprint, render_template, request, redirect, url_for, session
from .models import db, Profile, Internship, Application
from werkzeug.security import generate_password_hash, check_password_hash

main = Blueprint('main', __name__)

# --------------------------
# Helper: login required decorator
# --------------------------
def login_required(role=None):
    def decorator(f):
        def wrapped(*args, **kwargs):
            if 'user_id' not in session:
                return redirect(url_for('main.login'))
            if role and session.get('role') != role:
                return "Unauthorized", 403
            return f(*args, **kwargs)
        wrapped.__name__ = f.__name__
        return wrapped
    return decorator

# --------------------------
# Home
# --------------------------
@main.route('/')
def index():
    return render_template("index.html")


# --------------------------
# Register
# --------------------------
@main.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form['full_name']
        email = request.form['email']
        password = request.form['password']
        role = request.form['role']
        department = request.form.get('department')
        skills = request.form.get('skills', '').split(',')  # comma-separated skills
        company_name = request.form.get('company_name')

        # simple password hash
        hashed_password = generate_password_hash(password, method='sha256')

        # Save profile
        profile = Profile(
            role=role,
            full_name=full_name,
            department=department if role=='student' else None,
            skills=skills if role=='student' else None,
            company_name=company_name if role=='employer' else None
        )
        db.session.add(profile)
        db.session.commit()

        # Save password in session for simplicity (MVP)
        session['user_id'] = profile.id
        session['role'] = role

        if role == 'student':
            return redirect(url_for('main.student_dashboard'))
        else:
            return redirect(url_for('main.employer_dashboard'))

    return render_template("register.html")


# --------------------------
# Login
# --------------------------
@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        full_name = request.form['full_name']  # For MVP, login by name
        profile = Profile.query.filter_by(full_name=full_name).first()
        if profile:
            session['user_id'] = profile.id
            session['role'] = profile.role
            if profile.role == 'student':
                return redirect(url_for('main.student_dashboard'))
            else:
                return redirect(url_for('main.employer_dashboard'))
        return "User not found", 404

    return render_template("login.html")


# --------------------------
# Logout
# --------------------------
@main.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('main.index'))


# --------------------------
# Student Dashboard
# --------------------------
@main.route('/student/dashboard')
@login_required(role='student')
def student_dashboard():
    student = Profile.query.get(session['user_id'])
    internships = Internship.query.all()

    # Simple matching: count overlapping skills
    matched = []
    for internship in internships:
        overlap = set(student.skills or []) & set(internship.required_skills or [])
        matched.append((internship, len(overlap)))
    matched.sort(key=lambda x: x[1], reverse=True)

    return render_template("student_dashboard.html", student=student, matched=matched)


# --------------------------
# Employer Dashboard
# --------------------------
@main.route('/employer/dashboard', methods=['GET', 'POST'])
@login_required(role='employer')
def employer_dashboard():
    employer = Profile.query.get(session['user_id'])

    if request.method == 'POST':
        title = request.form['title']
        description = request.form['description']
        department = request.form.get('department')
        skills = request.form.get('skills', '').split(',')
        location = request.form.get('location')

        internship = Internship(
            employer_id=employer.id,
            title=title,
            description=description,
            department=department,
            required_skills=skills,
            location=location
        )
        db.session.add(internship)
        db.session.commit()
        return redirect(url_for('main.employer_dashboard'))

    internships = Internship.query.filter_by(employer_id=employer.id).all()
    return render_template("employer_dashboard.html", employer=employer, internships=internships)


# --------------------------
# Apply to Internship
# --------------------------
@main.route('/apply/<int:internship_id>')
@login_required(role='student')
def apply(internship_id):
    student_id = session['user_id']
    existing = Application.query.filter_by(student_id=student_id, internship_id=internship_id).first()
    if not existing:
        application = Application(student_id=student_id, internship_id=internship_id)
        db.session.add(application)
        db.session.commit()
    return redirect(url_for('main.student_dashboard'))

