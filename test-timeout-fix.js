const GraphAPI = require('./src/graphApi');

async function testTimeoutFixes() {
  console.log('🧪 Testing timeout fixes...');
  
  const graphAPI = new GraphAPI();
  
  try {
    // Test a simple API call that was timing out
    console.log('📊 Testing Instagram insights fetch...');
    const insights = await graphAPI.getInstagramInsights(
      ['profile_views', 'reach'],
      'day',
      null, // Use default Instagram Business Account ID
      '2025-03-01T00:00:00.000Z',
      '2025-03-31T23:59:59.999Z'
    );
    
    console.log('✅ Instagram insights test passed!');
    console.log('📈 Data received:', insights);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('⏰ This is still a timeout error - the fix may need adjustment');
    }
  }
}

// Run the test
testTimeoutFixes().catch(console.error); 