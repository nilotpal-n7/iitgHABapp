const BASE_URL = 'http://localhost:3000'; // Gateway URL
const REQUEST_COUNT = 20; // Number of requests to send
const DELAY_MS = 100; // Delay between requests

const endpoints = [
  '/',
  '/hello',
  // You can add more endpoints here if you know them, e.g.
  // '/api/users',
  // '/api/notification/test', 
  // '/api/auth/some-public-endpoint'
];

async function hitEndpoint(endpoint) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`Sending GET request to: ${url}`);
    
    // Using native fetch (Node.js 18+)
    const response = await fetch(url);
    console.log(`[${endpoint}] Status: ${response.status}`);
    
    // Consume body to ensure request completes fully
    await response.text();
  } catch (error) {
    console.log(`[${endpoint}] Error: ${error.message}`);
  }
}

async function runTest() {
  console.log(`Starting traffic simulation to ${BASE_URL}...`);
  console.log(`Sending ${REQUEST_COUNT} requests with ${DELAY_MS}ms delay.\n`);

  for (let i = 0; i < REQUEST_COUNT; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    await hitEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }

  console.log('\nTraffic simulation complete.');
}

runTest();
