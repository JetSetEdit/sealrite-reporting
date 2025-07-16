#!/usr/bin/env node

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const detect = require('detect-port').default;
const open = require('open');
const axios = require('axios');

const REQUIRED_ENV_VARS = ['FACEBOOK_ACCESS_TOKEN'];
const DEFAULT_BACKEND_PORT = 3000;
const DEFAULT_FRONTEND_PORT = 3001;

console.log('🚀 Starting SealRite Reporting Tool...\n');

function checkEnvVars() {
  let missing = [];
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) missing.push(key);
  }
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function validateFacebookToken() {
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!token) {
    console.error('❌ FACEBOOK_ACCESS_TOKEN not found in environment variables');
    return false;
  }

  console.log('🔍 Validating Facebook access token...');
  
  try {
    // Test the token by making a simple API call
    const response = await axios.get('https://graph.facebook.com/v22.0/me', {
      params: {
        access_token: token,
        fields: 'id,name'
      },
      timeout: 10000
    });

    if (response.data && response.data.id) {
      console.log(`✅ Facebook token is valid!`);
      console.log(`👤 User: ${response.data.name} (ID: ${response.data.id})`);
      return true;
    } else {
      console.error('❌ Facebook token validation failed - unexpected response');
      return false;
    }
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data?.error;
      if (errorData) {
        console.error(`❌ Facebook token validation failed:`);
        console.error(`   Type: ${errorData.type}`);
        console.error(`   Message: ${errorData.message}`);
        
        if (errorData.type === 'OAuthException' && errorData.code === 190) {
          console.error(`\n🔧 Token appears to be expired or invalid.`);
          console.error(`   Please refresh your token at: https://developers.facebook.com/tools/explorer/`);
        }
      } else {
        console.error(`❌ Facebook API error: ${error.response.status} ${error.response.statusText}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('❌ Facebook API timeout - check your internet connection');
    } else {
      console.error(`❌ Facebook token validation error: ${error.message}`);
    }
    return false;
  }
}

async function findFreePort(startPort) {
  let port = await detect(startPort);
  return port;
}

function runCommand(command, args, cwd = process.cwd(), env = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    cwd: cwd,
    shell: true,
    env: { ...process.env, ...env }
  });
}

async function waitForServer(url, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await axios.get(url);
      return true;
    } catch (e) {
      await new Promise(res => setTimeout(res, 500));
    }
  }
  return false;
}

async function startServices() {
  checkEnvVars();

  // Validate Facebook token before starting services
  const tokenValid = await validateFacebookToken();
  if (!tokenValid) {
    console.error('\n❌ Cannot start services with invalid Facebook token.');
    console.error('Please fix your token and try again.\n');
    process.exit(1);
  }

  console.log(''); // Add spacing

  // Find free ports
  const backendPort = await findFreePort(DEFAULT_BACKEND_PORT);
  const frontendPort = await findFreePort(DEFAULT_FRONTEND_PORT);

  if (backendPort !== DEFAULT_BACKEND_PORT) {
    console.warn(`⚠️  Port ${DEFAULT_BACKEND_PORT} is in use. Using ${backendPort} for backend.`);
  }
  if (frontendPort !== DEFAULT_FRONTEND_PORT) {
    console.warn(`⚠️  Port ${DEFAULT_FRONTEND_PORT} is in use. Using ${frontendPort} for frontend.`);
  }

  // Ensure backend and frontend use different ports
  const finalFrontendPort = frontendPort === backendPort ? frontendPort + 1 : frontendPort;
  if (finalFrontendPort !== frontendPort) {
    console.warn(`⚠️  Frontend port adjusted to ${finalFrontendPort} to avoid conflict with backend.`);
  }

  // Build dashboard
  try {
    console.log('🔨 Building React dashboard...');
    await new Promise((resolve, reject) => {
      const build = runCommand('npm', ['run', 'build'], path.join(process.cwd(), 'dashboard'));
      build.on('close', code => code === 0 ? resolve() : reject(new Error('Dashboard build failed')));
    });
    console.log('✅ Dashboard built successfully\n');
  } catch (err) {
    console.error('❌ Dashboard build failed:', err.message);
    process.exit(1);
  }

  // Start backend
  console.log(`🚀 Starting backend server on port ${backendPort}...`);
  const backendProcess = runCommand('node', ['src/index.js'], process.cwd(), { PORT: backendPort });

  // Wait for backend to be ready
  const backendReady = await waitForServer(`http://localhost:${backendPort}/health`);
  if (!backendReady) {
    console.error(`❌ Backend failed to start on port ${backendPort}`);
    backendProcess.kill('SIGTERM');
    process.exit(1);
  }

  // Start frontend
  console.log(`🎨 Starting React dashboard on port ${finalFrontendPort}...`);
  const frontendProcess = runCommand(
    'npm',
    ['start'],
    path.join(process.cwd(), 'dashboard'),
    { PORT: finalFrontendPort, REACT_APP_API_URL: `http://localhost:${backendPort}` }
  );

  // Wait for frontend to be ready
  const frontendReady = await waitForServer(`http://localhost:${finalFrontendPort}`);
  if (!frontendReady) {
    console.error(`❌ Frontend failed to start on port ${finalFrontendPort}`);
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(1);
  }

  // Open dashboard in browser
  try {
    await open(`http://localhost:${finalFrontendPort}`);
  } catch (error) {
    console.log(`🌐 Please open your browser to: http://localhost:${finalFrontendPort}`);
  }
  console.log(`\n✅ Both services started!`);
  console.log(`📊 Backend API: http://localhost:${backendPort}`);
  console.log(`🎨 Frontend Dashboard: http://localhost:${finalFrontendPort}`);
  console.log('\nPress Ctrl+C to stop both services');

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping services...');
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping services...');
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(0);
  });
}

startServices(); 