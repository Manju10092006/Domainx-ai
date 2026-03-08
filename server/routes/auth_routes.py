from flask import Blueprint, request, jsonify, redirect, current_app, url_for
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
from models.models import db, User, LocalAuth
from utils.jwt_utils import create_jwt, decode_jwt
from utils.tasks import welcome_task
from utils.redis_sessions import add_token_to_blacklist, is_token_blacklisted
from config import Config
import datetime

auth_bp = Blueprint('auth', __name__)
oauth = OAuth()

# Register OAuth providers
def register_oauth(app):
    oauth.init_app(app)
    
    oauth.register(
        name='google',
        client_id=Config.GOOGLE_CLIENT_ID,
        client_secret=Config.GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
        authorize_params={'prompt': 'consent'}
    )

    oauth.register(
        name='github',
        client_id=Config.GITHUB_CLIENT_ID,
        client_secret=Config.GITHUB_CLIENT_SECRET,
        access_token_url='https://github.com/login/oauth/access_token',
        access_token_params=None,
        authorize_url='https://github.com/login/oauth/authorize',
        authorize_params=None,
        api_base_url='https://api.github.com/',
        client_kwargs={'scope': 'user:email'}
    )

def ensure_user(provider, provider_id, email, name, avatar):
    """
    Ensures a user exists in the database.
    - If provider_id exists, return user.
    - If email exists, link provider.
    - Else, create new user.
    """
    user = User.query.filter_by(provider_id=provider_id, provider=provider).first()
    
    if not user:
        # Check if email exists to prevent duplicates
        user = User.query.filter_by(email=email).first()
        if user:
            # Link provider
            user.provider_id = provider_id
            # Optionally update provider to reflect the new link or keep original
            # Here we might want to support multiple providers per user in a real app,
            # but for this schema we'll just update if it was 'local' or different.
            # For simplicity, we'll keep the existing user and just ensure provider_id is set if it was missing.
            if not user.provider_id:
                user.provider = provider
                user.provider_id = provider_id
        else:
            # Create new user
            user = User(
                provider=provider,
                provider_id=provider_id,
                email=email,
                name=name,
                avatar=avatar
            )
            db.session.add(user)
    
    # Update avatar if provided (for both new and existing users)
    if avatar:
        user.avatar = avatar
    
    db.session.commit()
    return user

def handle_login_success(user):
    # Create JWT
    token = create_jwt(user.id)
    
    # Emit Socket.IO event
    # Note: socketio is initialized in server.py. We access it via current_app.extensions
    socketio = current_app.extensions['socketio']
    socketio.emit('user_logged_in', {
        'id': user.id,
        'email': user.email,
        'name': user.name
    })
    
    # Enqueue welcome task
    welcome_task.delay(user.id)
    
    return token

# --- Routes ---

@auth_bp.route('/auth/google')
def google_login():
    redirect_uri = url_for('auth.google_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@auth_bp.route('/auth/google/callback')
def google_callback():
    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info:
            # Try to get userinfo from token directly if not in userinfo
            if 'id_token' in token:
                # Decode the ID token to get user info
                import base64
                import json
                try:
                    id_token = token['id_token']
                    # JWT has 3 parts separated by dots
                    parts = id_token.split('.')
                    if len(parts) >= 2:
                        # Decode the payload (second part)
                        payload = parts[1]
                        # Add padding if needed
                        padding = 4 - len(payload) % 4
                        if padding != 4:
                            payload += '=' * padding
                        decoded = base64.urlsafe_b64decode(payload)
                        user_info = json.loads(decoded)
                except Exception as e:
                    current_app.logger.error(f'Error decoding ID token: {e}')
            
            if not user_info:
                return jsonify({'error': 'Failed to fetch user info'}), 400
        
        user = ensure_user(
            provider='google',
            provider_id=user_info.get('sub') or user_info.get('id'),
            email=user_info.get('email'),
            name=user_info.get('name'),
            avatar=user_info.get('picture')
        )
        
        jwt_token = handle_login_success(user)
        # Redirect to dashboard with token and profile section
        redirect_url = f'http://127.0.0.1:5500/APP/Dashboard%20redesign/index.html?token={jwt_token}#view-profile'
        return redirect(redirect_url)
    except Exception as e:
        current_app.logger.error(f'Google OAuth callback error: {e}')
        return jsonify({'error': f'OAuth callback failed: {str(e)}'}), 500

@auth_bp.route('/auth/github')
def github_login():
    redirect_uri = url_for('auth.github_callback', _external=True)
    return oauth.github.authorize_redirect(redirect_uri)

@auth_bp.route('/auth/github/callback')
def github_callback():
    try:
        token = oauth.github.authorize_access_token()
        resp = oauth.github.get('user')
        profile = resp.json()
        
        # GitHub email might be private, need to fetch separately if not in profile
        email = profile.get('email')
        if not email:
            emails_resp = oauth.github.get('user/emails')
            emails = emails_resp.json()
            primary_email = next((e for e in emails if e['primary']), None)
            email = primary_email['email'] if primary_email else None
            
        if not email:
            return jsonify({'error': 'Email not found'}), 400

        user = ensure_user(
            provider='github',
            provider_id=str(profile['id']),
            email=email,
            name=profile.get('name') or profile.get('login'),
            avatar=profile.get('avatar_url')
        )
        
        jwt_token = handle_login_success(user)
        # Redirect to dashboard with token and profile section
        redirect_url = f'http://127.0.0.1:5500/APP/Dashboard%20redesign/index.html?token={jwt_token}#view-profile'
        return redirect(redirect_url)
    except Exception as e:
        current_app.logger.error(f'GitHub OAuth callback error: {e}')
        return jsonify({'error': f'OAuth callback failed: {str(e)}'}), 500

@auth_bp.route('/auth/local/register', methods=['POST'])
def local_register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
        
    # Create User
    user = User(
        provider='local',
        email=email,
        name=name,
        avatar=None # Default avatar logic could go here
    )
    db.session.add(user)
    db.session.flush() # Get ID
    
    # Create LocalAuth
    hashed_pw = generate_password_hash(password)
    local_auth = LocalAuth(user_id=user.id, password_hash=hashed_pw)
    db.session.add(local_auth)
    db.session.commit()
    
    token = handle_login_success(user)
    return jsonify({'token': token})

@auth_bp.route('/auth/local/login', methods=['POST'])
def local_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    if not user or user.provider != 'local':
        # Note: If user exists but is google/github, they should login via that, 
        # unless we support password setting for oauth users (not implemented here).
        return jsonify({'error': 'Invalid credentials'}), 401
        
    if not user.local_auth or not check_password_hash(user.local_auth.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    token = handle_login_success(user)
    return jsonify({'token': token})

@auth_bp.route('/auth/me')
def me():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing token'}), 401
        
    token = auth_header.split(' ')[1]
    try:
        payload = decode_jwt(token)
        if is_token_blacklisted(payload['jti']):
            return jsonify({'error': 'Token revoked'}), 401
            
        user = User.query.get(payload['sub'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.avatar,
            "bio": user.bio,
            "location": user.location
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing token'}), 401
        
    token = auth_header.split(' ')[1]
    try:
        payload = decode_jwt(token)
        # Calculate remaining TTL
        exp = payload['exp']
        now = datetime.datetime.utcnow().timestamp()
        ttl = int(exp - now)
        
        if ttl > 0:
            add_token_to_blacklist(payload['jti'], ttl)
            
        return jsonify({'message': 'Logged out successfully'})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@auth_bp.route('/auth/update_profile', methods=['POST'])
def update_profile():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing token'}), 401
        
    token = auth_header.split(' ')[1]
    try:
        payload = decode_jwt(token)
        if is_token_blacklisted(payload['jti']):
            return jsonify({'error': 'Token revoked'}), 401
            
        user = User.query.get(payload['sub'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        data = request.get_json()
        
        if 'name' in data:
            user.name = data['name']
        if 'bio' in data:
            user.bio = data['bio']
        if 'location' in data:
            user.location = data['location']
        if 'avatar' in data:
            user.avatar = data['avatar']
            
        db.session.commit()
        
        return jsonify({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.avatar,
            "bio": user.bio,
            "location": user.location
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 401
