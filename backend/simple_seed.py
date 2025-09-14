#!/usr/bin/env python3
"""
Simple Database Seeding Script
簡化資料庫種子資料腳本
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User
from app.core.auth import get_password_hash, DEMO_ACCOUNTS

def seed_demo_users():
    """創建demo用戶"""
    with Session(engine) as session:
        for demo_data in DEMO_ACCOUNTS:
            # Check if user already exists
            existing = session.exec(
                select(User).where(User.email == demo_data["email"])
            ).first()
            
            if not existing:
                user = User(
                    email=demo_data["email"],
                    name=demo_data["name"],
                    hashed_password=get_password_hash(demo_data["password"]),
                    roles=demo_data["roles"],
                    is_active=True
                )
                session.add(user)
        
        session.commit()
        print("✅ Demo users seeded")

if __name__ == "__main__":
    print("🚀 Seeding demo users...")
    seed_demo_users()
    print("✅ Simple seeding completed!")