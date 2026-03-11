#!/bin/bash

# Pull changes for server directory only from prod branch.
# Uses the new Dockerized Zero-Downtime architecture.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 Fetching latest changes from prod..."
git fetch origin prod

echo "🔄 Updating server directory only..."
git checkout origin/prod -- server/

echo "📦 Installing root server dependencies (for Gateway & deploy script)..."
cd server
npm install

# We NO LONGER run npm install in v1/ or v2/. Docker handles that natively!

echo "🐳 Ensuring API Gateway and Docker Network are running..."
docker compose up -d

# Redis: required when REDIS_URL is set (scan broadcast, delegated Graph token)
if [ -f "v1/.env" ] && grep -q "REDIS_URL" v1/.env; then
  echo "🔴 Checking Redis..."
  if command -v redis-cli &>/dev/null; then
    if redis-cli ping 2>/dev/null | grep -q PONG; then
      echo "   ✅ Redis is running."
    else
      echo "   ⚠️  Redis not responding. Start it with: brew services start redis (or systemctl start redis)"
    fi
  else
    echo "   ⚠️  redis-cli not found. Ensure Redis is installed."
  fi
else
  echo "   ℹ️  REDIS_URL not set – Redis features will use file fallback."
fi

echo ""
echo "✅ Source code updated successfully!"
echo "🚀 To deploy the updated code without dropping user traffic, run:"
echo "   cd server"
echo "   node deploy.js <version>  (e.g., node deploy.js v2)"
