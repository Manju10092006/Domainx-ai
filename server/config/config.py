import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET = os.getenv("JWT_SECRET")
    
    if not SECRET_KEY:
        raise RuntimeError("SECRET_KEY environment variable is required")
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET environment variable is required")

    # Database connection
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Redis
    REDIS_URL = os.getenv("REDIS_URL")

    # RabbitMQ
    RABBITMQ_URL = os.getenv("RABBITMQ_URL")

    # OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

