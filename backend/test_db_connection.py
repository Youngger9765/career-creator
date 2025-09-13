#!/usr/bin/env python3
"""
Test database connection to Supabase
Run this script to verify your DATABASE_URL is working
"""

import os
import sys
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session, text

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test connection to database"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        print("Please create a .env file with your Supabase credentials")
        return False
    
    print(f"🔗 Testing connection to: {database_url[:30]}...")
    
    try:
        # Create engine
        engine = create_engine(database_url, echo=True)
        
        # Test connection
        with Session(engine) as session:
            # Simple query to test connection
            result = session.exec(text("SELECT version()")).first()
            print(f"✅ Connection successful!")
            print(f"📊 PostgreSQL version: {result}")
            
            # Test if we can create tables
            SQLModel.metadata.create_all(engine)
            print("✅ Can create tables (metadata check passed)")
            
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("Please check your DATABASE_URL and Supabase credentials")
        return False

def show_setup_instructions():
    """Show setup instructions for Supabase"""
    print("\n📝 Supabase Setup Instructions:")
    print("1. Go to https://supabase.com")
    print("2. Create a free account and new project")
    print("3. Go to Settings > Database")
    print("4. Copy the connection string")
    print("5. Create backend/.env file with:")
    print('   DATABASE_URL="postgresql://postgres:[password]@db.[project_id].supabase.co:5432/postgres"')
    print("6. Replace [password] and [project_id] with your actual values")
    print("7. Run this script again: python test_db_connection.py")

if __name__ == "__main__":
    print("🚀 Database Connection Test")
    print("=" * 40)
    
    if test_database_connection():
        print("\n🎉 Database setup complete!")
        print("You can now run: alembic revision --autogenerate -m 'Initial schema'")
    else:
        show_setup_instructions()