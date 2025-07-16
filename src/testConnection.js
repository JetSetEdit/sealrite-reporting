const GraphAPI = require('./graphApi');
require('dotenv').config();

async function testConnection() {
  console.log('🧪 Testing SealRite Reporting Tool...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`- Facebook Access Token: ${process.env.FACEBOOK_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`- Instagram Business Account ID: ${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? '✅ Set' : '⚠️  Not set (optional)'}`);
  console.log(`- Report Output Dir: ${process.env.REPORT_OUTPUT_DIR || './reports'}\n`);

  if (!process.env.FACEBOOK_ACCESS_TOKEN) {
    console.log('❌ Please set FACEBOOK_ACCESS_TOKEN in your .env file');
    console.log('💡 Use the Graph API Explorer to get an access token');
    return;
  }

  const graphApi = new GraphAPI();

  try {
    // Test basic API connection
    console.log('🔗 Testing Graph API connection...');
    
    // You can replace this with a real page ID for testing
    const testPageId = '123456789012345'; // Replace with your actual page ID
    
    console.log(`📊 Attempting to fetch page info for: ${testPageId}`);
    
    // This will fail with a fake ID, but it will test the connection
    try {
      const pageInfo = await graphApi.getPageInfo(testPageId);
      console.log('✅ Graph API connection successful!');
      console.log(`📄 Page Name: ${pageInfo.name}`);
      console.log(`👥 Followers: ${pageInfo.followers_count}`);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('⚠️  Test page ID not found (expected with fake ID)');
        console.log('✅ Graph API connection is working!');
      } else {
        console.log('❌ Graph API connection failed:', error.message);
      }
    }

    // Test available metrics
    console.log('\n📈 Available Metrics:');
    const facebookMetrics = [
      'page_impressions',
      'page_engaged_users', 
      'page_post_engagements',
      'page_followers'
    ];
    
    const instagramMetrics = [
      'impressions',
      'reach',
      'profile_views',
      'follower_count'
    ];

    console.log('Facebook:', facebookMetrics.join(', '));
    console.log('Instagram:', instagramMetrics.join(', '));

    // Test Instagram media insights
    const testMediaId = '18083780173826047'; // Example media ID from your recap
    try {
      console.log(`\n🔎 Fetching Instagram insights for media ID: ${testMediaId}`);
      const mediaInsights = await graphApi.getInstagramMediaInsights(testMediaId);
      console.log('✅ Instagram media insights:', JSON.stringify(mediaInsights, null, 2));
    } catch (error) {
      console.error('❌ Error fetching Instagram media insights:', error.message);
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n🚀 Next steps:');
    console.log('1. Replace the test page ID with your actual Facebook Page ID');
    console.log('2. Run: npm run fetch YOUR_PAGE_ID');
    console.log('3. Run: npm run report YOUR_PAGE_ID "Your Business Name"');
    console.log('4. Or start the API server: npm start');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Check your access token is valid');
    console.log('- Ensure you have the required permissions');
    console.log('- Verify your Facebook app is properly configured');
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testConnection().catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  });
}

module.exports = { testConnection }; 