from celery import Celery
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get RabbitMQ URL from environment or use default
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://localhost')

# Initialize Celery app
celery_app = Celery(
    'resume_parser',
    broker=RABBITMQ_URL,
    backend='rpc://',
    include=['tasks.resume_tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    worker_prefetch_multiplier=1,
    task_routes={
        'tasks.parse_resume_task': {'queue': 'resume_parse_queue'},
    },
    task_default_queue='resume_parse_queue',
)

# Declare the queue explicitly
from kombu import Queue

celery_app.conf.task_queues = (
    Queue('resume_parse_queue', durable=True),
)

if __name__ == '__main__':
    celery_app.start()
