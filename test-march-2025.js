const GraphAPI = require('./src/graphApi');

async function getMarch2025Data() {
  console.log('📊 Fetching Instagram KPIs for March 1-31, 2025\n');
  
  const graphAPI = new GraphAPI();
  
  const startDate = '2025-03-01T00:00:00.000Z';
  const endDate = '2025-03-31T23:59:59.999Z';
  
  console.log(`📅 Date range: ${startDate} to ${endDate}\n`);
  
  try {
    // Pass null as the first argument to use the ID from process.env
    const kpis = await graphAPI.calculateInstagramKPIs(null, startDate, endDate);
    
    console.log('\n📋 MARCH 2025 SUMMARY');
    console.log('='.repeat(50));
    console.log(`📅 Period: March 1-31, 2025`);
    console.log(`📊 Total Reach: ${kpis.totalReach.toLocaleString()}`);
    console.log(`❤️ Total Likes: ${kpis.totalLikes.toLocaleString()}`);
    console.log(`💬 Total Comments: ${kpis.totalComments.toLocaleString()}`);
    console.log(`📌 Total Saved: ${kpis.totalSaved.toLocaleString()}`);
    console.log(`🔄 Total Shares: ${kpis.totalShares.toLocaleString()}`);
    console.log(`📱 Total Posts: ${kpis.totalPosts.toLocaleString()}`);
    console.log(`👥 Profile Views: ${kpis.profileViews.toLocaleString()}`);
    console.log(`🌐 Website Clicks: ${kpis.websiteClicks.toLocaleString()}`);
    console.log(`📺 Total Views: ${kpis.totalViews.toLocaleString()}`);
    
    // Calculate total engagements
    const totalEngagements = kpis.totalLikes + kpis.totalComments + kpis.totalSaved + kpis.totalShares;
    
    console.log(`\n🧮 FORMULA VALIDATION`);
    console.log('='.repeat(50));
    console.log(`Total Engagements (numerator): ${totalEngagements.toLocaleString()}`);
    console.log(`Total Reach (denominator): ${kpis.totalReach.toLocaleString()}`);
    console.log(`\nEngagement Rate Formula: (Total Engagements / Total Reach) × 100`);
    console.log(`Calculation: (${totalEngagements} / ${kpis.totalReach}) × 100`);
    
    const calculatedRate = (totalEngagements / kpis.totalReach) * 100;
    console.log(`Manual Calculation: ${calculatedRate.toFixed(6)}%`);
    console.log(`System Output: ${kpis.engagementRate.toFixed(6)}%`);
    
    if (Math.abs(calculatedRate - kpis.engagementRate) < 0.000001) {
      console.log(`✅ Formula validation: PASSED`);
    } else {
      console.log(`❌ Formula validation: FAILED - Discrepancy detected`);
      console.log(`Difference: ${Math.abs(calculatedRate - kpis.engagementRate).toFixed(6)}%`);
    }
    
    console.log(`\n📈 ENGAGEMENT RATE (BY REACH): ${kpis.engagementRate.toFixed(2)}%`);
    
  } catch (error) {
    console.error('❌ Error fetching March 2025 data:', error.message);
  }
}

getMarch2025Data(); 