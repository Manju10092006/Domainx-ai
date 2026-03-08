from flask import Blueprint, request, jsonify
from models.models import db, User
from utils.jwt_utils import decode_jwt
from utils.redis_sessions import is_token_blacklisted

user_bp = Blueprint('user', __name__)

@user_bp.route('/user/update', methods=['PATCH'])
def update_user():
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
