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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate, pageId, forceRefresh = false } = req.body;
  
  try {
    console.log(`📊 API Test - Fetching Instagram KPIs for period: ${startDate} to ${endDate}`);
    console.log(`🔧 Environment check - FACEBOOK_ACCESS_TOKEN: ${process.env.FACEBOOK_ACCESS_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 Environment check - INSTAGRAM_BUSINESS_ACCOUNT_ID: ${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? 'SET' : 'NOT SET'}`);
    
    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['startDate', 'endDate'],
        received: { startDate, endDate, pageId, forceRefresh }
      });
    }
    
    // For now, use sample data to test API structure
    const start = new Date(startDate);
    console.log(`📅 Parsed start date: ${start.toISOString()}, month: ${start.getMonth()}`);
    
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june'];
    const month = monthNames[start.getMonth()];
    console.log(`📅 Selected month: ${month}`);
    
    if (!sampleData[month]) {
      console.log(`❌ No data for month: ${month}, available: ${Object.keys(sampleData)}`);
      return res.status(400).json({ 
        error: 'No sample data available for this period',
        requestedMonth: month,
        requestedMonthIndex: start.getMonth(),
        availableMonths: Object.keys(sampleData),
        receivedDates: { startDate, endDate }
      });
    }
    
    console.log('✅ Successfully returning sample data');
    
    res.json({
      instagram: {
        kpis: sampleData[month],
        note: 'Using sample data for testing',
        cacheStatus: 'sample',
        timestamp: new Date().toISOString(),
        environment: {
          facebookTokenSet: !!process.env.FACEBOOK_ACCESS_TOKEN,
          instagramAccountSet: !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
          facebookPageSet: !!process.env.FACEBOOK_PAGE_ID
        },
        debug: {
          requestedMonth: month,
          monthIndex: start.getMonth(),
          startDate: startDate,
          endDate: endDate
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in API:', error.message);
    console.error('🔍 Full error:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
      request: { startDate, endDate, pageId, forceRefresh }
    });
  }
}; 