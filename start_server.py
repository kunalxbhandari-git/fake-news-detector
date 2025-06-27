#!/usr/bin/env python3
"""
🔍 AI-Based Fake News Detector - Server Startup Script
=====================================================

This script starts the Flask server with enhanced fake news detection
featuring creative AI analysis and improved error handling.

Features:
- ✅ Fixed connection issues
- 🎨 Creative analysis with insights and recommendations  
- 🔧 Better error handling and fallback responses
- 📊 Enhanced UI with credibility scores and risk assessment
"""

import os
import sys
import time
import webbrowser
from threading import Timer

def print_banner():
    """Print startup banner"""
    print("=" * 60)
    print("🔍 AI-Based Fake News Detector")
    print("=" * 60)
    print("🚀 Starting server with enhanced creative analysis...")
    print("📊 Features: AI insights, risk assessment, recommendations")
    print("🔧 Fixed: Connection issues and improved error handling")
    print("=" * 60)

def open_browser():
    """Open browser after a delay"""
    time.sleep(2)
    try:
        webbrowser.open('http://localhost:5000')
        print("🌐 Browser opened automatically!")
    except:
        print("💡 Please open http://localhost:5000 in your browser")

def check_dependencies():
    """Check if required dependencies are available"""
    required_modules = ['flask', 'torch', 'transformers']
    missing = []
    
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print("📦 Install with: pip install " + " ".join(missing))
        return False
    
    print("✅ All dependencies available")
    return True

def main():
    """Main startup function"""
    print_banner()
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Set environment
    os.environ['FLASK_ENV'] = 'development'
    
    print("\n📍 Server will start at: http://localhost:5000")
    print("🔄 Loading AI models (this may take a moment)...")
    print("💡 Tip: The first analysis may be slower as models initialize")
    
    # Schedule browser opening
    Timer(3.0, open_browser).start()
    
    print("\n" + "=" * 60)
    print("🎯 READY! Server starting now...")
    print("=" * 60)
    
    # Import and run the app
    try:
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        print("💡 Try: python app.py")

if __name__ == "__main__":
    main() 