const GraphAPI = require('./src/graphApi');

async function testGraphAPI() {
  console.log('🧪 Testing GraphAPI...\n');
  
  const graphAPI = new GraphAPI();
  
  try {
    // Test 1: Get Instagram insights
    console.log('📊 Testing Instagram Account Insights...');
    const insights = await graphAPI.getInstagramInsights([
      'follower_count',   'profile_views',  'reach'
    ], 'day');
    
    console.log('✅ Instagram insights retrieved successfully');
    console.log(`Found ${insights.data?.length || 0} insight metrics`);
    
    // Test 2: Get Instagram posts
    console.log('\n📸 Testing Instagram Posts...');
    const posts = await graphAPI.getInstagramPosts(5);
    
    console.log('✅ Instagram posts retrieved successfully');
    console.log(`Found ${posts.data?.length || 0} posts`);
    
    // Test 3: Calculate KPIs
    console.log('\n📈 Testing KPI Calculation...');
    const kpis = await graphAPI.calculateInstagramKPIs();
    
    console.log('✅ KPIs calculated successfully');
    console.log('Follower Growth:', kpis.followerGrowth.percentage + '%');
    console.log('Engagement Rate:', kpis.engagementRate.percentage + '%');
    console.log('Profile Views:', kpis.profileViews.total);
    console.log('Total Reach:', kpis.reach.total);
    
    console.log('\n✅ All tests passed! GraphAPI is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGraphAPI(); 