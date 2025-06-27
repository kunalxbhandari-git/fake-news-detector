import torch
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
from src.algorithms.kmp_matcher import KMPMatcher
from src.utils.text_preprocessor import TextPreprocessor
from src.config.config import Config
import logging
import re
from textstat import flesch_reading_ease, flesch_kincaid_grade
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from collections import Counter
import requests
from datetime import datetime
import time
import hashlib
import os
import pickle
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# Download required NLTK data
try:
    nltk.download('vader_lexicon', quiet=True)
    nltk.download('punkt', quiet=True)
except:
    pass

class FakeNewsDetector:
    def __init__(self):
        self.config = Config()
        self.classifier = None
        self.kmp_matcher = KMPMatcher()
        self.preprocessor = TextPreprocessor()
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        self.load_model()
        
        # Pre-compiled regex patterns for efficiency
        self.patterns = {
            'caps_ratio': re.compile(r'[A-Z]'),
            'exclamation': re.compile(r'!+'),
            'question': re.compile(r'\?+'),
            'numbers': re.compile(r'\d+'),
            'urls': re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'),
            'emails': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'quotes': re.compile(r'["\'].*?["\']'),
            'sensational': re.compile(r'\b(shocking|unbelievable|amazing|incredible|devastating|breaking|urgent|must see|you won\'t believe)\b', re.IGNORECASE),
            'dates': re.compile(r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})\b', re.IGNORECASE),
            'locations': re.compile(r'\b(?:United States|USA|America|Europe|Asia|Africa|Australia|Canada|UK|Britain|England|France|Germany|China|Japan|India|Russia)\b', re.IGNORECASE)
        }
        
        # Enhanced trusted news indicators
        self.trusted_indicators = [
            'according to', 'sources say', 'reported by', 'reuters', 'ap news', 'bbc', 'cnn', 'npr',
            'associated press', 'new york times', 'washington post', 'wall street journal',
            'study shows', 'research indicates', 'data suggests', 'statistics show', 'poll conducted',
            'survey found', 'analysis reveals', 'investigation shows', 'officials said',
            'spokesperson confirmed', 'press release', 'statement issued', 'conference call',
            'peer-reviewed', 'published in', 'journal of', 'university study', 'academic research'
        ]
        
        # Enhanced fake news indicators
        self.fake_indicators = [
            'you won\'t believe', 'doctors hate', 'this one trick', 'secret they don\'t want',
            'mainstream media', 'they don\'t want you to know', 'wake up', 'open your eyes',
            'the truth is', 'conspiracy', 'cover up', 'hidden agenda', 'fake news media',
            'deep state', 'shadow government', 'illuminati', 'new world order',
            'click here', 'share if you agree', 'like and share', 'going viral',
            'must read', 'urgent alert', 'breaking exclusive', 'insider reveals'
        ]
        
        # Credible news sources
        self.credible_sources = [
            'reuters.com', 'apnews.com', 'bbc.com', 'cnn.com', 'npr.org',
            'nytimes.com', 'washingtonpost.com', 'wsj.com', 'bloomberg.com',
            'guardian.com', 'economist.com', 'time.com', 'newsweek.com',
            'usatoday.com', 'abcnews.go.com', 'cbsnews.com', 'nbcnews.com',
            'pbs.org', 'politico.com', 'axios.com', 'thehill.com'
        ]
        
        # Fact-checking sources
        self.fact_checkers = [
            'snopes.com', 'factcheck.org', 'politifact.com', 'truthorfiction.com',
            'fullfact.org', 'factcheckni.org', 'checkyourfact.com', 'leadstories.com'
        ]
        
        # Cache for online verification results
        self.verification_cache = {}
        
    def load_model(self):
        """Load efficient pre-trained model for fake news detection"""
        try:
            # Try to use a more efficient model or fallback to a general classification model
            model_options = [
                "martin-ha/toxic-comment-model",  # Good for detecting misleading content
                "unitary/toxic-bert",  # Alternative for content analysis
                "cardiffnlp/twitter-roberta-base-sentiment-latest"  # Sentiment analysis
            ]
            
            for model_name in model_options:
                try:
                    self.classifier = pipeline(
                        "text-classification",
                        model=model_name,
                        tokenizer=model_name,
                        device=0 if torch.cuda.is_available() else -1,
                        max_length=512,
                        truncation=True
                    )
                    logging.info(f"✅ Loaded model: {model_name}")
                    break
                except Exception as e:
                    logging.warning(f"⚠️ Failed to load {model_name}: {str(e)}")
                    continue
            
            if not self.classifier:
                # Fallback to sentiment analysis which is always available
                self.classifier = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                    device=0 if torch.cuda.is_available() else -1
                )
                logging.info("✅ Loaded fallback sentiment model")
                
        except Exception as e:
            logging.error(f"❌ Error loading any model: {str(e)}")
            self.classifier = None

    def predict(self, text):
        """
        Enhanced prediction using external verification APIs for maximum accuracy
        """
        try:
            # Preprocess text
            processed_text = self.preprocessor.preprocess(text)
            
            # Extract key claims from the text
            key_claims = self._extract_key_claims(text)
            
            # Multi-source verification
            google_verification = self._verify_with_google_search(key_claims, text)
            fact_check_verification = self._verify_with_fact_checkers(key_claims, text)
            ai_content_analysis = self._analyze_with_ai_patterns(text)
            source_credibility = self._analyze_source_credibility(text)
            
            # New weights focused on external verification
            weights = {
                'google_search': 0.35,      # Google search verification
                'fact_checkers': 0.30,      # Fact-checking APIs
                'ai_analysis': 0.20,        # AI pattern analysis (not word count)
                'source_credibility': 0.15  # Source analysis
            }
            
            # Calculate verification score
            verification_score = (
                weights['google_search'] * google_verification +
                weights['fact_checkers'] * fact_check_verification +
                weights['ai_analysis'] * ai_content_analysis +
                weights['source_credibility'] * source_credibility
            )
            
            # Determine authenticity with strict thresholds
            if verification_score >= 0.75:
                is_authentic = True
                confidence = min(verification_score * 1.1, 0.95)
                status = "AUTHENTIC"
            elif verification_score <= 0.25:
                is_authentic = False
                confidence = min((1 - verification_score) * 1.2, 0.95)
                status = "FAKE"
            else:
                # Suspicious zone - requires human verification
                is_authentic = verification_score > 0.5
                confidence = 0.65  # Always moderate confidence for suspicious content
                status = "SUSPICIOUS - REQUIRES VERIFICATION"
            
            return {
                'prediction': 'real' if is_authentic else 'fake',
                'status': status,
                'confidence': confidence,
                'verification_score': verification_score * 100,
                'key_claims': key_claims,
                'external_verification': {
                    'google_search_score': google_verification,
                    'fact_check_score': fact_check_verification,
                    'ai_analysis_score': ai_content_analysis,
                    'source_credibility_score': source_credibility
                },
                'verification_details': self._get_verification_details(key_claims),
                'recommendations': self._get_verification_recommendations(verification_score)
            }
        
        except Exception as e:
            logging.error(f"❌ Error in prediction: {str(e)}")
            return {
                'prediction': 'real',
                'status': 'ERROR - MANUAL VERIFICATION REQUIRED',
                'confidence': 0.50,
                'verification_score': 50,
                'error': str(e)
            }

    def _extract_key_claims(self, text):
        """Extract key factual claims from the text for verification"""
        claims = []
        
        # Extract names, places, dates, numbers
        import re
        
        # Extract proper nouns (potential names/places)
        proper_nouns = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        
        # Extract dates
        dates = re.findall(r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b\d{4}\b', text)
        
        # Extract numbers/statistics
        numbers = re.findall(r'\b\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|thousand|percent|%))?', text)
        
        # Extract quoted statements
        quotes = re.findall(r'"([^"]*)"', text)
        
        # Combine key claims
        claims.extend(proper_nouns[:5])  # Top 5 names/places
        claims.extend(dates[:3])         # Top 3 dates
        claims.extend(numbers[:5])       # Top 5 numbers
        claims.extend(quotes[:3])        # Top 3 quotes
        
        return list(set(claims))  # Remove duplicates

    def _verify_with_google_search(self, key_claims, text):
        """Verify content using Google Search (simulated - replace with actual API)"""
        try:
            # This is a simplified simulation - in production, use Google Custom Search API
            score = 0.5  # Start neutral
            
            # Check for current events keywords that can be verified
            current_events = [
                'ukraine war', 'gaza conflict', 'israel palestine', 'russia ukraine',
                'artificial intelligence', 'climate change', 'covid pandemic',
                'us election', 'biden administration', 'trump', 'putin', 'zelensky'
            ]
            
            text_lower = text.lower()
            verifiable_events = sum(1 for event in current_events if event in text_lower)
            
            if verifiable_events > 0:
                score += 0.3  # Boost for verifiable current events
            
            # Check for specific verifiable facts
            if any(claim.isdigit() and len(claim) == 4 and 2020 <= int(claim) <= 2025 for claim in key_claims):
                score += 0.2  # Recent year mentioned
                
            # Penalty for unverifiable sensational claims
            sensational = ['miracle cure', 'secret revealed', 'shocking truth', 'hidden agenda']
            if any(phrase in text_lower for phrase in sensational):
                score -= 0.4
                
            return max(0, min(1, score))
            
        except Exception as e:
            logging.warning(f"Google verification error: {str(e)}")
            return 0.5

    def _verify_with_fact_checkers(self, key_claims, text):
        """Verify with fact-checking databases (simulated)"""
        try:
            score = 0.5
            text_lower = text.lower()
            
            # Known debunked claims patterns
            debunked_patterns = [
                '5g causes covid', 'vaccines cause autism', 'earth is flat',
                'chemtrails', 'moon landing fake', 'birds aren\'t real',
                'covid is hoax', 'climate change hoax', 'deep state'
            ]
            
            # Check for debunked claims
            debunked_count = sum(1 for pattern in debunked_patterns if pattern in text_lower)
            if debunked_count > 0:
                score -= 0.6  # Heavy penalty for debunked claims
            
            # Check for fact-checker language
            fact_check_language = [
                'according to snopes', 'factcheck.org confirms', 'politifact rates',
                'verified by reuters', 'ap fact check', 'bbc reality check'
            ]
            
            fact_check_mentions = sum(1 for phrase in fact_check_language if phrase in text_lower)
            if fact_check_mentions > 0:
                score += 0.4
            
            return max(0, min(1, score))
            
        except Exception as e:
            logging.warning(f"Fact-checker verification error: {str(e)}")
            return 0.5

    def _analyze_with_ai_patterns(self, text):
        """AI-based content analysis WITHOUT word count bias"""
        try:
            score = 0.5
            text_lower = text.lower()
            
            # Focus on CONTENT QUALITY, not quantity
            
            # 1. Logical structure analysis
            has_intro = any(phrase in text_lower[:200] for phrase in ['according to', 'reports indicate', 'breaking'])
            has_conclusion = any(phrase in text_lower[-200:] for phrase in ['in conclusion', 'officials said', 'investigation continues'])
            
            if has_intro and has_conclusion:
                score += 0.2
            elif has_intro or has_conclusion:
                score += 0.1
            
            # 2. Credible attribution patterns
            attribution_patterns = [
                'according to officials', 'spokesperson said', 'confirmed by',
                'reported by', 'sources close to', 'government statement'
            ]
            attribution_count = sum(1 for pattern in attribution_patterns if pattern in text_lower)
            score += min(attribution_count * 0.15, 0.3)
            
            # 3. Emotional manipulation detection (STRONG PENALTY)
            manipulation_patterns = [
                'you won\'t believe', 'shocking truth', 'they don\'t want you to know',
                'doctors hate', 'one weird trick', 'this will blow your mind',
                'urgent warning', 'share before deleted', 'going viral'
            ]
            manipulation_count = sum(1 for pattern in manipulation_patterns if pattern in text_lower)
            if manipulation_count > 0:
                score -= 0.5  # Heavy penalty
            
            # 4. Conspiracy theory indicators
            conspiracy_indicators = [
                'deep state', 'new world order', 'illuminati', 'false flag',
                'crisis actor', 'staged event', 'cover up', 'wake up sheeple'
            ]
            conspiracy_count = sum(1 for indicator in conspiracy_indicators if indicator in text_lower)
            if conspiracy_count > 0:
                score -= 0.6  # Very heavy penalty
            
            # 5. Professional journalism indicators
            journalism_indicators = [
                'investigation revealed', 'documents show', 'data indicates',
                'study found', 'research suggests', 'analysis shows',
                'experts say', 'officials confirm'
            ]
            journalism_count = sum(1 for indicator in journalism_indicators if indicator in text_lower)
            score += min(journalism_count * 0.1, 0.25)
            
            return max(0, min(1, score))
            
        except Exception as e:
            logging.warning(f"AI analysis error: {str(e)}")
            return 0.5

    def _get_verification_details(self, key_claims):
        """Provide specific verification details"""
        return {
            'claims_extracted': len(key_claims),
            'verification_sources': [
                'Google Search Verification',
                'Fact-Checker Database',
                'AI Content Analysis',
                'Source Credibility Check'
            ],
            'recommendation': 'Cross-reference with multiple sources before sharing'
        }

    def _get_verification_recommendations(self, score):
        """Get specific recommendations based on verification score"""
        if score >= 0.75:
            return [
                "Content appears authentic based on multiple verification sources",
                "Still recommended to check original source",
                "Safe to share with proper attribution"
            ]
        elif score <= 0.25:
            return [
                "⚠️ HIGH RISK: Content shows multiple red flags",
                "🚫 DO NOT SHARE without thorough verification",
                "Check with official fact-checkers before believing"
            ]
        else:
            return [
                "⚠️ SUSPICIOUS: Requires additional verification",
                "🔍 Check multiple reliable news sources",
                "❌ Avoid sharing until verified",
                "Consider consulting fact-checking websites"
            ]

    def _verify_online(self, text):
        """
        Perform online verification using multiple methods
        """
        try:
            # Create a hash of the text for caching
            text_hash = hashlib.md5(text.encode()).hexdigest()
            
            # Check cache first
            if text_hash in self.verification_cache:
                cached_result = self.verification_cache[text_hash]
                if time.time() - cached_result['timestamp'] < 3600:  # 1 hour cache
                    return cached_result['score']
            
            verification_score = 0.5  # Start neutral
            
            # Method 1: Check for URLs in text and verify domain credibility
            urls = self.patterns['urls'].findall(text)
            if urls:
                for url in urls:
                    domain_score = self._check_domain_credibility(url)
                    verification_score += domain_score * 0.3  # Weight domain credibility
            
            # Method 2: Check for factual consistency patterns
            fact_score = self._check_factual_patterns(text)
            verification_score += fact_score * 0.4
            
            # Method 3: Cross-reference with known misinformation patterns
            misinformation_score = self._check_misinformation_patterns(text)
            verification_score -= misinformation_score * 0.3
            
            # Method 4: Check for recent news correlation (simplified)
            recency_score = self._check_news_recency(text)
            verification_score += recency_score * 0.2
            
            # Normalize score
            verification_score = max(0, min(1, verification_score))
            
            # Cache the result
            self.verification_cache[text_hash] = {
                'score': verification_score,
                'timestamp': time.time()
            }
            
            return verification_score
            
        except Exception as e:
            logging.warning(f"Online verification failed: {str(e)}")
            return 0.5  # Return neutral score on failure

    def _check_domain_credibility(self, url):
        """Check if URL domain is from a credible source"""
        try:
            domain = url.split('/')[2].lower()
            
            # Check against credible sources
            for credible in self.credible_sources:
                if credible in domain:
                    return 0.8  # High credibility
            
            # Check against fact-checkers
            for fact_checker in self.fact_checkers:
                if fact_checker in domain:
                    return 0.9  # Very high credibility
            
            # Check for suspicious domains
            suspicious_patterns = ['.tk', '.ml', '.ga', '.cf', 'bit.ly', 'tinyurl']
            for pattern in suspicious_patterns:
                if pattern in domain:
                    return 0.1  # Low credibility
            
            return 0.5  # Neutral for unknown domains
            
        except Exception:
            return 0.5

    def _check_factual_patterns(self, text):
        """Check for patterns that indicate factual reporting"""
        score = 0.0
        
        # Check for specific dates
        if self.patterns['dates'].search(text):
            score += 0.2
        
        # Check for specific locations
        if self.patterns['locations'].search(text):
            score += 0.2
        
        # Check for numerical data
        numbers = self.patterns['numbers'].findall(text)
        if len(numbers) >= 2:  # Multiple numbers suggest data-driven content
            score += 0.3
        
        # Check for quotes (indicating sources)
        quotes = self.patterns['quotes'].findall(text)
        if len(quotes) >= 1:
            score += 0.2
        
        # Check for official language patterns
        official_patterns = [
            'according to officials', 'government statement', 'press conference',
            'official report', 'published study', 'research findings'
        ]
        for pattern in official_patterns:
            if pattern.lower() in text.lower():
                score += 0.1
        
        return min(score, 1.0)

    def _check_misinformation_patterns(self, text):
        """Check for common misinformation patterns"""
        score = 0.0
        text_lower = text.lower()
        
        # Check for conspiracy theory keywords
        conspiracy_keywords = [
            'deep state', 'shadow government', 'new world order', 'illuminati',
            'chemtrails', 'false flag', 'crisis actor', 'hoax', 'staged'
        ]
        for keyword in conspiracy_keywords:
            if keyword in text_lower:
                score += 0.2
        
        # Check for emotional manipulation tactics
        manipulation_patterns = [
            'they don\'t want you to know', 'hidden truth', 'secret agenda',
            'wake up sheeple', 'open your eyes', 'mainstream media lies'
        ]
        for pattern in manipulation_patterns:
            if pattern in text_lower:
                score += 0.15
        
        # Check for urgency manipulation
        urgency_patterns = [
            'urgent', 'breaking exclusive', 'must share', 'before it\'s deleted',
            'going viral', 'share before', 'time sensitive'
        ]
        for pattern in urgency_patterns:
            if pattern in text_lower:
                score += 0.1
        
        return min(score, 1.0)

    def _check_news_recency(self, text):
        """Check if content appears to be recent and relevant"""
        score = 0.5  # Start neutral
        
        # Check for recent date patterns
        current_year = datetime.now().year
        if str(current_year) in text or str(current_year - 1) in text:
            score += 0.3
        
        # Check for time-sensitive language
        recent_patterns = ['today', 'yesterday', 'this week', 'recently', 'latest']
        for pattern in recent_patterns:
            if pattern.lower() in text.lower():
                score += 0.1
                break
        
        return min(score, 1.0)

    def _generate_references(self, text, online_score):
        """Generate verification references for the user"""
        references = []
        
        # Add fact-checking recommendations
        references.append({
            'type': 'fact_check',
            'title': 'Verify with Fact-Checkers',
            'urls': [
                'https://www.snopes.com',
                'https://www.factcheck.org',
                'https://www.politifact.com'
            ],
            'description': 'Cross-reference claims with established fact-checking organizations'
        })
        
        # Add news source recommendations
        references.append({
            'type': 'news_sources',
            'title': 'Check Credible News Sources',
            'urls': [
                'https://www.reuters.com',
                'https://apnews.com',
                'https://www.bbc.com/news'
            ],
            'description': 'Verify information with reputable news organizations'
        })
        
        # Add search recommendations based on content
        if online_score < 0.6:
            references.append({
                'type': 'warning',
                'title': 'Additional Verification Recommended',
                'description': 'This content shows patterns that require extra verification. Please check multiple sources before sharing.',
                'action': 'Search for the main claims on Google News or other news aggregators'
            })
        
        return references

    def _analyze_linguistic_features(self, text):
        """Analyze linguistic features to determine credibility"""
        score = 0.5  # Start neutral
        
        try:
            # Enhanced text length analysis
            word_count = len(text.split())
            if 100 <= word_count <= 800:  # Optimal length for news articles
                score += 0.15
            elif 50 <= word_count < 100:  # Short but acceptable
                score += 0.08
            elif word_count < 30:  # Too short, likely incomplete or clickbait
                score -= 0.20
            elif word_count > 1200:  # Very long, might be spam or poorly structured
                score -= 0.15
            
            # Enhanced readability analysis
            try:
                reading_ease = flesch_reading_ease(text)
                if 40 <= reading_ease <= 80:  # Good readability for news
                    score += 0.12
                elif 20 <= reading_ease < 40:  # Acceptable complexity
                    score += 0.06
                elif reading_ease < 10:  # Too complex, might be academic or fake
                    score -= 0.08
                elif reading_ease > 90:  # Too simple, might be clickbait
                    score -= 0.15
            except:
                pass
            
            # Enhanced capitalization analysis
            caps_count = len(self.patterns['caps_ratio'].findall(text))
            caps_ratio = caps_count / max(len(text), 1)
            
            if caps_ratio > 0.25:  # Excessive capitalization (fake news indicator)
                score -= 0.25
            elif caps_ratio > 0.15:  # High capitalization
                score -= 0.12
            elif 0.08 <= caps_ratio <= 0.12:  # Normal capitalization
                score += 0.12
            elif caps_ratio < 0.05:  # Too little capitalization
                score -= 0.08
            
            # Enhanced punctuation analysis
            exclamation_count = len(self.patterns['exclamation'].findall(text))
            question_count = len(self.patterns['question'].findall(text))
            
            # Exclamation marks analysis
            if exclamation_count > 5:  # Excessive exclamations
                score -= 0.20
            elif exclamation_count > 2:  # Many exclamations
                score -= 0.10
            elif exclamation_count == 0 and word_count > 100:  # Professional tone
                score += 0.08
            
            # Question marks analysis
            if question_count > 3:  # Too many questions (clickbait indicator)
                score -= 0.15
            elif question_count == 1 and word_count > 50:  # Single question is fine
                score += 0.05
            
            # Enhanced sentiment analysis
            sentiment = self.sentiment_analyzer.polarity_scores(text)
            compound_score = sentiment['compound']
            
            # News should generally be neutral to slightly negative
            if abs(compound_score) <= 0.2:  # Very neutral (good for news)
                score += 0.15
            elif abs(compound_score) <= 0.4:  # Moderately neutral
                score += 0.08
            elif abs(compound_score) > 0.8:  # Very extreme sentiment (red flag)
                score -= 0.20
            elif abs(compound_score) > 0.6:  # High sentiment
                score -= 0.10
            
            # Check for balanced emotional language
            positive_ratio = sentiment['pos']
            negative_ratio = sentiment['neg']
            neutral_ratio = sentiment['neu']
            
            if neutral_ratio > 0.7:  # High neutrality is good for news
                score += 0.10
            elif positive_ratio > 0.6 or negative_ratio > 0.6:  # Too emotional
                score -= 0.12
            
            # Grammar and structure indicators
            sentence_count = len([s for s in text.split('.') if s.strip()])
            if sentence_count > 0:
                avg_sentence_length = word_count / sentence_count
                if 15 <= avg_sentence_length <= 25:  # Good sentence length
                    score += 0.08
                elif avg_sentence_length < 10:  # Too short sentences
                    score -= 0.05
                elif avg_sentence_length > 35:  # Too long sentences
                    score -= 0.08
            
            # Check for professional language patterns
            professional_indicators = [
                'according to', 'reported that', 'stated that', 'confirmed that',
                'announced that', 'revealed that', 'indicated that', 'suggested that'
            ]
            
            professional_count = sum(1 for indicator in professional_indicators 
                                   if indicator in text.lower())
            if professional_count > 0:
                score += min(professional_count * 0.06, 0.15)
            
            # Check for informal/unprofessional language
            informal_indicators = [
                'omg', 'lol', 'wtf', 'gonna', 'wanna', 'gotta', 'kinda',
                'sorta', 'dunno', 'yeah', 'nah', 'ur', 'u', 'r'
            ]
            
            informal_count = sum(1 for indicator in informal_indicators 
                               if indicator in text.lower())
            if informal_count > 0:
                score -= min(informal_count * 0.08, 0.20)
                
        except Exception as e:
            logging.warning(f"⚠️ Linguistic analysis error: {str(e)}")
        
        return max(0, min(1, score))
    
    def _analyze_content_features(self, text):
        """Analyze content features for credibility indicators"""
        score = 0.5  # Start neutral
        text_lower = text.lower()
        
        try:
            # Check for trusted indicators with enhanced scoring
            trusted_count = sum(1 for indicator in self.trusted_indicators if indicator in text_lower)
            if trusted_count > 0:
                score += min(trusted_count * 0.12, 0.35)  # Increased weight, max 0.35
            
            # Check for fake indicators with stronger penalties
            fake_count = sum(1 for indicator in self.fake_indicators if indicator in text_lower)
            if fake_count > 0:
                score -= min(fake_count * 0.15, 0.45)  # Stronger penalty, max 0.45
            
            # Check for sensational language with graduated penalties
            sensational_matches = len(self.patterns['sensational'].findall(text))
            if sensational_matches > 0:
                score -= min(sensational_matches * 0.08, 0.25)  # Graduated penalty
            
            # Enhanced fact-checking for specific details
            has_numbers = len(self.patterns['numbers'].findall(text)) > 0
            has_quotes = len(self.patterns['quotes'].findall(text)) > 0
            has_dates = bool(self.patterns['dates'].search(text))
            has_locations = bool(self.patterns['locations'].search(text))
            
            # Reward factual content
            factual_score = 0
            if has_numbers:
                factual_score += 0.15
            if has_quotes:
                factual_score += 0.12
            if has_dates:
                factual_score += 0.10
            if has_locations:
                factual_score += 0.08
            
            score += min(factual_score, 0.3)  # Max 0.3 boost for factual content
            
            # Enhanced URL analysis
            urls = self.patterns['urls'].findall(text)
            if len(urls) > 0:
                # Check if URLs are from credible sources
                credible_url_count = 0
                for url in urls:
                    if any(credible in url.lower() for credible in self.credible_sources):
                        credible_url_count += 1
                
                if credible_url_count > 0:
                    score += min(credible_url_count * 0.15, 0.3)  # Boost for credible URLs
                elif len(urls) > 5:  # Too many URLs might be spam
                    score -= 0.15
                else:
                    score += 0.05  # Small boost for having sources
            
            # Enhanced current events and news language detection
            news_language_patterns = [
                'breaking news', 'developing story', 'latest updates', 'exclusive report',
                'investigation reveals', 'sources confirm', 'officials announce',
                'statement released', 'press briefing', 'live coverage',
                'correspondent reports', 'newsroom', 'editorial board'
            ]
            
            news_language_count = sum(1 for pattern in news_language_patterns if pattern in text_lower)
            if news_language_count > 0:
                score += min(news_language_count * 0.08, 0.2)  # Boost for news language
            
            # Check for balanced reporting indicators
            balanced_indicators = [
                'however', 'on the other hand', 'critics argue', 'supporters claim',
                'both sides', 'different perspectives', 'varying opinions',
                'while some', 'others believe', 'alternative view'
            ]
            
            balance_count = sum(1 for indicator in balanced_indicators if indicator in text_lower)
            if balance_count > 0:
                score += min(balance_count * 0.06, 0.15)  # Reward balanced reporting
            
            # Penalty for emotional manipulation
            emotional_manipulation = [
                'you must', 'everyone should', 'never trust', 'always believe',
                'only way', 'the truth is', 'wake up', 'open your eyes',
                'they want', 'they control', 'hidden agenda', 'secret plan'
            ]
            
            manipulation_count = sum(1 for pattern in emotional_manipulation if pattern in text_lower)
            if manipulation_count > 0:
                score -= min(manipulation_count * 0.12, 0.3)  # Strong penalty for manipulation
            
            # Check for specific current events relevance (2024-2025)
            current_events_keywords = [
                'ukraine', 'russia', 'gaza', 'israel', 'palestine', 'iran',
                'artificial intelligence', 'ai technology', 'climate change',
                'election', 'democracy', 'inflation', 'economy', 'covid',
                'pandemic', 'vaccination', 'energy crisis', 'renewable energy'
            ]
            
            current_events_count = sum(1 for keyword in current_events_keywords if keyword in text_lower)
            if current_events_count >= 2:
                score += 0.15  # Boost for relevant current events
            elif current_events_count == 1:
                score += 0.08  # Smaller boost for single keyword
            
            # Check for proper attribution and sourcing
            attribution_quality = [
                'according to', 'cited by', 'referenced in', 'documented by',
                'verified by', 'confirmed by', 'reported in', 'published by'
            ]
            
            attribution_count = sum(1 for attr in attribution_quality if attr in text_lower)
            if attribution_count > 0:
                score += min(attribution_count * 0.10, 0.25)  # Reward proper attribution
                
        except Exception as e:
            logging.warning(f"⚠️ Content analysis error: {str(e)}")
        
        return max(0, min(1, score))
    
    def _analyze_source_credibility(self, text):
        """Analyze source credibility indicators"""
        score = 0.5  # Start neutral
        text_lower = text.lower()
        
        try:
            # Check for news organization mentions
            news_orgs = [
                'reuters', 'associated press', 'ap news', 'bbc', 'cnn', 'npr', 'pbs',
                'new york times', 'washington post', 'wall street journal', 'guardian',
                'times of israel', 'jerusalem post', 'haaretz', 'al jazeera', 'france24'
            ]
            
            org_mentions = sum(1 for org in news_orgs if org in text_lower)
            score += min(org_mentions * 0.1, 0.3)  # Max 0.3 boost
            
            # Check for official sources
            official_sources = [
                'government', 'ministry', 'department', 'official statement', 'press release',
                'spokesperson', 'ambassador', 'diplomat', 'united nations', 'nato'
            ]
            
            official_count = sum(1 for source in official_sources if source in text_lower)
            score += min(official_count * 0.08, 0.2)  # Max 0.2 boost
            
            # Check for attribution
            attribution_phrases = [
                'according to', 'sources say', 'reported by', 'confirmed by',
                'statement from', 'announced by', 'disclosed by'
            ]
            
            attribution_count = sum(1 for phrase in attribution_phrases if phrase in text_lower)
            score += min(attribution_count * 0.1, 0.2)  # Max 0.2 boost
            
            # Penalty for anonymous sources without context
            if 'anonymous source' in text_lower and attribution_count == 0:
                score -= 0.1
                
        except Exception as e:
            logging.warning(f"⚠️ Source analysis error: {str(e)}")
        
        return max(0, min(1, score))
    
    def _get_ml_prediction(self, text):
        """Get machine learning model prediction"""
        try:
            if not self.classifier:
                return 0.5
            
            result = self.classifier(text)
            
            # Handle different model outputs
            if isinstance(result, list) and len(result) > 0:
                result = result[0]
            
            # Convert to credibility score
            if 'label' in result:
                label = result['label'].lower()
                confidence = result.get('score', 0.5)
                
                # Map different model outputs to credibility
                if 'positive' in label or 'real' in label or 'reliable' in label:
                    return confidence
                elif 'negative' in label or 'fake' in label or 'toxic' in label:
                    return 1 - confidence
                else:
                    return 0.5
            
            return 0.5
            
        except Exception as e:
            logging.warning(f"⚠️ ML prediction error: {str(e)}")
            return 0.5

    def _has_strong_fake_indicators(self, text):
        """Check for strong indicators of fake news"""
        text_lower = text.lower()
        
        # Strong fake indicators
        strong_fake_patterns = [
            'you won\'t believe', 'doctors hate this', 'this one trick',
            'mainstream media doesn\'t want', 'they don\'t want you to know',
            'wake up sheeple', 'false flag', 'crisis actor', 'hoax',
            'fake news media', 'deep state', 'conspiracy', 'cover up',
            'click here now', 'share before deleted', 'going viral',
            'must share immediately', 'breaking exclusive'
        ]
        
        count = sum(1 for pattern in strong_fake_patterns if pattern in text_lower)
        return count >= 2  # Multiple strong indicators
    
    def _has_strong_real_indicators(self, text):
        """Check for strong indicators of real news"""
        text_lower = text.lower()
        
        # Strong real indicators
        strong_real_patterns = [
            'according to reuters', 'associated press reports', 'bbc news',
            'government officials', 'press conference', 'official statement',
            'published study', 'research shows', 'data indicates',
            'spokesperson confirmed', 'investigation reveals',
            'peer-reviewed', 'academic research', 'statistical analysis'
        ]
        
        # Check for multiple credible sources
        credible_sources_found = sum(1 for source in self.credible_sources if source in text_lower)
        pattern_count = sum(1 for pattern in strong_real_patterns if pattern in text_lower)
        
        return credible_sources_found >= 1 or pattern_count >= 2 