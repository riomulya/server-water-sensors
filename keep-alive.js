const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// URLs for your deployed services
const NODEJS_URL =
  process.env.NODEJS_URL || 'https://your-nodejs-app.onrender.com';
const FLASK_URL = process.env.FLASK_URL || 'https://pw-brin-ml.onrender.com';

// Ping interval (in milliseconds) - 5 minutes
const PING_INTERVAL = 5 * 60 * 1000;

async function pingServices() {
  try {
    console.log('Pinging Node.js service...');
    const nodeResponse = await axios.get(`${NODEJS_URL}/health`);
    console.log(
      `Node.js status: ${nodeResponse.status}, ${new Date().toISOString()}`
    );

    console.log('Pinging Flask service...');
    const flaskResponse = await axios.get(`${FLASK_URL}/health`);
    console.log(
      `Flask status: ${flaskResponse.status}, ${new Date().toISOString()}`
    );
  } catch (error) {
    console.error('Error pinging services:', error.message);
  }
}

// Start pinging services
console.log('Starting keep-alive service...');
pingServices(); // Run immediately
setInterval(pingServices, PING_INTERVAL); // Then run every PING_INTERVAL
