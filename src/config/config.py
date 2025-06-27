import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://localhost:27017/fake_news_db'
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME') or 'fake_news_db'
    
    # Model configurations
    MODEL_NAME = 'distilbert-base-uncased'
    MAX_LENGTH = 512
    BATCH_SIZE = 16
    
    # KMP Algorithm settings
    TRUSTED_SOURCES_THRESHOLD = 0.8
    SIMILARITY_THRESHOLD = 0.7 