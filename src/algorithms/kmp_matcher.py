import re
from typing import List, Dict, Tuple
from src.data.trusted_sources import TRUSTED_SOURCES, UNRELIABLE_SOURCES
import logging

class KMPMatcher:
    """
    KMP (Knuth-Morris-Pratt) String Matching Algorithm implementation
    for verifying news sources and detecting patterns in fake news
    """
    
    def __init__(self):
        self.trusted_sources = TRUSTED_SOURCES
        self.unreliable_sources = UNRELIABLE_SOURCES
        self.fake_news_patterns = self._load_fake_news_patterns()
    
    def _load_fake_news_patterns(self) -> List[str]:
        """Load common fake news patterns for KMP matching"""
        return [
            "breaking news",
            "you won't believe",
            "shocking truth",
            "doctors hate this",
            "click here",
            "must read",
            "urgent",
            "exclusive",
            "leaked",
            "conspiracy"
        ]
    
    def compute_lps_array(self, pattern: str) -> List[int]:
        """
        Compute Longest Proper Prefix which is also Suffix (LPS) array
        for KMP algorithm
        """
        pattern = pattern.lower()
        m = len(pattern)
        lps = [0] * m
        length = 0
        i = 1
        
        while i < m:
            if pattern[i] == pattern[length]:
                length += 1
                lps[i] = length
                i += 1
            else:
                if length != 0:
                    length = lps[length - 1]
                else:
                    lps[i] = 0
                    i += 1
        
        return lps
    
    def kmp_search(self, text: str, pattern: str) -> List[int]:
        """
        KMP string matching algorithm implementation
        Returns list of starting indices where pattern is found
        """
        text = text.lower()
        pattern = pattern.lower()
        
        n = len(text)
        m = len(pattern)
        
        if m == 0:
            return []
        
        # Compute LPS array
        lps = self.compute_lps_array(pattern)
        
        matches = []
        i = 0  # index for text
        j = 0  # index for pattern
        
        while i < n:
            if pattern[j] == text[i]:
                i += 1
                j += 1
            
            if j == m:
                matches.append(i - j)
                j = lps[j - 1]
            elif i < n and pattern[j] != text[i]:
                if j != 0:
                    j = lps[j - 1]
                else:
                    i += 1
        
        return matches
    
    def verify_sources(self, text: str) -> Dict:
        """
        Verify news sources using KMP matching
        Returns reliability score and matched sources
        """
        try:
            matched_trusted = []
            matched_unreliable = []
            
            # Check for trusted sources
            for source in self.trusted_sources:
                matches = self.kmp_search(text, source)
                if matches:
                    matched_trusted.append({
                        'source': source,
                        'positions': matches,
                        'count': len(matches)
                    })
            
            # Check for unreliable sources
            for source in self.unreliable_sources:
                matches = self.kmp_search(text, source)
                if matches:
                    matched_unreliable.append({
                        'source': source,
                        'positions': matches,
                        'count': len(matches)
                    })
            
            # Calculate reliability score
            reliability_score = self._calculate_reliability_score(
                matched_trusted, matched_unreliable
            )
            
            return {
                'matched_sources': {
                    'trusted': matched_trusted,
                    'unreliable': matched_unreliable
                },
                'reliability_score': reliability_score,
                'total_trusted_matches': len(matched_trusted),
                'total_unreliable_matches': len(matched_unreliable)
            }
        
        except Exception as e:
            logging.error(f"Error in source verification: {str(e)}")
            return {
                'matched_sources': {'trusted': [], 'unreliable': []},
                'reliability_score': 0.5,
                'total_trusted_matches': 0,
                'total_unreliable_matches': 0
            }
    
    def detect_fake_patterns(self, text: str) -> Dict:
        """
        Detect common fake news patterns using KMP matching
        """
        pattern_matches = []
        
        for pattern in self.fake_news_patterns:
            matches = self.kmp_search(text, pattern)
            if matches:
                pattern_matches.append({
                    'pattern': pattern,
                    'positions': matches,
                    'count': len(matches)
                })
        
        # Calculate suspicion score based on pattern matches
        suspicion_score = min(len(pattern_matches) * 0.1, 1.0)
        
        return {
            'pattern_matches': pattern_matches,
            'suspicion_score': suspicion_score,
            'total_patterns_found': len(pattern_matches)
        }
    
    def _calculate_reliability_score(self, trusted_matches: List, unreliable_matches: List) -> float:
        """
        Calculate reliability score based on source matches
        Score ranges from 0.0 (completely unreliable) to 1.0 (completely reliable)
        """
        trusted_count = len(trusted_matches)
        unreliable_count = len(unreliable_matches)
        
        if trusted_count == 0 and unreliable_count == 0:
            return 0.5  # Neutral score when no sources found
        
        # Weight trusted sources more heavily
        trusted_weight = trusted_count * 2
        unreliable_weight = unreliable_count * 1
        
        total_weight = trusted_weight + unreliable_weight
        reliability_score = trusted_weight / total_weight if total_weight > 0 else 0.5
        
        return min(max(reliability_score, 0.0), 1.0)
    
    def analyze_text_comprehensive(self, text: str) -> Dict:
        """
        Comprehensive analysis combining source verification and pattern detection
        """
        source_analysis = self.verify_sources(text)
        pattern_analysis = self.detect_fake_patterns(text)
        
        # Combine scores
        final_reliability = source_analysis['reliability_score'] * (1 - pattern_analysis['suspicion_score'])
        
        return {
            'source_analysis': source_analysis,
            'pattern_analysis': pattern_analysis,
            'final_reliability_score': final_reliability,
            'recommendation': 'reliable' if final_reliability > 0.6 else 'suspicious' if final_reliability > 0.3 else 'unreliable'
        } 