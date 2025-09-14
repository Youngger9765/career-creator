#!/usr/bin/env python3
"""
Database Seeding Script
資料庫種子資料腳本

Usage:
    python seed_db.py
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.seeds import run_all_seeds

if __name__ == "__main__":
    print("🚀 Initializing database with seed data...")
    run_all_seeds()
    print("✅ Database seeding completed!")