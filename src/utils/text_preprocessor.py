import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import logging

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
except:
    logging.warning("Could not download NLTK data")

class TextPreprocessor:
    """
    Text preprocessing utility for NLP operations
    """
    
    def __init__(self):
        try:
            self.stop_words = set(stopwords.words('english'))
            self.lemmatizer = WordNetLemmatizer()
        except:
            self.stop_words = set()
            self.lemmatizer = None
            logging.warning("NLTK components not available, using basic preprocessing")
    
    def preprocess(self, text: str, remove_stopwords: bool = True, lemmatize: bool = True) -> str:
        """
        Comprehensive text preprocessing
        """
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove punctuation but keep sentence structure
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remove numbers (optional - might want to keep them for some analyses)
        text = re.sub(r'\d+', '', text)
        
        # Tokenize
        try:
            tokens = word_tokenize(text)
        except:
            tokens = text.split()
        
        # Remove stopwords
        if remove_stopwords and self.stop_words:
            tokens = [token for token in tokens if token not in self.stop_words]
        
        # Lemmatize
        if lemmatize and self.lemmatizer:
            tokens = [self.lemmatizer.lemmatize(token) for token in tokens]
        
        # Remove very short tokens
        tokens = [token for token in tokens if len(token) > 2]
        
        return ' '.join(tokens)
    
    def extract_features(self, text: str) -> dict:
        """
        Extract various text features for analysis
        """
        features = {}
        
        # Basic statistics
        features['length'] = len(text)
        features['word_count'] = len(text.split())
        features['sentence_count'] = len(re.split(r'[.!?]+', text))
        features['avg_word_length'] = sum(len(word) for word in text.split()) / len(text.split()) if text.split() else 0
        
        # Punctuation analysis
        features['exclamation_count'] = text.count('!')
        features['question_count'] = text.count('?')
        features['caps_ratio'] = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        
        # Suspicious patterns
        features['has_clickbait_words'] = any(word in text.lower() for word in [
            'shocking', 'unbelievable', 'amazing', 'incredible', 'you won\'t believe'
        ])
        
        features['has_urgency_words'] = any(word in text.lower() for word in [
            'urgent', 'breaking', 'alert', 'immediately', 'now'
        ])
        
        return features
    
    def clean_for_model(self, text: str) -> str:
        """
        Light preprocessing specifically for transformer models
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Remove URLs but keep the context
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '[URL]', text)
        
        # Clean up
        text = text.strip()
        
        return text
    
    def extract_entities(self, text: str) -> dict:
        """
        Extract named entities and other important information
        """
        entities = {
            'urls': re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', text),
            'emails': re.findall(r'\S+@\S+', text),
            'mentions': re.findall(r'@\w+', text),
            'hashtags': re.findall(r'#\w+', text),
            'dates': re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text),
            'phone_numbers': re.findall(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text)
        }
        
        return entities 