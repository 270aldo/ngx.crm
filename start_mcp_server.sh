#!/bin/bash

# NexusCRM MCP Server Startup Script
# Starts the MCP server for Claude Desktop integration
# Author: Claude AI Assistant
# Created for: NGX Team

echo "🚀 Starting NexusCRM MCP Server"
echo "🏢 NGX Team - Claude Desktop Integration"
echo "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "=" "="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "nexus_crm_mcp_server.py" ]; then
    print_error "nexus_crm_mcp_server.py not found in current directory"
    echo "Please run this script from the nexus-crm project directory"
    exit 1
fi

print_status "Found NexusCRM MCP server script"

# Check for .env file
if [ ! -f ".env" ]; then
    print_warning ".env file not found"
    print_info "Creating .env file from template..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your Supabase credentials before continuing"
        print_info "Required variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
        exit 1
    else
        print_error "No .env.example file found. Please create .env manually."
        exit 1
    fi
fi

print_status "Environment file found"

# Load environment variables
set -a # automatically export all variables
source .env
set +a

# Check required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_error "Missing required environment variables"
    print_info "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file"
    exit 1
fi

print_status "Environment variables configured"

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    print_error "Python $required_version or higher is required. Found: $python_version"
    exit 1
fi

print_status "Python version: $python_version"

# Check if dependencies are installed
print_info "Checking dependencies..."

dependencies=("fastmcp" "supabase" "pydantic" "python-dotenv")
missing_deps=()

for dep in "${dependencies[@]}"; do
    if ! python3 -c "import $dep" 2>/dev/null; then
        missing_deps+=("$dep")
    fi
done

if [ ${#missing_deps[@]} -ne 0 ]; then
    print_warning "Missing dependencies: ${missing_deps[*]}"
    print_info "Installing missing dependencies..."
    
    for dep in "${missing_deps[@]}"; do
        pip3 install "$dep"
        if [ $? -eq 0 ]; then
            print_status "Installed $dep"
        else
            print_error "Failed to install $dep"
            exit 1
        fi
    done
fi

print_status "All dependencies satisfied"

# Test Supabase connection
print_info "Testing Supabase connection..."
python3 -c "
import os
from supabase import create_client
try:
    supabase = create_client('$SUPABASE_URL', '$SUPABASE_SERVICE_ROLE_KEY')
    result = supabase.table('contacts').select('count', count='exact').limit(1).execute()
    print('✅ Supabase connection successful')
except Exception as e:
    print(f'❌ Supabase connection failed: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    print_error "Supabase connection test failed"
    exit 1
fi

print_status "Supabase connection verified"

# Check if server is already running
if pgrep -f "nexus_crm_mcp_server.py" > /dev/null; then
    print_warning "MCP server appears to be already running"
    print_info "Stopping existing instance..."
    pkill -f "nexus_crm_mcp_server.py"
    sleep 2
fi

# Create log directory
mkdir -p logs

# Start the MCP server
print_info "Starting NexusCRM MCP Server..."
echo "🔗 Server will be available for Claude Desktop connection"
echo "📊 MCP Tools: Contact management, Deals, Leads, Tasks, Analytics"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Start server with logging
python3 nexus_crm_mcp_server.py 2>&1 | tee logs/mcp_server_$(date +%Y%m%d_%H%M%S).log

# Handle server shutdown
print_info "NexusCRM MCP Server stopped"

# Check if server started successfully
if [ $? -eq 0 ]; then
    print_status "Server shut down cleanly"
else
    print_error "Server encountered an error"
    print_info "Check logs/mcp_server_*.log for details"
fi