import os
import uuid
from flask import render_template, request, redirect, url_for, session, flash, jsonify, send_from_directory
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
from app import app, db
from models import User, DetectionJob
from yolo_integration import run_detection_yolo
import logging

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'mkv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('home'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash('Login successful!', 'success')
            return redirect(url_for('home'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route('/home')
@login_required
def home():
    return render_template('home.html')

@app.route('/upload')
@login_required
def upload():
    return render_template('upload.html')

@app.route('/detect', methods=['POST'])
@login_required
def detect():
    if 'file' not in request.files:
        flash('No file selected', 'error')
        return redirect(url_for('upload'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No file selected', 'error')
        return redirect(url_for('upload'))
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Create detection job record
        job = DetectionJob(
            user_id=session['user_id'],
            filename=filename,
            original_filename=file.filename,
            status='processing'
        )
        db.session.add(job)
        db.session.commit()
        
        # Redirect to loading page
        return redirect(url_for('loading', job_id=job.id))
    else:
        flash('Invalid file type. Please upload an image or video file.', 'error')
        return redirect(url_for('upload'))

@app.route('/loading/<int:job_id>')
@login_required
def loading(job_id):
    job = DetectionJob.query.get_or_404(job_id)
    if job.user_id != session['user_id']:
        flash('Access denied', 'error')
        return redirect(url_for('home'))
    
    return render_template('loading.html', job_id=job_id)

@app.route('/process/<int:job_id>')
@login_required
def process_detection(job_id):
    job = DetectionJob.query.get_or_404(job_id)
    if job.user_id != session['user_id']:
        return jsonify({'error': 'Access denied'}), 403
    
    if job.status == 'completed':
        return jsonify({'status': 'completed', 'redirect': url_for('results', job_id=job_id)})
    
    try:
        # Process the file with YOLO
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], job.filename)
        result_filename = f"result_{job.filename}"
        result_path = os.path.join(app.config['RESULTS_FOLDER'], result_filename)
        
        # Call YOLO detection function
        objects_detected = run_detection_yolo(input_path, result_path)
        
        # Update job status
        job.result_filename = result_filename
        job.objects_detected = objects_detected
        job.status = 'completed'
        db.session.commit()
        
        return jsonify({
            'status': 'completed',
            'redirect': url_for('results', job_id=job_id)
        })
        
    except Exception as e:
        logging.error(f"Detection failed for job {job_id}: {str(e)}")
        job.status = 'failed'
        db.session.commit()
        return jsonify({'status': 'failed', 'error': str(e)}), 500

@app.route('/results/<int:job_id>')
@login_required
def results(job_id):
    job = DetectionJob.query.get_or_404(job_id)
    if job.user_id != session['user_id']:
        flash('Access denied', 'error')
        return redirect(url_for('home'))
    
    if job.status != 'completed':
        flash('Detection not completed yet', 'warning')
        return redirect(url_for('loading', job_id=job_id))
    
    return render_template('results.html', job=job)

@app.route('/uploads/<filename>')
@login_required
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/results_files/<filename>')
@login_required
def result_file(filename):
    return send_from_directory(app.config['RESULTS_FOLDER'], filename)

# Error handlers
@app.errorhandler(413)
def too_large(e):
    flash('File is too large. Maximum size is 50MB.', 'error')
    return redirect(url_for('upload'))

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404
