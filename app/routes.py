from flask import Blueprint, render_template, request, redirect, url_for, session, flash, Flask

from .models import db, Profile, Internship, Application
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

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
        full_name = request.form.get('full_name')
        email = request.form.get('email')  # if you want to store email
        password = request.form.get('password')
        role = request.form.get('role')

        # For students
        department = request.form.get('department') if role == 'student' else None
        skills_input = request.form.get('skills') if role == 'student' else None

        # Convert comma-separated string into a list, removing extra spaces
        skills_list = [s.strip() for s in skills_input.split(',')] if skills_input else []

        # For employers
        company_name = request.form.get('company_name') if role == 'employer' else None

        # Hash password safely
        hashed_password = generate_password_hash(password, method='scrypt')  # avoid deprecated sha256

        # Create profile
        new_profile = Profile(
            role=role,
            full_name=full_name,
            department=department,
            skills=skills_list,
            company_name=company_name,
        )

        try:
            db.session.add(new_profile)
            db.session.commit()
            flash("Registration successful!", "success")
            return redirect(url_for('main.login'))
        except Exception as e:
            db.session.rollback()
            flash(f"Error: {str(e)}", "danger")
            return redirect(url_for('main.register'))

    return render_template('register.html')


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
def student_dashboard():
    student_id = session.get('user_id')
    if not student_id:
        flash("Please login first.", "warning")
        return redirect(url_for('main.login'))

    student = Profile.query.get(student_id)
    if not student or student.role != 'student':
        flash("Access denied.", "danger")
        return redirect(url_for('main.login'))

    # Fetch all internships
    internships = Internship.query.all()

    # Simple skill matching: count how many required skills match student skills
    matched = []
    for internship in internships:
        if internship.required_skills:
            score = len(set(student.skills) & set(internship.required_skills))
        else:
            score = 0
        matched.append((internship, score))

    # Sort by score descending
    matched.sort(key=lambda x: x[1], reverse=True)

    return render_template('student_dashboard.html', student=student, matched=matched)

@main.route('/student/edit', methods=['GET', 'POST'])
def edit_student():
    student_id = session.get('user_id')
    student = Profile.query.get(student_id)

    if request.method == 'POST':
        student.full_name = request.form.get('full_name')
        student.department = request.form.get('department')
        skills_input = request.form.get('skills')
        student.skills = [s.strip() for s in skills_input.split(',')] if skills_input else []
        try:
            db.session.commit()
            flash("Profile updated!", "success")
            return redirect(url_for('main.student_dashboard'))
        except Exception as e:
            db.session.rollback()
            flash(f"Error: {str(e)}", "danger")
            return redirect(url_for('main.edit_student'))

    return render_template('edit_student.html', student=student)

@main.route('/student/delete', methods=['POST'])
def delete_student():
    student_id = session.get('user_id')
    student = Profile.query.get(student_id)
    try:
        db.session.delete(student)
        db.session.commit()
        session.pop('user_id', None)
        flash("Profile deleted.", "success")
        return redirect(url_for('main.index'))
    except Exception as e:
        db.session.rollback()
        flash(f"Error: {str(e)}", "danger")
        return redirect(url_for('main.student_dashboard'))
    
#apply button handler





# --------------------------
# Apply to Internship
# --------------------------
@main.route('/apply/<int:internship_id>')
def apply(internship_id):
    student_id = session.get('user_id')
    if not student_id:
        flash("Please login first.", "warning")
        return redirect(url_for('main.login'))

    # Check if already applied
    existing = Application.query.filter_by(student_id=student_id, internship_id=internship_id).first()
    if existing:
        flash("You already applied to this internship.", "info")
        return redirect(url_for('main.student_dashboard'))

    new_app = Application(student_id=student_id, internship_id=internship_id)
    db.session.add(new_app)
    db.session.commit()
    flash("Application submitted!", "success")
    return redirect(url_for('main.student_dashboard'))


# --------------------------
# Employer Dashboard
# --------------------------

@main.route('/employer/dashboard')
def employer_dashboard():
    employer_id = session.get('user_id')
    if not employer_id:
        flash("Please login first.", "warning")
        return redirect(url_for('main.login'))

    employer = Profile.query.get(employer_id)
    if not employer or employer.role != 'employer':
        flash("Access denied.", "danger")
        return redirect(url_for('main.login'))

    internships = Internship.query.filter_by(company_id=employer.id).all()
    return render_template('employer_dashboard.html', employer=employer, internships=internships)


# Post new internship
@main.route('/employer/post', methods=['GET', 'POST'])
def post_internship():
    employer_id = session.get('user_id')
    employer = Profile.query.get(employer_id)

    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        department = request.form.get('department')
        location = request.form.get('location')
        skills_input = request.form.get('skills')
        required_skills = [s.strip() for s in skills_input.split(',')] if skills_input else []

        new_internship = Internship(
            title=title,
            description=description,
            department=department,
            location=location,
            required_skills=required_skills,
            company_id=employer.id
        )
        db.session.add(new_internship)
        db.session.commit()
        flash("Internship posted!", "success")
        return redirect(url_for('main.employer_dashboard'))

    return render_template('post_internship.html')


# Edit internship
@main.route('/employer/edit/<int:id>', methods=['GET', 'POST'])
def edit_internship(id):
    internship = Internship.query.get(id)
    if request.method == 'POST':
        internship.title = request.form.get('title')
        internship.description = request.form.get('description')
        internship.department = request.form.get('department')
        internship.location = request.form.get('location')
        skills_input = request.form.get('skills')
        internship.required_skills = [s.strip() for s in skills_input.split(',')] if skills_input else []
        db.session.commit()
        flash("Internship updated!", "success")
        return redirect(url_for('main.employer_dashboard'))
    return render_template('edit_internship.html', internship=internship)


# Delete internship
@main.route('/employer/delete/<int:id>', methods=['POST'])
def delete_internship(id):
    internship = Internship.query.get(id)
    db.session.delete(internship)
    db.session.commit()
    flash("Internship deleted!", "success")
    return redirect(url_for('main.employer_dashboard'))


# View applicants for an internship
@main.route('/employer/applicants/<int:id>')
def view_applicants(id):
    internship = Internship.query.get(id)
    applicants = Application.query.filter_by(internship_id=id).all()
    return render_template('applicants.html', internship=internship, applicants=applicants)