#!/usr/bin/env python3
"""
驗證 Supabase 中的資料表是否正確建立
"""

import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session, text

def verify_tables():
    """驗證 Supabase 中的資料表"""
    
    load_dotenv()  # 使用當前的 .env (已切換到 staging)
    
    database_url = os.getenv("DATABASE_URL")
    engine = create_engine(database_url, echo=False)
    
    print("🔍 Verifying Supabase Tables")
    print("=" * 40)
    
    with Session(engine) as session:
        # 檢查所有資料表
        result = session.exec(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)).fetchall()
        
        print("📋 Tables in Supabase:")
        expected_tables = ['users', 'rooms', 'visitors', 'card_events']
        found_tables = [row[0] for row in result]
        
        for table in expected_tables:
            if table in found_tables:
                print(f"   ✅ {table}")
            else:
                print(f"   ❌ {table} (missing)")
        
        # 檢查額外的表
        extra_tables = [t for t in found_tables if t not in expected_tables]
        if extra_tables:
            print(f"\n📋 Additional tables:")
            for table in extra_tables:
                print(f"   ℹ️  {table}")
        
        # 檢查 users 表結構
        if 'users' in found_tables:
            print(f"\n🔍 Users table structure:")
            result = session.exec(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public'
                ORDER BY ordinal_position
            """)).fetchall()
            
            for row in result:
                nullable = "NULL" if row[2] == "YES" else "NOT NULL"
                print(f"   📋 {row[0]}: {row[1]} ({nullable})")
        
        # 檢查 alembic version
        try:
            result = session.exec(text("SELECT version_num FROM alembic_version")).first()
            print(f"\n🔄 Alembic version: {result}")
        except:
            print(f"\n⚠️  Alembic version table not found")

if __name__ == "__main__":
    verify_tables()