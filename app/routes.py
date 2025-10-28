from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from .models import db, Profile, Internship, Application, TechnicalQuestion, get_random_general_questions
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

    internships = Internship.query.all()
    matched = []
    for internship in internships:
        if internship.required_skills:
            score = len(set(student.skills) & set(internship.required_skills))
        else:
            score = 0
        matched.append((internship, score))

    matched.sort(key=lambda x: x[1], reverse=True)

    # Get applications with quiz status
    applications = Application.query.filter_by(student_id=student_id).all()
    applied_ids = [app.internship_id for app in applications]

    return render_template('student_dashboard.html', 
                         student=student, 
                         matched=matched, 
                         applications=applications,
                         applied_ids=applied_ids)

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

    # Changed from company_id to employer_id
    internships = Internship.query.filter_by(employer_id=employer.id).all()
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
            employer_id=employer.id  # Changed from company_id
        )
        db.session.add(new_internship)
        db.session.commit()
        flash("Internship posted! Now add technical questions.", "success")
        return redirect(url_for('main.manage_questions', internship_id=new_internship.id))

    return render_template('post_internship.html')


# Edit internship
@main.route('/employer/edit/<int:id>', methods=['GET', 'POST'])
def edit_internship(id):
    internship = Internship.query.get_or_404(id)
    employer_id = session.get('user_id')

    # Changed from company_id to employer_id
    if internship.employer_id != employer_id:
        flash("Unauthorized access.", "danger")
        return redirect(url_for('main.employer_dashboard'))

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
    internship = Internship.query.get_or_404(id)
    employer_id = session.get('user_id')

    # Changed from company_id to employer_id
    if internship.employer_id != employer_id:
        flash("Unauthorized access.", "danger")
        return redirect(url_for('main.employer_dashboard'))

    db.session.delete(internship)
    db.session.commit()
    flash("Internship deleted.", "info")
    return redirect(url_for('main.employer_dashboard'))


# View applicants for an internship
@main.route('/employer/applicants/<int:id>')
def view_applicants(id):
    internship = Internship.query.get_or_404(id)
    employer_id = session.get('user_id')

    # Changed from company_id to employer_id
    if internship.employer_id != employer_id:
        flash("Unauthorized access.", "danger")
        return redirect(url_for('main.employer_dashboard'))

    applications = Application.query.filter_by(internship_id=id).all()
    return render_template('view_applicants.html', internship=internship, applications=applications)


# --------------------------
# Take Quiz before Apply
# --------------------------
@main.route('/quiz/<int:internship_id>', methods=['GET', 'POST'])
def take_quiz(internship_id):
    student_id = session.get('user_id')
    if not student_id:
        flash("Please login first.", "warning")
        return redirect(url_for('main.login'))

    internship = Internship.query.get_or_404(internship_id)
    
    # Check if already applied
    existing = Application.query.filter_by(student_id=student_id, internship_id=internship_id).first()
    if existing:
        flash("You already applied to this internship.", "info")
        return redirect(url_for('main.student_dashboard'))

    if request.method == 'POST':
        # Calculate score
        total_questions = 8
        correct_answers = 0
        
        # Check answers
        for i in range(total_questions):
            student_answer = request.form.get(f'q{i}')
            correct_answer = request.form.get(f'correct_{i}')
            
            if student_answer == correct_answer:
                correct_answers += 1
        
        score = (correct_answers / total_questions) * 100
        passed = score >= 75  # 75% passing grade (6 out of 8)
        
        # Create application
        new_app = Application(
            student_id=student_id,
            internship_id=internship_id,
            quiz_passed=passed,
            quiz_score=int(score)
        )
        db.session.add(new_app)
        db.session.commit()
        
        if passed:
            flash(f"Congratulations! You passed with {int(score)}%. Your application has been submitted.", "success")
        else:
            flash(f"You scored {int(score)}%. You need at least 75% to apply. Please try again later.", "warning")
        
        return redirect(url_for('main.student_dashboard'))
    
    # GET request - show quiz
    # Get 4 random general questions
    general_questions = get_random_general_questions(4)
    
    # Get 4 random technical questions from this internship
    all_technical = TechnicalQuestion.query.filter_by(internship_id=internship_id).all()
    
    if len(all_technical) < 4:
        flash("This internship doesn't have enough technical questions set up yet.", "warning")
        return redirect(url_for('main.student_dashboard'))
    
    import random
    technical_questions = random.sample(all_technical, min(4, len(all_technical)))
    
    # Combine questions
    all_questions = []
    for q in general_questions:
        all_questions.append({
            'question': q['question'],
            'answer': 'yes' if q['answer'] else 'no',
            'notes': q['notes']
        })
    
    for q in technical_questions:
        all_questions.append({
            'question': q.question,
            'answer': 'yes' if q.correct_answer else 'no',
            'notes': q.notes
        })
    
    # Shuffle all questions
    random.shuffle(all_questions)
    
    return render_template('quiz.html', internship=internship, questions=all_questions)


# --------------------------
# Employer: Manage Technical Questions
# --------------------------
@main.route('/employer/questions/<int:internship_id>', methods=['GET', 'POST'])
def manage_questions(internship_id):
    employer_id = session.get('user_id')
    internship = Internship.query.get_or_404(internship_id)
    
    # Changed from company_id to employer_id
    if internship.employer_id != employer_id:
        flash("Unauthorized access.", "danger")
        return redirect(url_for('main.employer_dashboard'))
    
    if request.method == 'POST':
        # Delete existing questions
        TechnicalQuestion.query.filter_by(internship_id=internship_id).delete()
        
        # Add new questions (expect 8 questions)
        for i in range(1, 9):
            question_text = request.form.get(f'question_{i}')
            answer = request.form.get(f'answer_{i}')
            notes = request.form.get(f'notes_{i}', '')
            
            if question_text and answer:
                new_q = TechnicalQuestion(
                    internship_id=internship_id,
                    question=question_text,
                    correct_answer=(answer == 'yes'),
                    notes=notes
                )
                db.session.add(new_q)
        
        db.session.commit()
        flash("Technical questions updated successfully!", "success")
        return redirect(url_for('main.employer_dashboard'))
    
    # GET - show existing questions
    questions = TechnicalQuestion.query.filter_by(internship_id=internship_id).all()
    return render_template('manage_questions.html', internship=internship, questions=questions)