#!/usr/bin/env python3
"""
Setup script for NexusCRM database
This script initializes the database schema and loads sample data
"""

import os
import sys
from supabase import create_client, Client

def get_supabase_client():
    """Get Supabase client from environment variables"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        print("Please create a .env file in the backend directory with:")
        print("SUPABASE_URL=your_supabase_url")
        print("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
        sys.exit(1)
    
    return create_client(url, key)

def load_sql_file(filepath):
    """Load SQL file content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"❌ SQL file not found: {filepath}")
        return None

def execute_sql(supabase: Client, sql_content: str, description: str):
    """Execute SQL content"""
    print(f"🔄 {description}...")
    try:
        # Split SQL by semicolons and execute each statement
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        
        for statement in statements:
            if statement:
                supabase.postgrest.rpc('execute_sql', {'sql': statement}).execute()
        
        print(f"✅ {description} completed successfully")
        return True
    except Exception as e:
        print(f"❌ {description} failed: {e}")
        return False

def setup_database():
    """Main database setup function"""
    print("🚀 Setting up NexusCRM Database")
    print("=" * 50)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    
    # Get Supabase client
    supabase = get_supabase_client()
    
    # Load and execute schema
    schema_sql = load_sql_file('database/schema.sql')
    if schema_sql:
        if not execute_sql(supabase, schema_sql, "Creating database schema"):
            return False
    
    # Load and execute sample data
    sample_data_sql = load_sql_file('database/sample_data.sql')
    if sample_data_sql:
        if not execute_sql(supabase, sample_data_sql, "Loading sample data"):
            return False
    
    print("\n" + "=" * 50)
    print("🎉 Database setup completed successfully!")
    print("\n📊 Sample data includes:")
    print("   • 3 NGX team members")
    print("   • 5 sample contacts (TechCorp, Innovate Solutions, etc.)")
    print("   • 5 qualified leads")
    print("   • 5 deals in various pipeline stages")
    print("   • 5 tasks for follow-ups")
    print("   • Interaction history and notes")
    
    print("\n🎯 Next steps:")
    print("   1. Access the CRM at: http://localhost:5173")
    print("   2. Test login with Supabase auth")
    print("   3. Explore contacts, deals, and pipeline")
    print("   4. Create new contacts and test CRUD operations")
    
    return True

if __name__ == "__main__":
    success = setup_database()
    sys.exit(0 if success else 1)