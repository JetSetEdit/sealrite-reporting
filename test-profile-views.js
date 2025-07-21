const GraphAPI = require('./src/graphApi');

async function testProfileViews() {
  const graphApi = new GraphAPI();
  
  try {
    console.log('🔍 Testing Profile Views API call...');
    
    // Test the account insights specifically for profile_views
    const accountInsights = await graphApi.getInstagramInsights(
      ['profile_views', 'reach'],
      'day',
      '17841470767631754', // Instagram Business Account ID
      '2025-06-01T00:00:00.000Z',
      '2025-07-18T23:59:59.999Z'
    );
    
    console.log('📊 Account Insights Response:');
    console.log(JSON.stringify(accountInsights, null, 2));
    
    // Check specifically for profile_views
    const profileViewsData = accountInsights.data.find(metric => metric.name === 'profile_views');
    console.log('\n👤 Profile Views Data:');
    console.log(profileViewsData);
    
    if (profileViewsData) {
      console.log('\n📈 Profile Views Values:');
      console.log(profileViewsData.values);
      
      // Calculate total
      const totalProfileViews = profileViewsData.values.reduce((sum, day) => sum + (day.value || 0), 0);
      console.log(`\n🎯 Total Profile Views: ${totalProfileViews}`);
    } else {
      console.log('\n❌ No profile_views data found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing profile views:', error.message);
    if (error.response?.data) {
      console.error('API Error Details:', error.response.data);
    }
  }
}

testProfileViews(); 