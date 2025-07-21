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

  // VERBOSE DEBUGGING - Add this section
  console.log('🔍 === API FUNCTION STARTED ===');
  console.log('📋 Request method:', req.method);
  console.log('📋 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Environment variables check:');
  console.log('  - FACEBOOK_ACCESS_TOKEN:', process.env.FACEBOOK_ACCESS_TOKEN ? 'SET (' + process.env.FACEBOOK_ACCESS_TOKEN.substring(0, 10) + '...)' : 'NOT SET');
  console.log('  - INSTAGRAM_BUSINESS_ACCOUNT_ID:', process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? 'SET (' + process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID + ')' : 'NOT SET');
  console.log('  - FACEBOOK_PAGE_ID:', process.env.FACEBOOK_PAGE_ID ? 'SET' : 'NOT SET');

  try {
    // Set a timeout for the entire function
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout after 25 seconds')), 25000);
    });

    // OPTIMIZATION: Use a shorter date range for faster response
    const { pageId, startDate, endDate, forceRefresh } = req.body || {};
    
    // Use a shorter date range (1 week instead of 1 month) for faster response
    const optimizedStartDate = '2025-03-01T00:00:00.000Z';
    const optimizedEndDate = '2025-03-07T23:59:59.999Z'; // Just 1 week for testing
    
    console.log('⚡ OPTIMIZATION: Using shorter date range for faster response');
    console.log('📅 Original range:', startDate, 'to', endDate);
    console.log('📅 Optimized range:', optimizedStartDate, 'to', optimizedEndDate);

    const GraphAPI = require('../../src/graphApi.js');
    const graphAPI = new GraphAPI();

    // Race between the API call and timeout
    const apiPromise = graphAPI.calculateInstagramKPIs(
      pageId || process.env.FACEBOOK_PAGE_ID,
      optimizedStartDate,
      optimizedEndDate,
      forceRefresh || true
    );

    const data = await Promise.race([apiPromise, timeoutPromise]);
    
    console.log('✅ API call completed successfully!');
    console.log('📊 Data received:', JSON.stringify(data, null, 2));

    res.status(200).json(data);

  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Return a more informative error response
    res.status(500).json({
      error: 'API Error',
      message: error.message,
      details: 'Function timed out or encountered an error. Try using a shorter date range.',
      timestamp: new Date().toISOString()
    });
  }
} 