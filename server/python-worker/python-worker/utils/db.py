import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB client instance
_client = None
_db = None


def get_db():
    """
    Get MongoDB database instance.
    Connects to the same MongoDB used by Node.js backend.
    
    Returns:
        Database: MongoDB database instance
    """
    global _client, _db
    
    if _db is not None:
        return _db
    
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/resume_parser')
        
        # Create MongoDB client
        _client = MongoClient(mongodb_uri)
        
        # Get database name from URI or use default
        # Extract database name from URI (last part after /)
        db_name = mongodb_uri.split('/')[-1].split('?')[0]
        if not db_name:
            db_name = 'resume_parser'
        
        _db = _client[db_name]
        
        # Test connection
        _client.admin.command('ping')
        print(f'MongoDB Connected: {db_name}')
        
        return _db
    except Exception as error:
        print(f'MongoDB connection error: {error}')
        raise error


def close_db():
    """
    Close MongoDB connection gracefully.
    """
    global _client, _db
    
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        print('MongoDB connection closed')
