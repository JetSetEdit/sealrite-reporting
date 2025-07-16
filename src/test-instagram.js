const GraphAPI = require('./graphApi');
require('dotenv').config();

async function testInstagramAPI() {
  const graphAPI = new GraphAPI();
  
  console.log('🧪 Testing Instagram API Integration...\n');
  
  try {
    // Test 1: Get Instagram insights
    console.log('📊 Testing Instagram Account Insights...');
    const insights = await graphAPI.getInstagramInsights([
      'reach',
      'impressions',
      'profile_views',
      'follower_count'
    ], 'day');
    
    console.log('✅ Instagram insights retrieved successfully');
    console.log('Insights data:', JSON.stringify(insights, null, 2));
    
    // Test 2: Get Instagram posts
    console.log('\n📸 Testing Instagram Posts...');
    const posts = await graphAPI.getInstagramPosts(5);
    
    console.log('✅ Instagram posts retrieved successfully');
    console.log(`Found ${posts.data?.length || 0} posts`);
    
    if (posts.data && posts.data.length > 0) {
      console.log('Sample post:', {
        id: posts.data[0].id,
        caption: posts.data[0].caption?.substring(0, 100),
        media_type: posts.data[0].media_type,
        insights_count: posts.data[0].insights?.length || 0
      });
    }
    
    // Test 3: Get comprehensive monthly data
    console.log('\n📈 Testing Comprehensive Monthly Data...');
    const pageId = process.env.FACEBOOK_PAGE_ID || '651877034666676';
    const monthlyData = await graphAPI.getMonthlyData(pageId);
    
    console.log('✅ Monthly data retrieved successfully');
    console.log('Data structure:', {
      hasFacebook: !!monthlyData.facebook,
      hasInstagram: !!monthlyData.instagram,
      instagramAccountId: monthlyData.instagram?.businessAccountId,
      instagramInsightsCount: monthlyData.instagram?.insights?.data?.length || 0,
      instagramPostsCount: monthlyData.instagram?.posts?.data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testInstagramAPI(); 