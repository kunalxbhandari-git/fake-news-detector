#!/usr/bin/env python3
"""
Setup script for AI-Based Fake News Detector
"""

import os
import sys
import subprocess
import platform

def run_command(command):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def install_requirements():
    """Install requirements with fallback options"""
    print("🔧 Installing dependencies for Fake News Detector...")
    
    # Try different installation approaches
    installation_commands = [
        "pip install -r requirements.txt",
        "pip install -r requirements-simple.txt",
        "pip3 install -r requirements-simple.txt",
        "python -m pip install -r requirements-simple.txt",
        "python3 -m pip install -r requirements-simple.txt"
    ]
    
    for cmd in installation_commands:
        print(f"Trying: {cmd}")
        success, stdout, stderr = run_command(cmd)
        
        if success:
            print("✅ Dependencies installed successfully!")
            return True
        else:
            print(f"❌ Failed: {stderr}")
    
    # If all fail, try installing core packages individually
    print("📦 Trying to install core packages individually...")
    core_packages = [
        "flask",
        "pymongo",
        "torch",
        "transformers",
        "numpy",
        "pandas",
        "scikit-learn",
        "nltk",
        "requests",
        "python-dotenv"
    ]
    
    failed_packages = []
    for package in core_packages:
        print(f"Installing {package}...")
        success, _, stderr = run_command(f"pip install {package}")
        if not success:
            failed_packages.append(package)
            print(f"❌ Failed to install {package}: {stderr}")
        else:
            print(f"✅ {package} installed")
    
    if failed_packages:
        print(f"\n⚠️  Some packages failed to install: {', '.join(failed_packages)}")
        print("You may need to install them manually or use conda:")
        for pkg in failed_packages:
            print(f"  conda install {pkg}")
        return False
    
    return True

def setup_nltk_data():
    """Download required NLTK data"""
    print("📚 Setting up NLTK data...")
    try:
        import nltk
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        print("✅ NLTK data downloaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to setup NLTK data: {e}")
        return False

def create_directories():
    """Create necessary directories"""
    print("📁 Creating necessary directories...")
    directories = [
        "logs",
        "data",
        "models",
        "static/uploads"
    ]
    
    for directory in directories:
        try:
            os.makedirs(directory, exist_ok=True)
            print(f"✅ Created directory: {directory}")
        except Exception as e:
            print(f"❌ Failed to create directory {directory}: {e}")

def check_system():
    """Check system requirements"""
    print("🔍 Checking system requirements...")
    print(f"Python version: {sys.version}")
    print(f"Platform: {platform.platform()}")
    print(f"Architecture: {platform.architecture()}")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("⚠️  Warning: Python 3.8+ is recommended")
    else:
        print("✅ Python version is compatible")

def main():
    """Main setup function"""
    print("🚀 Setting up AI-Based Fake News Detector...")
    print("=" * 50)
    
    # Check system
    check_system()
    print()
    
    # Create directories
    create_directories()
    print()
    
    # Install requirements
    if not install_requirements():
        print("\n❌ Setup failed during dependency installation")
        print("Please try installing dependencies manually:")
        print("  pip install flask pymongo torch transformers numpy pandas scikit-learn nltk requests python-dotenv")
        return False
    
    print()
    
    # Setup NLTK data
    setup_nltk_data()
    print()
    
    print("✅ Setup completed successfully!")
    print("\nNext steps:")
    print("1. Set up MongoDB (local or cloud)")
    print("2. Update .env file with your configuration")
    print("3. Run the application: python run.py")
    print("\nFor more information, check the README or documentation.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 