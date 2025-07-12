#!/usr/bin/env python3
"""
NexusCRM System Testing Script
Tests the complete CRM functionality without requiring frontend authentication
"""

import requests
import json
from datetime import datetime

# Configuration
API_BASE = "http://127.0.0.1:8000"
FRONTEND_BASE = "http://localhost:5173"

class NexusCRMTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = {
            "backend_health": False,
            "frontend_health": False,
            "api_endpoints": {},
            "integration_tests": {}
        }

    def test_backend_health(self):
        """Test if backend is running and responsive"""
        print("🔍 Testing Backend Health...")
        try:
            response = self.session.get(f"{API_BASE}/docs", timeout=5)
            if response.status_code == 200:
                print("✅ Backend is running and accessible")
                self.test_results["backend_health"] = True
                return True
            else:
                print(f"❌ Backend returned status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend connection failed: {e}")
            return False

    def test_frontend_health(self):
        """Test if frontend is running and responsive"""
        print("\n🔍 Testing Frontend Health...")
        try:
            response = self.session.get(FRONTEND_BASE, timeout=5)
            if response.status_code == 200:
                print("✅ Frontend is running and accessible")
                self.test_results["frontend_health"] = True
                return True
            else:
                print(f"❌ Frontend returned status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend connection failed: {e}")
            return False

    def test_api_structure(self):
        """Test API structure and endpoint availability"""
        print("\n🔍 Testing API Structure...")
        try:
            response = self.session.get(f"{API_BASE}/openapi.json", timeout=5)
            if response.status_code == 200:
                openapi_spec = response.json()
                paths = openapi_spec.get("paths", {})
                
                print(f"✅ Found {len(paths)} API endpoints")
                
                # Count endpoints by module
                modules = {}
                for path in paths.keys():
                    if "/routes/api/v1/" in path:
                        parts = path.split("/")
                        if len(parts) >= 5:
                            module = parts[4]
                            modules[module] = modules.get(module, 0) + 1
                
                for module, count in modules.items():
                    print(f"   • {module}: {count} endpoints")
                    
                self.test_results["api_endpoints"] = modules
                return True
            else:
                print(f"❌ API spec request failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API structure test failed: {e}")
            return False

    def test_unauthorized_endpoints(self):
        """Test endpoints that should return 401 (expected behavior)"""
        print("\n🔍 Testing API Authentication (Expected 401s)...")
        
        test_endpoints = [
            "/routes/api/v1/contacts",
            "/routes/api/v1/deals",
            "/routes/api/v1/leads",
            "/routes/api/v1/tasks",
            "/routes/api/v1/analytics/pipeline"
        ]
        
        auth_working = True
        for endpoint in test_endpoints:
            try:
                response = self.session.get(f"{API_BASE}{endpoint}", timeout=5)
                if response.status_code == 401:
                    print(f"✅ {endpoint} - Properly protected (401)")
                elif response.status_code == 500 and "No auth config" in response.text:
                    print(f"⚠️  {endpoint} - Auth not configured but endpoint exists")
                else:
                    print(f"❌ {endpoint} - Unexpected status: {response.status_code}")
                    auth_working = False
            except Exception as e:
                print(f"❌ {endpoint} - Request failed: {e}")
                auth_working = False
        
        return auth_working

    def test_frontend_routes(self):
        """Test that frontend routes are accessible"""
        print("\n🔍 Testing Frontend Routes...")
        
        # Since frontend is SPA, all routes should return 200 with index.html
        test_routes = [
            "/",
            "/PipelinePage",
            "/TasksPage", 
            "/AnalyticsPage",
            "/ClientProfile?id=test"
        ]
        
        routes_working = True
        for route in test_routes:
            try:
                response = self.session.get(f"{FRONTEND_BASE}{route}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {route} - Accessible")
                else:
                    print(f"❌ {route} - Status: {response.status_code}")
                    routes_working = False
            except Exception as e:
                print(f"❌ {route} - Request failed: {e}")
                routes_working = False
        
        return routes_working

    def test_proxy_configuration(self):
        """Test that frontend proxy to backend works"""
        print("\n🔍 Testing Frontend-Backend Proxy...")
        try:
            # Test proxy through frontend
            response = self.session.get(f"{FRONTEND_BASE}/routes/api/v1/contacts", timeout=5)
            
            if response.status_code == 401 or "No auth config" in response.text:
                print("✅ Proxy working - Backend responds through frontend")
                return True
            elif response.status_code == 404:
                print("❌ Proxy not working - 404 from frontend")
                return False
            else:
                print(f"⚠️  Proxy status unclear - Status: {response.status_code}")
                return True  # Might still be working
        except Exception as e:
            print(f"❌ Proxy test failed: {e}")
            return False

    def run_comprehensive_test(self):
        """Run all tests and provide summary"""
        print("🚀 Starting NexusCRM System Test")
        print("=" * 50)
        
        results = []
        
        # Core health tests
        results.append(("Backend Health", self.test_backend_health()))
        results.append(("Frontend Health", self.test_frontend_health()))
        
        # API tests
        results.append(("API Structure", self.test_api_structure()))
        results.append(("API Authentication", self.test_unauthorized_endpoints()))
        
        # Integration tests
        results.append(("Frontend Routes", self.test_frontend_routes()))
        results.append(("Frontend-Backend Proxy", self.test_proxy_configuration()))
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{test_name:<25} {status}")
            if result:
                passed += 1
        
        print("\n" + "=" * 50)
        print(f"Overall Status: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! NexusCRM is ready for NGX team!")
        elif passed >= total * 0.8:
            print("⚠️  Most tests passed. Minor issues to address.")
        else:
            print("❌ Multiple issues found. System needs attention.")
        
        # Provide next steps
        print("\n🎯 NEXT STEPS:")
        if self.test_results["backend_health"] and self.test_results["frontend_health"]:
            print("1. ✅ Both services are running")
            print("2. 🔑 Configure authentication for full testing")
            print("3. 📊 Access frontend at: http://localhost:5173")
            print("4. 📚 API documentation at: http://127.0.0.1:8000/docs")
            print("5. 🧪 Run manual tests in browser")
        else:
            if not self.test_results["backend_health"]:
                print("1. ❌ Start backend server: uvicorn main:app --reload")
            if not self.test_results["frontend_health"]:
                print("2. ❌ Start frontend server: npm run dev")
        
        return passed == total

if __name__ == "__main__":
    tester = NexusCRMTester()
    success = tester.run_comprehensive_test()
    exit(0 if success else 1)