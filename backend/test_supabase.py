#!/usr/bin/env python3
"""
Test Supabase connection specifically
使用 .env.staging 配置測試 Supabase
"""

import os
import sys
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session, text

def test_supabase_connection():
    """Test connection to Supabase"""
    
    # Load staging environment (Supabase)
    load_dotenv('.env.staging')
    
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found in .env.staging")
        return False
    
    print("🚀 Supabase Connection Test")
    print("=" * 50)
    print(f"🔗 Testing connection to Supabase...")
    print(f"🌐 Environment: {os.getenv('ENVIRONMENT')}")
    print(f"🔗 Supabase URL: {os.getenv('SUPABASE_URL')}")
    
    try:
        # Create engine (without echo to avoid verbose output)
        engine = create_engine(database_url, echo=False)
        
        # Test connection
        with Session(engine) as session:
            # Simple query to test connection
            result = session.exec(text("SELECT version()")).first()
            print(f"✅ Connection successful!")
            print(f"📊 PostgreSQL version: {result}")
            
            # Test if we can create tables (metadata check)
            SQLModel.metadata.create_all(engine)
            print("✅ Can create tables (metadata check passed)")
            
            # Test Supabase specific query
            result = session.exec(text("SELECT current_database()")).first()
            print(f"🗄️  Current database: {result}")
            
            # Test schema permissions
            result = session.exec(text("SELECT current_user")).first()
            print(f"👤 Current user: {result}")
            
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        print("\n🔍 Troubleshooting:")
        print("1. Check if Supabase project is active")
        print("2. Verify database password is correct")
        print("3. Ensure connection string format is correct")
        print("4. Check if IP is whitelisted (if applicable)")
        return False

def show_connection_info():
    """Show connection configuration"""
    load_dotenv('.env.staging')
    
    database_url = os.getenv("DATABASE_URL", "")
    if database_url:
        # Mask password for security
        masked_url = database_url
        if "@" in masked_url:
            parts = masked_url.split(":")
            if len(parts) >= 3:
                # Replace password with ****
                parts[2] = parts[2].split("@")[0][:4] + "****@" + parts[2].split("@")[1]
                masked_url = ":".join(parts)
        
        print(f"\n📋 Connection Configuration:")
        print(f"   URL: {masked_url}")
        print(f"   Supabase Project: {os.getenv('SUPABASE_URL')}")
        print(f"   Environment: {os.getenv('ENVIRONMENT')}")

if __name__ == "__main__":
    print("🧪 Supabase Database Connection Test")
    print("=" * 50)
    
    show_connection_info()
    
    if test_supabase_connection():
        print("\n🎉 Supabase connection test successful!")
        print("✨ You can now use Supabase for staging environment")
    else:
        print("\n💡 Supabase connection failed")
        print("📝 Please check your .env.staging configuration")
        sys.exit(1)