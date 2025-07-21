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
    // FAST TEST: Return sample data immediately to test environment variables
    console.log('⚡ FAST TEST: Returning sample data to test environment variables');
    
    const sampleData = {
      followerGrowth: {
        percentage: 8.5,
        startCount: 1150,
        endCount: 1250,
        formula: "(End Followers - Start Followers) / Start Followers * 100"
      },
      engagementRate: {
        percentage: 10.25,
        totalEngagementsNumerator: 1602,
        denominatorValue: 15420,
        formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
        note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
      },
      profileViews: {
        total: 890,
        period: "monthly"
      },
      reach: {
        total: 15420,
        period: "monthly"
      },
      impressions: {
        total: 23450,
        period: "monthly"
      },
      posts: {
        count: 12,
        data: [
          {
            id: "sample_post_1",
            caption: "Sample post for testing",
            likes: 45,
            comments: 12,
            reach: 1200
          }
        ]
      },
      conversions: {
        websiteClicks: 156,
        otherContactClicks: 23
      },
      reportingPeriod: {
        start: "2025-03-01T00:00:00.000Z",
        end: "2025-03-07T23:59:59.999Z"
      },
      environment: {
        facebookTokenSet: !!process.env.FACEBOOK_ACCESS_TOKEN,
        instagramAccountSet: !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
        facebookPageSet: !!process.env.FACEBOOK_PAGE_ID
      },
      note: "Sample data for testing environment variables and API connectivity"
    };
    
    console.log('✅ Sample data generated successfully!');
    console.log('📊 Environment status:', sampleData.environment);

    res.status(200).json(sampleData);

  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Return a more informative error response
    res.status(500).json({
      error: 'API Error',
      message: error.message,
      details: 'Function encountered an error while generating sample data.',
      timestamp: new Date().toISOString()
    });
  }
} 