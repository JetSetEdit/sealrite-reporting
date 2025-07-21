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
    // HYBRID APPROACH: Try real API first, fallback to sample data
    console.log('🚀 HYBRID APPROACH: Attempting real Facebook API call...');
    
    const { pageId, startDate, endDate, forceRefresh } = req.body || {};
    
    // Use a very short date range for faster response
    const testStartDate = '2025-03-01T00:00:00.000Z';
    const testEndDate = '2025-03-03T23:59:59.999Z'; // Just 3 days for speed
    
    console.log('📅 Using short date range for speed:', testStartDate, 'to', testEndDate);
    
    // Set a short timeout (10 seconds) for the real API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Real API timeout after 10 seconds')), 10000);
    });

    const GraphAPI = require('../../src/graphApi.js');
    const graphAPI = new GraphAPI();

    // Try real API call with timeout
    const realApiPromise = graphAPI.calculateInstagramKPIs(
      pageId || process.env.FACEBOOK_PAGE_ID,
      testStartDate,
      testEndDate,
      forceRefresh || true
    );

    console.log('📡 Making real Facebook API call...');
    const realData = await Promise.race([realApiPromise, timeoutPromise]);
    
    console.log('✅ REAL API SUCCESS! Got real data from Facebook');
    console.log('📊 Real data received:', JSON.stringify(realData, null, 2));

    res.status(200).json({
      ...realData,
      source: 'real_facebook_api',
      note: 'Real data from Facebook Graph API',
      environment: {
        facebookTokenSet: !!process.env.FACEBOOK_ACCESS_TOKEN,
        instagramAccountSet: !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
        facebookPageSet: !!process.env.FACEBOOK_PAGE_ID
      }
    });

  } catch (error) {
    console.error('❌ Real API failed:', error.message);
    console.log('🔄 Falling back to sample data...');
    
    // Fallback to sample data
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
        end: "2025-03-03T23:59:59.999Z"
      },
      source: 'sample_data_fallback',
      note: `Sample data - Real API failed: ${error.message}`,
      environment: {
        facebookTokenSet: !!process.env.FACEBOOK_ACCESS_TOKEN,
        instagramAccountSet: !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
        facebookPageSet: !!process.env.FACEBOOK_PAGE_ID
      }
    };
    
    console.log('✅ Sample data fallback generated');
    res.status(200).json(sampleData);
  }
} 