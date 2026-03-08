import jwt
import datetime
from config import Config

def create_jwt(user_id, expires_days=7):
    """
    Creates a JWT token for a user.
    """
    payload = {
        'sub': user_id,
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=expires_days),
        'jti': str(datetime.datetime.utcnow().timestamp()) # Unique identifier for the token
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

def decode_jwt(token):
    """
    Decodes a JWT token. Raises exceptions if invalid or expired.
    """
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')
