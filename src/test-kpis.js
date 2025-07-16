const GraphAPI = require('./graphApi');
require('dotenv').config();

async function testInstagramKPIs() {
  const graphAPI = new GraphAPI();
  
  console.log('🧪 Testing Instagram KPI Calculations...\n');
  
  try {
    // Test KPI calculation for current month
    console.log('📊 Testing Instagram KPI Calculation for Current Month...');
    const kpis = await graphAPI.calculateInstagramKPIs();
    
    console.log('✅ Instagram KPIs calculated successfully');
    console.log('\n📈 Contract-Required KPIs:');
    console.log('='.repeat(50));
    
    // Follower Growth
    console.log(`\n👥 Follower Growth:`);
    console.log(`   Target: ≥ 15%`);
    console.log(`   Actual: ${kpis.followerGrowth.percentage}%`);
    console.log(`   Status: ${kpis.followerGrowth.percentage >= 15 ? '✅ MET' : '❌ NOT MET'}`);
    console.log(`   Details: ${kpis.followerGrowth.startCount} → ${kpis.followerGrowth.endCount} followers`);
    console.log(`   Formula: ${kpis.followerGrowth.formula}`);
    
    // Engagement Rate
    console.log(`\n💬 Engagement Rate:`);
    console.log(`   Target: ≥ 5%`);
    console.log(`   Actual: ${kpis.engagementRate.percentage}%`);
    console.log(`   Status: ${kpis.engagementRate.percentage >= 5 ? '✅ MET' : '❌ NOT MET'}`);
    console.log(`   Details: ${kpis.engagementRate.totalLikes} likes + ${kpis.engagementRate.totalComments} comments`);
    console.log(`   Formula: ${kpis.engagementRate.formula}`);
    console.log(`   Note: ${kpis.engagementRate.note}`);
    
    // Profile Views
    console.log(`\n👁️ Profile Views:`);
    console.log(`   Total: ${kpis.profileViews.total} (${kpis.profileViews.period})`);
    
    // Reach
    console.log(`\n📢 Total Reach:`);
    console.log(`   Total: ${kpis.reach.total} (${kpis.reach.period})`);
    
    // Posts
    console.log(`\n📸 Posts:`);
    console.log(`   Count: ${kpis.posts.count} posts in period`);
    
    // Reporting Period
    console.log(`\n📅 Reporting Period:`);
    console.log(`   Start: ${new Date(kpis.reportingPeriod.start).toLocaleDateString()}`);
    console.log(`   End: ${new Date(kpis.reportingPeriod.end).toLocaleDateString()}`);
    
    // Bonus Eligibility Assessment
    console.log('\n💰 Bonus Eligibility Assessment:');
    console.log('='.repeat(50));
    
    const followerGrowth = kpis.followerGrowth.percentage;
    const engagementRate = kpis.engagementRate.percentage;
    
    let bonusTier = 'Not eligible';
    if (followerGrowth >= 15) {
      bonusTier = 'Full bonus';
    } else if (followerGrowth >= 12) {
      bonusTier = '50-75% prorated bonus';
    }
    
    console.log(`   Follower Growth (${followerGrowth}%): ${bonusTier}`);
    console.log(`   Engagement Rate (${engagementRate}%): ${engagementRate >= 5 ? 'Full bonus if met' : 'Not met'}`);
    console.log(`   Conversions/CTAs: Manual input required`);
    
    console.log('\n✅ KPI calculation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('API Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testInstagramKPIs(); 