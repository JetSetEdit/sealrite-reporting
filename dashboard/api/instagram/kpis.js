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
  
  // Additional debugging for Vercel environment
  console.log('🔧 Vercel Environment Debug:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - VERCEL_ENV:', process.env.VERCEL_ENV);
  console.log('  - VERCEL_REGION:', process.env.VERCEL_REGION);
  console.log('  - All env keys:', Object.keys(process.env).filter(key => key.includes('FACEBOOK') || key.includes('INSTAGRAM')).join(', '));

  try {
    // Check for required environment variables
    if (!process.env.FACEBOOK_ACCESS_TOKEN) {
      console.log('❌ Missing FACEBOOK_ACCESS_TOKEN');
      return res.status(500).json({
        error: 'Missing FACEBOOK_ACCESS_TOKEN',
        message: 'Facebook Access Token is not configured',
        testMode: req.body.testMode || 'unknown'
      });
    }

    if (!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      console.log('❌ Missing INSTAGRAM_BUSINESS_ACCOUNT_ID');
      return res.status(500).json({
        error: 'Missing INSTAGRAM_BUSINESS_ACCOUNT_ID',
        message: 'Instagram Business Account ID is not configured',
        testMode: req.body.testMode || 'unknown'
      });
    }

    console.log('✅ Environment variables are set');

    // Import GraphAPI
    const GraphAPI = require('../../src/graphApi.js');
    const graphAPI = new GraphAPI();

    const { pageId, startDate, endDate, forceRefresh, testMode } = req.body;

    console.log('🔧 Test mode:', testMode);
    console.log('📅 Date range:', startDate, 'to', endDate);

    // Handle different test modes
    let result = {};

    switch (testMode) {
      case 'pageId':
        console.log('🧪 Testing Page ID validation...');
        try {
          const pageInfo = await graphAPI.getPageInfo(pageId);
          result = {
            testMode: 'pageId',
            success: true,
            pageInfo,
            message: 'Page ID validation successful'
          };
        } catch (error) {
          console.log('❌ Page ID test failed:', error.message);
          result = {
            testMode: 'pageId',
            success: false,
            error: error.message,
            message: 'Page ID validation failed'
          };
        }
        break;

      case 'followers':
        console.log('🧪 Testing followers fetch...');
        try {
          const followers = await graphAPI.getFollowers(pageId, startDate, endDate);
          result = {
            testMode: 'followers',
            success: true,
            followers,
            message: 'Followers fetch successful'
          };
        } catch (error) {
          console.log('❌ Followers test failed:', error.message);
          result = {
            testMode: 'followers',
            success: false,
            error: error.message,
            message: 'Followers fetch failed'
          };
        }
        break;

      case 'profileViews':
        console.log('🧪 Testing profile views fetch...');
        try {
          const profileViews = await graphAPI.getProfileViews(pageId, startDate, endDate);
          result = {
            testMode: 'profileViews',
            success: true,
            profileViews,
            message: 'Profile views fetch successful'
          };
        } catch (error) {
          console.log('❌ Profile views test failed:', error.message);
          result = {
            testMode: 'profileViews',
            success: false,
            error: error.message,
            message: 'Profile views fetch failed'
          };
        }
        break;

      case 'posts':
        console.log('🧪 Testing posts and engagement fetch...');
        try {
          const posts = await graphAPI.getPosts(pageId, startDate, endDate);
          result = {
            testMode: 'posts',
            success: true,
            posts,
            message: 'Posts and engagement fetch successful'
          };
        } catch (error) {
          console.log('❌ Posts test failed:', error.message);
          result = {
            testMode: 'posts',
            success: false,
            error: error.message,
            message: 'Posts and engagement fetch failed'
          };
        }
        break;

      case 'full':
      default:
        console.log('🧪 Testing full KPI calculation...');
        try {
          const kpis = await graphAPI.calculateInstagramKPIs(pageId, startDate, endDate, forceRefresh);
          result = {
            testMode: 'full',
            success: true,
            kpis,
            message: 'Full KPI calculation successful'
          };
        } catch (error) {
          console.log('❌ Full KPI test failed:', error.message);
          result = {
            testMode: 'full',
            success: false,
            error: error.message,
            message: 'Full KPI calculation failed'
          };
        }
        break;
    }

    console.log('✅ Test completed successfully');
    console.log('📊 Result:', JSON.stringify(result, null, 2));

    return res.status(200).json(result);

  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
    console.log('💥 Error stack:', error.stack);
    
    return res.status(500).json({
      error: 'Unexpected error',
      message: error.message,
      testMode: req.body.testMode || 'unknown',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 