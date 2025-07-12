#!/usr/bin/env python3
"""
NexusCRM MCP Integration Tester
Tests the MCP server functionality and Claude Desktop integration

Author: Claude AI Assistant
Created for: NGX Team
Version: 1.0.0
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

def test_environment_setup():
    """Test if environment variables are properly configured"""
    print("🔍 Testing Environment Setup...")
    
    # Check for required environment variables
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("💡 Please set these in your .env file or environment")
        return False
    
    print("✅ Environment variables configured")
    return True

def test_dependencies():
    """Test if all required dependencies are installed"""
    print("\n🔍 Testing Dependencies...")
    
    required_packages = [
        "fastmcp",
        "supabase", 
        "pydantic",
        "dotenv"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} imported successfully")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package} import failed")
    
    if missing_packages:
        print(f"\n💡 Install missing packages: pip install {' '.join(missing_packages)}")
        return False
    
    return True

def test_mcp_server():
    """Test the MCP server functionality"""
    print("\n🔍 Testing MCP Server...")
    
    try:
        # Try to import and initialize the server
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        # Load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        # Test server import
        from nexus_crm_mcp_server import mcp
        print("✅ MCP server imported successfully")
        
        # Test if tools are registered
        tools = mcp._tools if hasattr(mcp, '_tools') else {}
        resources = mcp._resources if hasattr(mcp, '_resources') else {}
        prompts = mcp._prompts if hasattr(mcp, '_prompts') else {}
        
        print(f"✅ Registered tools: {len(tools)}")
        print(f"✅ Registered resources: {len(resources)}")
        print(f"✅ Registered prompts: {len(prompts)}")
        
        # List available tools
        if tools:
            print("\n📋 Available Tools:")
            for tool_name in tools.keys():
                print(f"   • {tool_name}")
        
        if resources:
            print("\n📊 Available Resources:")
            for resource_name in resources.keys():
                print(f"   • {resource_name}")
        
        if prompts:
            print("\n🎯 Available Prompts:")
            for prompt_name in prompts.keys():
                print(f"   • {prompt_name}")
        
        return True
        
    except Exception as e:
        print(f"❌ MCP server test failed: {e}")
        return False

def test_supabase_connection():
    """Test connection to Supabase database"""
    print("\n🔍 Testing Supabase Connection...")
    
    try:
        from supabase import create_client
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Supabase credentials not found")
            return False
        
        # Create client
        supabase = create_client(supabase_url, supabase_key)
        
        # Test connection with a simple query
        result = supabase.table("contacts").select("count", count="exact").limit(1).execute()
        
        print("✅ Supabase connection successful")
        print(f"📊 Found {result.count if result.count is not None else 'unknown'} contacts in database")
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False

def test_claude_desktop_config():
    """Test Claude Desktop configuration file"""
    print("\n🔍 Testing Claude Desktop Configuration...")
    
    # Expected config file locations
    config_paths = [
        Path.home() / "Library/Application Support/Claude/claude_desktop_config.json",  # macOS
        Path.home() / "AppData/Roaming/Claude/claude_desktop_config.json",  # Windows
        "./claude_desktop_config.json"  # Local copy
    ]
    
    config_found = False
    config_path = None
    
    for path in config_paths:
        if path.exists():
            config_found = True
            config_path = path
            break
    
    if not config_found:
        print("❌ Claude Desktop config file not found")
        print("💡 Expected locations:")
        for path in config_paths:
            print(f"   • {path}")
        return False
    
    try:
        # Read and validate config
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        print(f"✅ Config file found: {config_path}")
        
        # Check for MCP servers section
        if "mcpServers" not in config:
            print("❌ No mcpServers section in config")
            return False
        
        # Check for nexus-crm server
        if "nexus-crm" not in config["mcpServers"]:
            print("❌ nexus-crm server not configured")
            return False
        
        server_config = config["mcpServers"]["nexus-crm"]
        
        # Validate server configuration
        required_fields = ["command", "args"]
        for field in required_fields:
            if field not in server_config:
                print(f"❌ Missing required field: {field}")
                return False
        
        print("✅ nexus-crm MCP server configured")
        print(f"   Command: {server_config['command']}")
        print(f"   Args: {' '.join(server_config['args'])}")
        
        # Check environment variables in config
        if "env" in server_config:
            env_vars = server_config["env"]
            if "SUPABASE_URL" in env_vars and "SUPABASE_SERVICE_ROLE_KEY" in env_vars:
                print("✅ Environment variables configured in Claude Desktop")
            else:
                print("⚠️ Environment variables not set in Claude Desktop config")
                print("💡 Make sure to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in config file: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading config file: {e}")
        return False

def generate_integration_report():
    """Generate a comprehensive integration report"""
    print("\n" + "=" * 60)
    print("📊 NEXUSCRM MCP INTEGRATION REPORT")
    print(f"📅 Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    tests = [
        ("Environment Setup", test_environment_setup),
        ("Dependencies", test_dependencies),
        ("MCP Server", test_mcp_server),
        ("Supabase Connection", test_supabase_connection),
        ("Claude Desktop Config", test_claude_desktop_config)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} Test...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"💥 Test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<25} {status}")
        if result:
            passed += 1
    
    print(f"\n📊 Overall Status: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! NexusCRM MCP integration is ready!")
        print("\n🚀 Next Steps:")
        print("1. Restart Claude Desktop")
        print("2. Look for MCP tools in Claude interface")
        print("3. Try commands like: 'Show me the pipeline status'")
        print("4. Test with: 'Create a contact for John from TechCorp'")
    elif passed >= total * 0.8:
        print("⚠️ Most tests passed. Minor issues to resolve.")
    else:
        print("❌ Multiple issues found. Please fix failures above.")
    
    return passed == total

def main():
    """Main test function"""
    print("🧪 NexusCRM MCP Integration Testing Suite")
    print("🏢 NGX Team - Claude Desktop Integration")
    print("📊 Comprehensive system verification")
    
    # Load environment variables if .env file exists
    if os.path.exists(".env"):
        from dotenv import load_dotenv
        load_dotenv()
        print("📁 Loaded environment variables from .env file")
    
    # Run comprehensive tests
    success = generate_integration_report()
    
    if success:
        print("\n🎯 Integration test completed successfully!")
        print("🔗 Ready for Claude Desktop connection!")
    else:
        print("\n⚠️ Integration test found issues.")
        print("🔧 Please resolve failures before using with Claude Desktop.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)