import os
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from models.models import db, Resume, User
from utils.jwt_utils import decode_jwt
from utils.redis_sessions import is_token_blacklisted
import datetime

resume_bp = Blueprint('resume', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@resume_bp.route('/resume/upload', methods=['POST'])
def upload_resume():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing token'}), 401
        
    token = auth_header.split(' ')[1]
    try:
        payload = decode_jwt(token)
        if is_token_blacklisted(payload['jti']):
            return jsonify({'error': 'Token revoked'}), 401
            
        user_id = payload['sub']
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if 'resume' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['resume']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            new_filename = f"{user_id}_{timestamp}_{filename}"
            
            upload_folder = os.path.join(current_app.root_path, 'uploads', 'resumes')
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder)
                
            file_path = os.path.join(upload_folder, new_filename)
            file.save(file_path)
            
            # Save to DB
            # Store relative path for serving
            relative_path = f"resumes/{new_filename}"
            resume = Resume(user_id=user_id, file_path=relative_path)
            db.session.add(resume)
            db.session.commit()
            
            # Optional: Trigger celery task here
            # extract_text_from_resume.delay(file_path)
            
            return jsonify({
                'success': True, 
                'url': f"/uploads/{relative_path}",
                'message': 'Resume uploaded successfully'
            })
            
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401
