#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Ensure the Docker Backend Gateway is running first!
echo "🐳 Checking Backend Gateway status..."
if ! docker ps | grep -q hab-gateway; then
  echo "⚠️  WARNING: The backend Gateway (hab-gateway) is not running!"
  echo "   Starting the Gateway now..."
  (cd server && docker compose up -d)
fi
echo "✅ Backend Gateway is active on Port 3000."
echo ""

echo "🚀 Starting all websites..."
echo ""

# Check if node_modules exist in each directory, if not, install dependencies
check_and_install() {
  local dir=$1
  local name=$2
  
  if [ ! -d "$dir/node_modules" ]; then
    echo "📦 Installing dependencies for $name..."
    (cd "$dir" && npm install)
    if [ $? -ne 0 ]; then
      echo "❌ Failed to install dependencies for $name"
      exit 1
    fi
    echo "✅ Dependencies installed for $name"
  fi
}

check_and_install "login-frontend" "Login Frontend"
check_and_install "hab-frontend" "HAB Frontend"
check_and_install "hostel-frontend" "Hostel Frontend"
check_and_install "smc-frontend" "SMC Frontend"

echo ""
echo "🔐 Login Frontend will run on: http://localhost:5172"
echo "📱 HAB Frontend will run on: http://localhost:5173"
echo "🏠 Hostel Frontend will run on: http://localhost:5174"
echo "👥 SMC Frontend will run on: http://localhost:5175"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "🛑 Stopping all frontend servers..."
  kill 0
  exit
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Start all four servers in parallel from their respective directories
(cd login-frontend && npm run dev) &
(cd hab-frontend && npm run dev) &
(cd hostel-frontend && npm run dev) &
(cd smc-frontend && npm run dev) &

# Wait for all background processes
wait
