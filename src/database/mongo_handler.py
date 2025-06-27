from pymongo import MongoClient
from datetime import datetime
from typing import List, Dict, Optional
from src.config.config import Config
import logging

class MongoHandler:
    def __init__(self):
        self.config = Config()
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        try:
            self.client = MongoClient(self.config.MONGO_URI)
            self.db = self.client[self.config.MONGO_DB_NAME]
            self.client.admin.command('ping')
            logging.info("Successfully connected to MongoDB")
        except Exception as e:
            logging.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    def store_prediction(self, text: str, prediction_result: Dict) -> str:
        try:
            document = {
                "text": text,
                "prediction": prediction_result.get('prediction'),
                "confidence": prediction_result.get('confidence'),
                "timestamp": datetime.utcnow()
            }
            result = self.db.predictions.insert_one(document)
            return str(result.inserted_id)
        except Exception as e:
            logging.error(f"Error storing prediction: {str(e)}")
            raise
    
    def get_prediction_history(self, limit: int = 100) -> List[Dict]:
        try:
            cursor = self.db.predictions.find().sort("timestamp", -1).limit(limit)
            history = []
            for doc in cursor:
                doc['_id'] = str(doc['_id'])
                history.append(doc)
            return history
        except Exception as e:
            logging.error(f"Error retrieving history: {str(e)}")
            return [] 