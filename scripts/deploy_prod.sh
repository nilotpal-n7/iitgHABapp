# scripts/deploy_prod.sh

#!/bin/bash
set -euo pipefail

echo ">>> STARTING PRODUCTION DEPLOYMENT..."

# --- PRODUCTION SERVER CONFIG ---
HOST=${SSH_HOST}
USER=${SSH_USER}
WORKDIR="/home/techboard/CC/iitgHABapp" # PRODUCTION PATH
BRANCH="master"
PM2_NAME="hab-backend"

# --- RUN REMOTE COMMANDS ---
ssh -o StrictHostKeyChecking=no -v $USER@$HOST << EOF
  echo ">>> Connected to production server"
  
  # 1. Navigate to working directory
  cd $WORKDIR
  echo ">>> In directory: \$(pwd)"
  
  # 2. Pull the correct branch
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH
  echo ">>> Pulled latest code from $BRANCH"
  
  # 3. Go to server directory
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
  
  echo ">>> PRODUCTION DEPLOYMENT SUCCESSFUL"
EOF