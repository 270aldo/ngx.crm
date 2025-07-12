#!/usr/bin/env python3
"""
Script to test backend server and APIs
"""
import asyncio
import requests
import time
import subprocess
import sys
from threading import Thread

def test_api_health():
    """Test if the API is responding"""
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is responding!")
            return True
        else:
            print(f"❌ API returned status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API connection failed: {e}")
        return False

def test_api_endpoints():
    """Test specific API endpoints"""
    base_url = "http://localhost:8000"
    
    # Test endpoints that don't require authentication
    test_endpoints = [
        "/docs",
        "/openapi.json",
        # Note: API endpoints require auth, so we'll just test they exist in docs
    ]
    
    print("\n🧪 Testing API endpoints...")
    for endpoint in test_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"✅ {endpoint} - OK")
            else:
                print(f"❌ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")

def check_openapi_spec():
    """Check OpenAPI specification includes our APIs"""
    try:
        response = requests.get("http://localhost:8000/openapi.json", timeout=5)
        if response.status_code == 200:
            spec = response.json()
            paths = spec.get("paths", {})
            
            print(f"\n📋 Found {len(paths)} API endpoints:")
            
            # Count endpoints by API
            api_counts = {}
            for path in paths.keys():
                if "/routes/api/v1/" in path:
                    api_name = path.split("/")[4]  # Extract API name
                    api_counts[api_name] = api_counts.get(api_name, 0) + 1
            
            for api, count in api_counts.items():
                print(f"   {api}: {count} endpoints")
                
            return len(paths) > 0
        else:
            print("❌ Could not fetch OpenAPI spec")
            return False
    except Exception as e:
        print(f"❌ Error checking OpenAPI spec: {e}")
        return False

def main():
    print("🚀 Testing NexusCRM Backend Server")
    print("=" * 40)
    
    # Test if server is running
    print("1. Testing server health...")
    if test_api_health():
        print("   ✅ Server is running!")
        
        # Test endpoints
        test_api_endpoints()
        
        # Check OpenAPI spec
        print("\n2. Checking API specification...")
        if check_openapi_spec():
            print("   ✅ API specification loaded successfully!")
        
        print("\n🎉 Backend tests completed!")
        print("\nTo use the APIs:")
        print("- API Docs: http://localhost:8000/docs")
        print("- OpenAPI: http://localhost:8000/openapi.json")
        print("- Redoc: http://localhost:8000/redoc")
        
    else:
        print("   ❌ Server is not running!")
        print("\nTo start the server:")
        print("   make run-backend")
        print("   or: uvicorn main:app --reload")
        
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())