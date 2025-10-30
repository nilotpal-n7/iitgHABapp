# scripts/deploy_staging.sh

#!/bin/bash
set -euo pipefail

echo ">>> STARTING STAGING DEPLOYMENT..."

# --- STAGING SERVER CONFIG ---
# Assumes you have a different user/host/path for staging
# Or just different secrets (e.g., SSH_HOST_STAGING)
# For this example, I'll assume a different directory
HOST=${SSH_HOST}
USER=${SSH_USER}
WORKDIR="/home/techboard/CC/iitgHABapp_staging" # STAGING PATH
BRANCH="dev"
PM2_NAME="hab-backend-staging"

# --- RUN REMOTE COMMANDS ---
ssh -o StrictHostKeyChecking=no -v $USER@$HOST << EOF
  echo ">>> Connected to staging server"
  
  # 1. Navigate to working directory
  cd $WORKDIR
  echo ">>> In directory: \$(pwd)"
  
  # 2. Pull the correct branch
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
  echo ">>> Pulled latest code from $BRANCH"
  
  # 3. Go to server directory (if different)
  cd server
  
  # 4. Install dependencies
  # Load nvm
  export NVM_DIR="\$HOME/.config/nvm"
  [ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
  npm install
  echo ">>> Dependencies installed"
  
  # 5. Restart PM2
  pm2 stop $PM2_NAME || true
  pm2 delete $PM2_NAME || true
  pm2 start index.js --name $PM2_NAME
  echo ">>> PM2 process $PM2_NAME restarted"
  
  echo ">>> STAGING DEPLOYMENT SUCCESSFUL"
EOF