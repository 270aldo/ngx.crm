#!/usr/bin/env python3
"""
NexusCRM MCP Dependencies Installer
Installs all required packages for the MCP server integration

Author: Claude AI Assistant
Created for: NGX Team
Version: 1.0.0
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return False

def install_dependencies():
    """Install all required dependencies for NexusCRM MCP server"""
    
    print("🚀 Installing NexusCRM MCP Dependencies")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        return False
    
    print(f"✅ Python version: {sys.version}")
    
    # List of required packages
    packages = [
        "fastmcp>=2.0.0",  # FastMCP framework
        "supabase>=2.0.0",  # Supabase client
        "pydantic>=2.0.0",  # Data validation
        "python-dotenv>=1.0.0",  # Environment variables
        "asyncio",  # Async support
        "uvicorn",  # ASGI server (if needed)
    ]
    
    # Install each package
    success_count = 0
    for package in packages:
        if run_command(f"pip install {package}", f"Installing {package}"):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Installation Summary: {success_count}/{len(packages)} packages installed")
    
    if success_count == len(packages):
        print("🎉 All dependencies installed successfully!")
        print("\n🔧 Next Steps:")
        print("1. Configure environment variables (.env files)")
        print("2. Update Claude Desktop configuration")
        print("3. Start the MCP server")
        return True
    else:
        print("⚠️ Some packages failed to install. Please check errors above.")
        return False

def verify_installation():
    """Verify that all packages are properly installed"""
    print("\n🔍 Verifying installation...")
    
    try:
        import fastmcp
        print("✅ FastMCP imported successfully")
    except ImportError:
        print("❌ FastMCP import failed")
        return False
    
    try:
        import supabase
        print("✅ Supabase imported successfully")
    except ImportError:
        print("❌ Supabase import failed")
        return False
    
    try:
        import pydantic
        print("✅ Pydantic imported successfully")
    except ImportError:
        print("❌ Pydantic import failed")
        return False
    
    print("🎯 All packages verified successfully!")
    return True

def create_env_example():
    """Create .env.example file for MCP server"""
    env_content = """# NexusCRM MCP Server Environment Variables
# Copy this file to .env and fill in your actual credentials

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: Server Configuration
MCP_SERVER_PORT=8000
MCP_SERVER_HOST=localhost
DEBUG=true
"""
    
    try:
        with open(".env.example", "w") as f:
            f.write(env_content)
        print("✅ Created .env.example file")
        print("📝 Please copy .env.example to .env and configure your credentials")
    except Exception as e:
        print(f"❌ Failed to create .env.example: {e}")

def main():
    """Main installation function"""
    print("🔧 NexusCRM MCP Server Installation")
    print("🏢 For NGX Team - Claude Desktop Integration")
    print("=" * 60)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Installation failed. Please resolve errors and try again.")
        sys.exit(1)
    
    # Verify installation
    if not verify_installation():
        print("❌ Verification failed. Please check package installations.")
        sys.exit(1)
    
    # Create environment file template
    create_env_example()
    
    print("\n" + "=" * 60)
    print("🎉 NexusCRM MCP Server Installation Complete!")
    print("\n📋 Configuration Checklist:")
    print("1. ✅ Dependencies installed")
    print("2. ⏳ Configure .env file with Supabase credentials")
    print("3. ⏳ Update Claude Desktop configuration")
    print("4. ⏳ Test MCP server connection")
    
    print("\n🚀 Ready to integrate with Claude Desktop!")
    print("📚 See README_NGX_DEPLOYMENT.md for next steps")

if __name__ == "__main__":
    main()