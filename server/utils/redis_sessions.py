import redis
from config import Config

# Initialize Redis connection (optional for development)
r = None
if Config.REDIS_URL:
    try:
        r = redis.from_url(Config.REDIS_URL)
    except Exception as e:
        print(f"Warning: Could not connect to Redis: {e}")
        print("Token blacklisting will be disabled.")
else:
    print("Warning: REDIS_URL not set. Token blacklisting will be disabled.")

def add_token_to_blacklist(token_jti, ttl):
    """
    Adds a token JTI to the Redis blacklist with a TTL (Time To Live).
    The TTL should match the remaining validity time of the token.
    """
    if r is not None:
        try:
            r.setex(f"blacklist:{token_jti}", ttl, "true")
        except Exception as e:
            print(f"Warning: Could not blacklist token: {e}")

def is_token_blacklisted(token_jti):
    """
    Checks if a token JTI is in the blacklist.
    Returns True if blacklisted, False otherwise.
    """
    if r is not None:
        try:
            return r.exists(f"blacklist:{token_jti}") == 1
        except Exception as e:
            print(f"Warning: Could not check token blacklist: {e}")
            return False
    return False
