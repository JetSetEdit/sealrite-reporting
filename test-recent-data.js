const GraphAPI = require('./src/graphApi');

async function getRecentData() {
  console.log('📊 Fetching Instagram KPIs for Recent Data\n');
  
  const graphAPI = new GraphAPI();
  
  // Use recent dates that work with Instagram API limitations
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // Yesterday (exclude current day)
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29); // 30 days ago
  
  console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);
  
  try {
    const kpis = await graphAPI.calculateInstagramKPIs(null, startDate.toISOString(), endDate.toISOString());
    
    console.log('\n📋 RECENT DATA SUMMARY');
    console.log('='.repeat(50));
    console.log(`📅 Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    console.log(`📊 Total Reach: ${kpis.reach?.toLocaleString() || 'N/A'}`);
    console.log(`👁️ Total Impressions: ${kpis.impressions?.toLocaleString() || 'N/A'}`);
    console.log(`👥 Follower Count: ${kpis.followerCount?.toLocaleString() || 'N/A'}`);
    console.log(`👤 Profile Views: ${kpis.profileViews?.toLocaleString() || 'N/A'}`);
    console.log(`🔗 Website Clicks: ${kpis.websiteClicks?.toLocaleString() || 'N/A'}`);
    
    if (kpis.engagementRate) {
      console.log('\n📈 ENGAGEMENT METRICS');
      console.log('-'.repeat(30));
      console.log(`💚 Total Likes: ${kpis.engagementRate.totalLikes?.toLocaleString() || 'N/A'}`);
      console.log(`💬 Total Comments: ${kpis.engagementRate.totalComments?.toLocaleString() || 'N/A'}`);
      console.log(`💾 Total Saved: ${kpis.engagementRate.totalSaved?.toLocaleString() || 'N/A'}`);
      console.log(`🔄 Total Shares: ${kpis.engagementRate.totalShares?.toLocaleString() || 'N/A'}`);
      console.log(`📊 Engagement Rate: ${kpis.engagementRate.percentage ? (kpis.engagementRate.percentage / 100).toFixed(2) + '%' : 'N/A'}`);
    }
    
    return kpis;
  } catch (error) {
    console.error('❌ Error fetching recent data:', error.message);
    throw error;
  }
}

getRecentData(); 