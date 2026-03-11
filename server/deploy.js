// server/deploy.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetVersion = process.argv[2]; 

if (!targetVersion) {
  console.error("❌ Please specify a version. Example: node deploy.js v3");
  process.exit(1);
}

const DOCKER_NETWORK = 'iitg_network';
const IMAGE_NAME = `hab-api-${targetVersion}`;
const CONTAINER_NAME = `api-${targetVersion}`;
const ROUTES_PATH = path.join(__dirname, 'routes.json');
const ENV_PATH = path.join(__dirname, targetVersion, '.env');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runDeploy() {
  console.log(`\n🚀 [START] Deploying ${targetVersion}...\n`);

  try {
    const routes = fs.existsSync(ROUTES_PATH) ? JSON.parse(fs.readFileSync(ROUTES_PATH, 'utf-8')) : {};
    const previousDefaultUrl = routes['default'];
    let previousVersion = null;

    // Find which version was the previous default to hand off schedulers
    for (const [key, val] of Object.entries(routes)) {
      if (key !== 'default' && val === previousDefaultUrl) previousVersion = key;
    }

    // 1. Build Image
    console.log(`📦 Building image for ${targetVersion}...`);
    execSync(`docker build -t ${IMAGE_NAME} ./${targetVersion}`, { stdio: 'inherit' });

    // 2. Run Container (with Log Rotation & Restart Policies)
    let envFlag = fs.existsSync(ENV_PATH) ? `--env-file ./${targetVersion}/.env` : '';
    
    console.log(`\n🔄 Starting container ${CONTAINER_NAME}...`);
    try { execSync(`docker rm -f ${CONTAINER_NAME} 2>nul || true`); } catch (e) {}
    const runCmd = `docker run -d --name ${CONTAINER_NAME} --network ${DOCKER_NETWORK} --restart unless-stopped --log-opt max-size=10m --log-opt max-file=3 ${envFlag} -e PORT=3000 -e IS_ACTIVE_SCHEDULER_NODE=true ${IMAGE_NAME}`;
    execSync(runCmd, { stdio: 'inherit' });

    // 3. Active Health Polling
    console.log(`\n🏥 Checking health of ${CONTAINER_NAME}...`);
    let isHealthy = false;
    // Note: We use the Docker network name to ping it directly from the host if exposed, 
    // but since we are running the script on the host, we query Docker exec directly.
    for (let i = 0; i < 15; i++) {
      try {
        const check = execSync(`docker exec ${CONTAINER_NAME} wget -qO- http://127.0.0.1:3000/health`).toString();
        if (check === "OK") {
          isHealthy = true;
          break;
        }
      } catch (e) {}
      await wait(2000);
    }

    if (!isHealthy) {
      console.error(`\n❌ Health check failed for ${targetVersion}. Rolling back...`);
      execSync(`docker rm -f ${CONTAINER_NAME}`);
      process.exit(1);
    }
    console.log(`✅ ${targetVersion} is healthy!`);

    // 4. Halt Schedulers on the Old Version (via the Gateway)
    if (previousVersion && previousVersion !== targetVersion) {
      console.log(`\n🛑 Halting schedulers on old version (${previousVersion})...`);
      try {
        // Ping the Gateway, forcing it to route to the old version
        await fetch('http://localhost:3000/api/internal/schedulers/stop', {
          method: 'POST',
          headers: { 'x-api-version': previousVersion }
        });
      } catch (e) {
        console.warn(`⚠️ Could not reach ${previousVersion} to stop schedulers.`);
      }
    }

    // 5. Shift Traffic
    console.log(`\n🔀 Shifting traffic...`);
    routes[targetVersion] = `http://${CONTAINER_NAME}:3000`;
    routes['default'] = `http://${CONTAINER_NAME}:3000`; 
    
    fs.writeFileSync(ROUTES_PATH, JSON.stringify(routes, null, 2));
    console.log(`✅ Traffic is now live on ${targetVersion}.`);

    // 6. Cleanup Oldest Version (Maintain max 2 active versions)
    const activeVersions = Object.keys(routes).filter(k => k !== 'default').sort();
    if (activeVersions.length > 2) {
      const oldestVersion = activeVersions[0]; 
      console.log(`\n🗑️  Pruning oldest version: ${oldestVersion}...`);
      try {
        execSync(`docker stop api-${oldestVersion}`); // SIGTERM for graceful shutdown
        execSync(`docker rm api-${oldestVersion}`);
        delete routes[oldestVersion];
        fs.writeFileSync(ROUTES_PATH, JSON.stringify(routes, null, 2));
      } catch(e) { }
    }

    console.log(`\n🎉 [SUCCESS] Deployment of ${targetVersion} complete!`);

  } catch (error) {
    console.error(`\n❌ [ERROR] Deployment failed:`, error.message);
  }
}

runDeploy();
