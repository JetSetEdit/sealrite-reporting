export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log('🔍 === ENVIRONMENT TEST ===');
  console.log('📋 All environment variables:');
  
  // Get all environment variables
  const allEnvVars = Object.keys(process.env).sort();
  console.log('Total env vars:', allEnvVars.length);
  
  // Filter for our specific variables
  const relevantVars = allEnvVars.filter(key => 
    key.includes('FACEBOOK') || 
    key.includes('INSTAGRAM') || 
    key.includes('VERCEL')
  );
  
  console.log('Relevant env vars:', relevantVars);
  
  // Check specific variables
  const envCheck = {
    FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN ? 'SET' : 'NOT SET',
    INSTAGRAM_BUSINESS_ACCOUNT_ID: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? 'SET' : 'NOT SET',
    FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID ? 'SET' : 'NOT SET',
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ? 'SET' : 'NOT SET',
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_REGION: process.env.VERCEL_REGION,
    totalEnvVars: allEnvVars.length,
    relevantEnvVars: relevantVars
  };
  
  console.log('🔧 Environment check:', envCheck);
  
  return res.status(200).json({
    message: 'Environment variables test',
    timestamp: new Date().toISOString(),
    environment: envCheck,
    allEnvVars: allEnvVars.slice(0, 20), // First 20 for debugging
    relevantEnvVars: relevantVars
  });
} 