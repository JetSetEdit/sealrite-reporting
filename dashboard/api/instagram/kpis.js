const GraphAPI = require('../../src/graphApi');

// Sample data for fallback (same as in server.js)
const sampleData = {
  march: {
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
      data: []
    },
    conversions: {
      websiteClicks: 156,
      otherContactClicks: 23
    },
    reportingPeriod: {
      start: "2025-03-01T00:00:00.000Z",
      end: "2025-03-31T23:59:59.999Z"
    }
  },
  april: {
    followerGrowth: {
      percentage: 10.4,
      startCount: 1250,
      endCount: 1380,
      formula: "(End Followers - Start Followers) / Start Followers * 100"
    },
    engagementRate: {
      percentage: 10.55,
      totalEngagementsNumerator: 1924,
      denominatorValue: 18230,
      formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
      note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
    },
    profileViews: {
      total: 1020,
      period: "monthly"
    },
    reach: {
      total: 18230,
      period: "monthly"
    },
    impressions: {
      total: 28760,
      period: "monthly"
    },
    posts: {
      count: 15,
      data: []
    },
    conversions: {
      websiteClicks: 189,
      otherContactClicks: 34
    },
    reportingPeriod: {
      start: "2025-04-01T00:00:00.000Z",
      end: "2025-04-30T23:59:59.999Z"
    }
  },
  may: {
    followerGrowth: {
      percentage: 10.1,
      startCount: 1380,
      endCount: 1520,
      formula: "(End Followers - Start Followers) / Start Followers * 100"
    },
    engagementRate: {
      percentage: 11.2,
      totalEngagementsNumerator: 2156,
      denominatorValue: 19250,
      formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
      note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
    },
    profileViews: {
      total: 1180,
      period: "monthly"
    },
    reach: {
      total: 19250,
      period: "monthly"
    },
    impressions: {
      total: 31200,
      period: "monthly"
    },
    posts: {
      count: 18,
      data: []
    },
    conversions: {
      websiteClicks: 234,
      otherContactClicks: 45
    },
    reportingPeriod: {
      start: "2025-05-01T00:00:00.000Z",
      end: "2025-05-31T23:59:59.999Z"
    }
  },
  june: {
    followerGrowth: {
      percentage: 9.8,
      startCount: 1520,
      endCount: 1670,
      formula: "(End Followers - Start Followers) / Start Followers * 100"
    },
    engagementRate: {
      percentage: 11.8,
      totalEngagementsNumerator: 2456,
      denominatorValue: 20800,
      formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
      note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
    },
    profileViews: {
      total: 1350,
      period: "monthly"
    },
    reach: {
      total: 20800,
      period: "monthly"
    },
    impressions: {
      total: 34500,
      period: "monthly"
    },
    posts: {
      count: 20,
      data: []
    },
    conversions: {
      websiteClicks: 289,
      otherContactClicks: 56
    },
    reportingPeriod: {
      start: "2025-06-01T00:00:00.000Z",
      end: "2025-06-30T23:59:59.999Z"
    }
  }
};

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
  console.log('  - FACEBOOK_PAGE_ID:', process.env.FACEBOOK_PAGE_ID ? 'SET (' + process.env.FACEBOOK_PAGE_ID + ')' : 'NOT SET');
  console.log('🔍 === END DEBUGGING ===');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate, pageId, forceRefresh = false } = req.body;
  
  try {
    console.log(`📊 REAL API - Fetching Instagram KPIs for period: ${startDate} to ${endDate}`);
    console.log(`🔧 Environment check - FACEBOOK_ACCESS_TOKEN: ${process.env.FACEBOOK_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 Environment check - INSTAGRAM_BUSINESS_ACCOUNT_ID: ${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 Environment check - FACEBOOK_PAGE_ID: ${process.env.FACEBOOK_PAGE_ID ? 'SET' : 'NOT SET'}`);
    
    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['startDate', 'endDate'],
        received: { startDate, endDate, pageId, forceRefresh }
      });
    }

    // Check if we have the required environment variables
    if (!process.env.FACEBOOK_ACCESS_TOKEN) {
      console.log('❌ Missing FACEBOOK_ACCESS_TOKEN');
      return res.status(500).json({
        error: 'Facebook access token not configured',
        message: 'FACEBOOK_ACCESS_TOKEN environment variable is required'
      });
    }

    if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      console.log('❌ Missing INSTAGRAM_BUSINESS_ACCOUNT_ID');
      return res.status(500).json({
        error: 'Instagram business account ID not configured',
        message: 'INSTAGRAM_BUSINESS_ACCOUNT_ID environment variable is required'
      });
    }
    
    console.log('✅ Environment variables validated, initializing GraphAPI...');
    
    // Initialize GraphAPI instance
    const graphAPI = new GraphAPI();
    
    console.log('📡 Making real Facebook Graph API calls...');
    
    // Use real API calls with our GraphAPI class
    const kpisData = await graphAPI.calculateInstagramKPIs(
      null, // instagramBusinessAccountId (will use from env)
      startDate,
      endDate,
      forceRefresh // Pass forceRefresh flag to bypass cache if needed
    );
    
    console.log('✅ Successfully fetched real Instagram KPIs from Facebook API');
    
    res.json({
      instagram: {
        kpis: kpisData,
        note: 'Real data from Facebook Graph API',
        cacheStatus: forceRefresh ? 'fresh' : 'cached',
        timestamp: new Date().toISOString(),
        environment: {
          facebookTokenSet: !!process.env.FACEBOOK_ACCESS_TOKEN,
          instagramAccountSet: !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
          facebookPageSet: !!process.env.FACEBOOK_PAGE_ID
        },
        debug: {
          startDate: startDate,
          endDate: endDate,
          forceRefresh: forceRefresh
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching real Instagram KPIs:', error.message);
    console.error('🔍 Full error details:', error);
    console.error('📋 Error stack trace:', error.stack);
    
    // Enhanced error response with more details
    const errorResponse = {
      error: 'Failed to fetch Instagram data from Facebook API',
      message: error.message,
      timestamp: new Date().toISOString(),
      request: {
        startDate,
        endDate,
        pageId,
        forceRefresh
      },
      environment: {
        facebookTokenSet: !!process.env.FACEBOOK_ACCESS_TOKEN,
        instagramAccountSet: !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
        facebookPageSet: !!process.env.FACEBOOK_PAGE_ID
      }
    };
    
    // Fallback to sample data if real API fails
    console.log('🔄 Falling back to sample data due to API error...');
    
    const start = new Date(startDate);
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june'];
    const month = monthNames[start.getMonth()];
    
    if (!sampleData[month]) {
      return res.status(400).json({ 
        ...errorResponse,
        error: 'No data available for this period'
      });
    }
    
    res.json({
      instagram: {
        kpis: sampleData[month],
        note: 'Using sample data due to Facebook API error',
        cacheStatus: 'fallback',
        timestamp: new Date().toISOString(),
        originalError: errorResponse
      }
    });
  }
}; 