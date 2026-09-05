from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from functools import wraps
import os
import hashlib
import secrets
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# Generate organizer code at startup and store in environment
ORGANIZER_CODE = secrets.token_hex(16)
os.environ['ORGANIZER_CODE'] = ORGANIZER_CODE
print(f"ORGANIZER_CODE: {ORGANIZER_CODE}")  # Print to console for organizers to see

# Mock database of users
users = {}

olympiad = {
    'id': 1,
    'name': 'ВсОШ по вайбкодингу',
    'stages': [
        {'id': 1, 'name': 'Пригласительный тур', 'status': 'active'},
        {'id': 2, 'name': 'Первый отборочный этап', 'status': 'upcoming'},
        {'id': 3, 'name': 'Второй отборочный этап', 'status': 'upcoming'}
    ]
}

# Mock participant answers storage
participant_answers = {}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return redirect(url_for('login'))
            if session['user']['role'] != role:
                flash('У вас нет доступа к этой странице')
                return redirect(url_for('dashboard'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/')
def index():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/test-tasks')
@login_required
def test_tasks():
    if session['user']['role'] != 'participant':
        flash('Пригласительный тур доступен только для участников')
        return redirect(url_for('dashboard'))
    return render_template('test_tasks.html', user=session['user'])

@app.route('/save-answers', methods=['POST'])
@login_required
def save_answers():
    if session['user']['role'] != 'participant':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    username = data.get('username')
    answers = data.get('answers', [])
    
    # Save answers as JSON for this participant
    participant_answers[username] = {
        'username': username,
        'name': users[username]['name'],
        'answers': answers,
        'timestamp': datetime.now().isoformat()
    }
    
    # Save to file for persistence
    with open(f'participant_answers_{username}.json', 'w', encoding='utf-8') as f:
        json.dump(participant_answers[username], f, ensure_ascii=False, indent=2)
    
    return jsonify({'success': True})

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        full_name = request.form.get('full_name')
        email = request.form.get('email')
        role = request.form.get('role')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        organizer_code = request.form.get('organizer_code', '')
        
        if not username or not full_name or not email or not role or not password:
            flash('Заполните все поля')
            return render_template('register.html')
        
        if username in users:
            flash('Пользователь с таким именем уже существует')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Пароли не совпадают')
            return render_template('register.html')
        
        if len(password) < 6:
            flash('Пароль должен содержать минимум 6 символов')
            return render_template('register.html')
        
        # Check organizer code for organizer role
        if role == 'organizer':
            if organizer_code != ORGANIZER_CODE:
                flash('Неверный код организатора')
                return render_template('register.html')
        
        # Create new user
        users[username] = {
            'password': password,
            'role': role,
            'name': full_name,
            'email': email
        }
        
        flash('Регистрация успешна! Теперь вы можете войти.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username in users and users[username]['password'] == password:
            session['user'] = {
                'username': username,
                'role': users[username]['role'],
                'name': users[username]['name']
            }
            return redirect(url_for('dashboard'))
        else:
            flash('Неверное имя пользователя или пароль')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    if session['user']['role'] == 'participant':
        return redirect(url_for('participant_dashboard'))
    elif session['user']['role'] == 'organizer':
        return redirect(url_for('organizer_dashboard'))
    return redirect(url_for('login'))

@app.route('/participant/dashboard')
@login_required
@role_required('participant')
def participant_dashboard():
    return render_template('participant_dashboard.html', 
                         user=session['user'], 
                         olympiad=olympiad)

@app.route('/organizer/dashboard')
@login_required
@role_required('organizer')
def organizer_dashboard():
    # Get participants (users with role 'participant')
    participants_list = [{'id': i+1, 'name': u['name'], 'username': k, 'olympiad': olympiad['name'], 'score': 0, 'status': 'in_progress'} 
                         for i, (k, u) in enumerate(users.items()) if u['role'] == 'participant']
    
    # Get participant answers
    participant_reports = []
    for username, data in participant_answers.items():
        participant_reports.append(data)
    
    return render_template('organizer_dashboard.html', 
                         user=session['user'], 
                         olympiad=olympiad,
                         participants=participants_list,
                         participant_reports=participant_reports)

# API Endpoint to get all reports
@app.route('/api/all-reports')
@login_required
@role_required('organizer')
def get_all_reports():
    reports = {}
    for username, data in participant_answers.items():
        reports[username] = data
    
    return jsonify({
        'success': True,
        'reports': reports,
        'total_participants': len(reports)
    })

# API Endpoint to get participant report
@app.route('/api/participant-report/<username>')
@login_required
@role_required('organizer')
def get_participant_report(username):
    if username not in participant_answers:
        return jsonify({'success': False, 'error': 'No answers found for this participant'}), 404
    
    report = participant_answers[username]
    return jsonify({
        'success': True,
        'report': report
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
