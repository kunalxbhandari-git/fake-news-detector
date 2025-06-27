import unittest
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from algorithms.kmp_matcher import KMPMatcher

class TestKMPAlgorithm(unittest.TestCase):
    
    def setUp(self):
        self.kmp_matcher = KMPMatcher()
    
    def test_compute_lps_array(self):
        """Test LPS array computation"""
        pattern = "abcabcab"
        expected_lps = [0, 0, 0, 1, 2, 3, 4, 5]
        result = self.kmp_matcher.compute_lps_array(pattern)
        self.assertEqual(result, expected_lps)
        
        pattern = "aaaa"
        expected_lps = [0, 1, 2, 3]
        result = self.kmp_matcher.compute_lps_array(pattern)
        self.assertEqual(result, expected_lps)
    
    def test_kmp_search_basic(self):
        """Test basic KMP search functionality"""
        text = "this is a test string for testing"
        pattern = "test"
        result = self.kmp_matcher.kmp_search(text, pattern)
        self.assertEqual(result, [10, 29])  # Positions where "test" appears
    
    def test_kmp_search_no_match(self):
        """Test KMP search with no matches"""
        text = "hello world"
        pattern = "xyz"
        result = self.kmp_matcher.kmp_search(text, pattern)
        self.assertEqual(result, [])
    
    def test_kmp_search_case_insensitive(self):
        """Test case insensitive matching"""
        text = "This is a TEST string"
        pattern = "test"
        result = self.kmp_matcher.kmp_search(text, pattern)
        self.assertEqual(len(result), 1)
    
    def test_verify_sources_trusted(self):
        """Test source verification with trusted sources"""
        text = "According to Reuters and BBC News, this is a legitimate story."
        result = self.kmp_matcher.verify_sources(text)
        
        self.assertGreater(len(result['matched_sources']['trusted']), 0)
        self.assertGreater(result['reliability_score'], 0.5)
    
    def test_verify_sources_unreliable(self):
        """Test source verification with unreliable sources"""
        text = "This story from InfoWars reveals shocking truth about..."
        result = self.kmp_matcher.verify_sources(text)
        
        self.assertGreater(len(result['matched_sources']['unreliable']), 0)
        self.assertLess(result['reliability_score'], 0.5)
    
    def test_detect_fake_patterns(self):
        """Test fake news pattern detection"""
        text = "You won't believe this shocking truth that doctors hate!"
        result = self.kmp_matcher.detect_fake_patterns(text)
        
        self.assertGreater(len(result['pattern_matches']), 0)
        self.assertGreater(result['suspicion_score'], 0)
    
    def test_comprehensive_analysis(self):
        """Test comprehensive text analysis"""
        text = "Breaking news from Reuters: Scientists make important discovery"
        result = self.kmp_matcher.analyze_text_comprehensive(text)
        
        self.assertIn('source_analysis', result)
        self.assertIn('pattern_analysis', result)
        self.assertIn('final_reliability_score', result)
        self.assertIn('recommendation', result)

if __name__ == '__main__':
    unittest.main() 