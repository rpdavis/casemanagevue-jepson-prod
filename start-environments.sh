#!/bin/bash

# CaseManageVue Environment Starter Script
# This script helps you start both development and production environments

echo "🚀 CaseManageVue Environment Starter"
echo "====================================="

# Function to start development environment
start_dev() {
    echo "🔧 Starting Development Environment..."
    echo "   - Firebase Project: casemanagevue-dev"
    echo "   - Environment: development"
    echo "   - Features: Debug menu, console logs, emulators"
    echo ""
    
    # Switch to development project
    firebase use development
    
    # Start development server
    npm run dev
}

# Function to start production environment
start_prod() {
    echo "🏭 Starting Production Environment..."
    echo "   - Firebase Project: casemangervue"
    echo "   - Environment: production"
    echo "   - Features: Optimized build, no debug features"
    echo ""
    
    # Switch to production project
    firebase use production
    
    # Build and serve production
    npm run build && npm run preview
}

# Function to show environment status
show_status() {
    echo "📊 Environment Status"
    echo "===================="
    echo ""
    
    echo "🔍 Current Firebase Project:"
    firebase use
    echo ""
    
    echo "🌐 Active Servers:"
    echo "   Check the following ports:"
    echo "   - Development: http://localhost:5173-5179"
    echo "   - Production:  http://localhost:4173"
    echo ""
    
    echo "📁 Environment Files:"
    if [ -f ".env.development" ]; then
        echo "   ✅ .env.development exists"
    else
        echo "   ❌ .env.development missing"
    fi
    
    if [ -f ".env.production" ]; then
        echo "   ✅ .env.production exists"
    else
        echo "   ❌ .env.production missing"
    fi
    
    if [ -f ".env.local" ]; then
        echo "   ✅ .env.local exists"
    else
        echo "   ❌ .env.local missing"
    fi
}

# Function to clean up running servers
cleanup() {
    echo "🧹 Cleaning up running servers..."
    pkill -f "vite"
    pkill -f "firebase"
    echo "   All servers stopped."
}

# Main menu
case "$1" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {dev|prod|status|cleanup}"
        echo ""
        echo "Commands:"
        echo "  dev     - Start development environment"
        echo "  prod    - Start production environment"
        echo "  status  - Show environment status"
        echo "  cleanup - Stop all running servers"
        echo ""
        echo "Examples:"
        echo "  ./start-environments.sh dev"
        echo "  ./start-environments.sh prod"
        echo "  ./start-environments.sh status"
        echo "  ./start-environments.sh cleanup"
        exit 1
        ;;
esac 