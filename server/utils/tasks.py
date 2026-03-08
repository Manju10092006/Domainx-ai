from celery import Celery
from config import Config
import time

# Initialize Celery
celery_app = Celery('tasks', broker=Config.RABBITMQ_URL, backend=Config.REDIS_URL)

@celery_app.task
def welcome_task(user_id):
    """
    Simulates sending a welcome email to the user.
    """
    # In a real app, you would import the User model and fetch the user email here.
    # from models import User
    # user = User.query.get(user_id)
    
    print(f"Sending welcome email to user_id: {user_id}...")
    
    # Simulate email sending delay
    time.sleep(2)
    
    # Here you would use a mail provider like SendGrid, AWS SES, or SMTP.
    # send_email(user.email, "Welcome!", "Thanks for signing up!")
    
    print(f"Welcome email sent to user_id: {user_id}!")
    return True
