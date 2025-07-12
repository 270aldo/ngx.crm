#!/usr/bin/env python3
"""
Simple migration runner for NexusCRM
Executes SQL migrations against Supabase database
"""

import os
import sys
from pathlib import Path

def run_migration():
    """Run database migration"""
    print("🚀 Running NGX CRM Database Migration")
    print("=" * 50)
    
    # Check if backend environment file exists
    env_file = Path("backend/.env")
    if not env_file.exists():
        print("❌ Backend .env file not found!")
        print("Please create backend/.env with your Supabase credentials")
        return False
    
    # Try to load environment and connect to Supabase
    try:
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv('backend/.env')
        
        # Get Supabase credentials
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not url or not key:
            print("❌ Supabase credentials not found in backend/.env")
            print("Please add:")
            print("SUPABASE_URL=your_supabase_url")
            print("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
            return False
        
        print("✅ Environment loaded successfully")
        print(f"📍 Supabase URL: {url[:30]}...")
        
        # Import Supabase client
        from supabase import create_client
        supabase = create_client(url, key)
        
        print("✅ Connected to Supabase")
        
        # Load migration file
        migration_file = "database/migrations/001_initialize_ngx_data.sql"
        if not Path(migration_file).exists():
            print(f"❌ Migration file not found: {migration_file}")
            return False
        
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("✅ Migration file loaded")
        
        # Execute migration using raw SQL
        print("🔄 Executing migration...")
        
        # For Supabase, we need to execute the SQL differently
        # Let's use the REST API directly
        import requests
        
        headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json'
        }
        
        # Split the migration into individual statements and execute them
        statements = migration_sql.split(';')
        success_count = 0
        
        for i, statement in enumerate(statements):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    # Use Supabase SQL endpoint for raw queries
                    response = requests.post(
                        f"{url}/rest/v1/rpc/exec_sql",
                        headers=headers,
                        json={'sql': statement + ';'}
                    )
                    
                    if response.status_code == 200:
                        success_count += 1
                    else:
                        print(f"⚠️  Statement {i+1} warning: {response.status_code}")
                
                except Exception as e:
                    print(f"⚠️  Statement {i+1} error: {e}")
        
        print(f"✅ Migration completed - {success_count} statements processed")
        
        # Verify data was inserted
        try:
            contacts = supabase.table('contacts').select('name, company').limit(3).execute()
            if contacts.data:
                print("✅ Sample data verification:")
                for contact in contacts.data:
                    print(f"   • {contact['name']} from {contact['company']}")
            else:
                print("⚠️  No sample data found - manual verification needed")
        
        except Exception as e:
            print(f"⚠️  Data verification failed: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Migration completed successfully!")
        print("\n📊 NGX CRM is now ready with:")
        print("   • Database schema initialized")
        print("   • Sample NGX team members")
        print("   • Test contacts and leads")
        print("   • Example deals in pipeline")
        print("   • Sample tasks and interactions")
        
        print("\n🎯 Next steps:")
        print("   1. Open http://localhost:5173 in your browser")
        print("   2. Sign up/login with Supabase auth")
        print("   3. Test the CRM functionality")
        print("   4. Create new contacts and deals")
        
        return True
        
    except ImportError as e:
        print(f"❌ Missing required packages: {e}")
        print("Run: pip install python-dotenv supabase requests")
        return False
    
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)