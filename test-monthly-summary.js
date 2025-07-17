const GraphAPI = require('./src/graphApi');

async function generateMonthlySummary() {
  console.log('📊 Generating Monthly Summary for March, April, May, and June 2025\n');
  
  const graphAPI = new GraphAPI();
  
  const months = [
    { name: 'March 2025', startDate: '2025-03-01T00:00:00.000Z', endDate: '2025-03-31T23:59:59.999Z' },
    { name: 'April 2025', startDate: '2025-04-01T00:00:00.000Z', endDate: '2025-04-30T23:59:59.999Z' },
    { name: 'May 2025', startDate: '2025-05-01T00:00:00.000Z', endDate: '2025-05-31T23:59:59.999Z' },
    { name: 'June 2025', startDate: '2025-06-01T00:00:00.000Z', endDate: '2025-06-30T23:59:59.999Z' }
  ];
  
  const summary = [];
  
  for (const month of months) {
    console.log(`\n🔍 Fetching data for ${month.name}...`);
    console.log(`📅 Date range: ${month.startDate} to ${month.endDate}`);
    
    try {
      const kpis = await graphAPI.calculateInstagramKPIs(
        null, // Use default Instagram Business Account ID
        month.startDate,
        month.endDate
      );
      
      const monthData = {
        month: month.name,
        dateRange: `${month.startDate} to ${month.endDate}`,
        engagementRate: kpis.engagementRate.percentage,
        totalEngagements: kpis.engagementRate.totalEngagementsNumerator,
        totalReach: kpis.engagementRate.denominatorValue,
        posts: kpis.posts.count,
        profileViews: kpis.profileViews.total,
        impressions: kpis.impressions.total,
        followerGrowth: kpis.followerGrowth.percentage,
        startFollowers: kpis.followerGrowth.startCount,
        endFollowers: kpis.followerGrowth.endCount,
        websiteClicks: kpis.conversions.websiteClicks,
        otherContactClicks: kpis.conversions.otherContactClicks,
        formula: kpis.engagementRate.formula,
        note: kpis.engagementRate.note
      };
      
      summary.push(monthData);
      
      console.log(`✅ ${month.name} data fetched successfully`);
      console.log(`   Engagement Rate: ${monthData.engagementRate}%`);
      console.log(`   Total Engagements: ${monthData.totalEngagements}`);
      console.log(`   Total Reach: ${monthData.totalReach}`);
      console.log(`   Posts: ${monthData.posts}`);
      
    } catch (error) {
      console.error(`❌ Error fetching data for ${month.name}:`, error.message);
      summary.push({
        month: month.name,
        dateRange: `${month.startDate} to ${month.endDate}`,
        error: error.message
      });
    }
  }
  
  // Display complete summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 COMPLETE MONTHLY SUMMARY - MARCH, APRIL, MAY, JUNE 2025');
  console.log('='.repeat(80));
  
  summary.forEach((monthData, index) => {
    console.log(`\n${index + 1}. ${monthData.month}`);
    console.log('   Date Range:', monthData.dateRange);
    
    if (monthData.error) {
      console.log('   ❌ Error:', monthData.error);
    } else {
      console.log('   📊 Engagement Rate (By Reach):', monthData.engagementRate + '%');
      console.log('   🔢 Total Engagements (Numerator):', monthData.totalEngagements);
      console.log('   👥 Total Reach (Denominator):', monthData.totalReach);
      console.log('   📸 Posts:', monthData.posts);
      console.log('   👁️ Profile Views:', monthData.profileViews);
      console.log('   📈 Impressions:', monthData.impressions);
      console.log('   📈 Follower Growth:', monthData.followerGrowth + '%');
      console.log('   👥 Start Followers:', monthData.startFollowers);
      console.log('   👥 End Followers:', monthData.endFollowers);
      console.log('   🔗 Website Clicks:', monthData.websiteClicks);
      console.log('   📞 Other Contact Clicks:', monthData.otherContactClicks);
      console.log('   📝 Formula:', monthData.formula);
      console.log('   📋 Note:', monthData.note);
      
      // Formula validation
      const calculatedRate = monthData.totalReach > 0 ? 
        (monthData.totalEngagements / monthData.totalReach) * 100 : 0;
      console.log('   ✅ Formula Validation:');
      console.log(`      (${monthData.totalEngagements} / ${monthData.totalReach}) × 100 = ${calculatedRate.toFixed(6)}%`);
      console.log(`      System calculated: ${monthData.engagementRate}%`);
      console.log(`      Match: ${Math.abs(calculatedRate - monthData.engagementRate) < 0.000001 ? '✅' : '❌'}`);
    }
  });
  
  // Summary statistics
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY STATISTICS');
  console.log('='.repeat(80));
  
  const validMonths = summary.filter(m => !m.error);
  if (validMonths.length > 0) {
    const avgEngagementRate = validMonths.reduce((sum, m) => sum + m.engagementRate, 0) / validMonths.length;
    const totalEngagements = validMonths.reduce((sum, m) => sum + m.totalEngagements, 0);
    const totalReach = validMonths.reduce((sum, m) => sum + m.totalReach, 0);
    const totalPosts = validMonths.reduce((sum, m) => sum + m.posts, 0);
    
    console.log(`📈 Average Engagement Rate: ${avgEngagementRate.toFixed(4)}%`);
    console.log(`🔢 Total Engagements (All Months): ${totalEngagements}`);
    console.log(`👥 Total Reach (All Months): ${totalReach}`);
    console.log(`📸 Total Posts (All Months): ${totalPosts}`);
    console.log(`📊 Overall Engagement Rate: ${totalReach > 0 ? (totalEngagements / totalReach * 100).toFixed(4) : 0}%`);
  }
  
  console.log('\n✅ Monthly summary generation complete!');
}

generateMonthlySummary().catch(console.error); 