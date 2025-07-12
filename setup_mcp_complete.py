#!/usr/bin/env python3
"""
NexusCRM MCP Complete Setup Script
Installs and configures everything needed for Claude Desktop integration

Author: Claude AI Assistant
Created for: NGX Team
Version: 1.0.0
"""

import os
import json
import shutil
import subprocess
import sys
from pathlib import Path

def print_header():
    """Print setup header"""
    print("🚀 NexusCRM MCP Complete Setup")
    print("🏢 NGX Team - Claude Desktop Integration")
    print("🔗 Model Context Protocol Configuration")
    print("=" * 60)

def install_dependencies():
    """Install all required Python packages"""
    print("\n📦 Installing Python Dependencies...")
    
    packages = [
        "fastmcp>=2.0.0",
        "supabase>=2.0.0", 
        "pydantic>=2.0.0",
        "python-dotenv>=1.0.0"
    ]
    
    for package in packages:
        print(f"Installing {package}...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", package], 
                         check=True, capture_output=True, text=True)
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e.stderr}")
            return False
    
    return True

def create_env_file():
    """Create .env file if it doesn't exist"""
    print("\n📁 Setting up Environment Variables...")
    
    if os.path.exists(".env"):
        print("✅ .env file already exists")
        return True
    
    env_content = """# NexusCRM MCP Server Environment Variables
# IMPORTANTE: Configura estas variables con tus credenciales reales de Supabase

# Supabase Configuration
SUPABASE_URL=https://yzhncjghjlpgwdnurdvm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=REEMPLAZAR_CON_TU_SERVICE_ROLE_KEY_REAL

# Server Configuration (Opcional)
MCP_SERVER_PORT=8000
DEBUG=true
"""
    
    try:
        with open(".env", "w") as f:
            f.write(env_content)
        print("✅ Created .env file")
        print("⚠️  IMPORTANTE: Edita .env con tu SUPABASE_SERVICE_ROLE_KEY real")
        return True
    except Exception as e:
        print(f"❌ Failed to create .env file: {e}")
        return False

def setup_claude_desktop_config():
    """Setup Claude Desktop configuration"""
    print("\n🔧 Configuring Claude Desktop...")
    
    # Determine Claude Desktop config path
    home = Path.home()
    if sys.platform == "darwin":  # macOS
        config_dir = home / "Library/Application Support/Claude"
    elif sys.platform == "win32":  # Windows
        config_dir = home / "AppData/Roaming/Claude"
    else:
        print("❌ Unsupported operating system")
        return False
    
    config_path = config_dir / "claude_desktop_config.json"
    
    # Create directory if it doesn't exist
    config_dir.mkdir(parents=True, exist_ok=True)
    
    # Current project path
    current_path = os.path.abspath(".")
    server_path = os.path.join(current_path, "nexus_crm_mcp_server.py")
    
    # Configuration JSON
    config = {
        "globalShortcut": "Cmd+Shift+Space" if sys.platform == "darwin" else "Ctrl+Shift+Space",
        "menuBarIcon": True,
        "mcpServers": {
            "nexus-crm": {
                "command": "python3",
                "args": [server_path],
                "env": {
                    "SUPABASE_URL": "https://yzhncjghjlpgwdnurdvm.supabase.co",
                    "SUPABASE_SERVICE_ROLE_KEY": "REEMPLAZAR_CON_TU_SERVICE_ROLE_KEY_REAL"
                }
            }
        }
    }
    
    try:
        # Backup existing config if it exists
        if config_path.exists():
            backup_path = config_path.with_suffix('.json.backup')
            shutil.copy2(config_path, backup_path)
            print(f"✅ Backed up existing config to {backup_path}")
        
        # Write new config
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"✅ Claude Desktop config created: {config_path}")
        print(f"🔧 Server path: {server_path}")
        print("⚠️  IMPORTANTE: Actualiza SUPABASE_SERVICE_ROLE_KEY en la configuración")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to create Claude Desktop config: {e}")
        return False

def create_helper_scripts():
    """Create helpful scripts for managing the MCP server"""
    print("\n📜 Creating Helper Scripts...")
    
    # Quick start script
    quick_start = """#!/bin/bash
# Quick start script for NexusCRM MCP integration

echo "🚀 NexusCRM MCP Quick Start"
echo "=========================="

# Check if Claude Desktop is running
if pgrep -f "Claude" > /dev/null; then
    echo "✅ Claude Desktop is running"
else
    echo "⚠️  Claude Desktop is not running. Please start it first."
fi

# Test MCP integration
echo "🧪 Testing MCP integration..."
python3 test_mcp_integration.py

echo ""
echo "💡 Usage Examples:"
echo "   'Claude, show me the pipeline status'"
echo "   'Create a contact for John Smith from TechCorp'"
echo "   'Generate a daily CRM report'"
echo ""
echo "🔗 Ready for Claude Desktop interaction!"
"""
    
    try:
        with open("quick_start.sh", "w") as f:
            f.write(quick_start)
        os.chmod("quick_start.sh", 0o755)
        print("✅ Created quick_start.sh")
    except Exception as e:
        print(f"❌ Failed to create quick_start.sh: {e}")

def test_setup():
    """Test the complete setup"""
    print("\n🧪 Testing Setup...")
    
    try:
        # Test imports
        import fastmcp
        import supabase
        import pydantic
        print("✅ All Python packages imported successfully")
        
        # Test server import
        if os.path.exists("nexus_crm_mcp_server.py"):
            print("✅ MCP server file exists")
        else:
            print("❌ MCP server file not found")
            return False
        
        # Test environment file
        if os.path.exists(".env"):
            print("✅ Environment file exists")
        else:
            print("❌ Environment file not found")
            return False
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def print_final_instructions():
    """Print final setup instructions"""
    print("\n" + "=" * 60)
    print("🎉 SETUP COMPLETO - INSTRUCCIONES FINALES")
    print("=" * 60)
    
    print("\n📋 CHECKLIST DE CONFIGURACIÓN:")
    print("1. ✅ Dependencias Python instaladas")
    print("2. ✅ Archivo .env creado")
    print("3. ✅ Configuración Claude Desktop lista")
    print("4. ✅ Scripts de ayuda creados")
    
    print("\n🔧 PASOS FINALES REQUERIDOS:")
    print("1. 📝 Editar .env con tu SUPABASE_SERVICE_ROLE_KEY real")
    print("2. 🔄 Reiniciar Claude Desktop completamente")
    print("3. 🧪 Ejecutar: python3 test_mcp_integration.py")
    print("4. 🚀 Ejecutar: ./quick_start.sh")
    
    print("\n💬 COMANDOS DE EJEMPLO EN CLAUDE:")
    print("   • 'Claude, muéstrame el estado del pipeline'")
    print("   • 'Crea un contacto para María García de StartupX'")
    print("   • 'Dame un resumen de analytics del CRM'")
    print("   • 'Convierte el lead de TechCorp a contacto'")
    
    print("\n🎯 HERRAMIENTAS DISPONIBLES:")
    print("   📊 10+ tools para gestión completa del CRM")
    print("   📈 4 resources para datos en tiempo real")
    print("   🤖 4 prompts para automatización avanzada")
    
    print("\n📞 SOPORTE:")
    print("   📚 README_MCP_INTEGRATION.md - Guía completa")
    print("   🧪 test_mcp_integration.py - Diagnóstico")
    print("   📂 logs/ - Archivos de logs del servidor")
    
    print("\n🚀 ¡EL FUTURO DEL CRM ESTÁ AQUÍ!")
    print("🔗 Claude Desktop + NexusCRM = Productividad 10x")

def main():
    """Main setup function"""
    print_header()
    
    # Step-by-step setup
    steps = [
        ("Installing Dependencies", install_dependencies),
        ("Creating Environment File", create_env_file),
        ("Configuring Claude Desktop", setup_claude_desktop_config),
        ("Creating Helper Scripts", create_helper_scripts),
        ("Testing Setup", test_setup)
    ]
    
    completed_steps = 0
    
    for step_name, step_func in steps:
        print(f"\n🔄 {step_name}...")
        try:
            success = step_func()
            if success:
                completed_steps += 1
                print(f"✅ {step_name} completed")
            else:
                print(f"❌ {step_name} failed")
                break
        except Exception as e:
            print(f"💥 {step_name} crashed: {e}")
            break
    
    # Final results
    if completed_steps == len(steps):
        print_final_instructions()
        return True
    else:
        print(f"\n❌ Setup incomplete: {completed_steps}/{len(steps)} steps completed")
        print("🔧 Please resolve the errors above and run setup again")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)