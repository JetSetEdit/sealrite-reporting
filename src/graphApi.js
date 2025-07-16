const axios = require('axios');
require('dotenv').config();
const logger = require('./utils/logger');

class GraphAPI {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v22.0';
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  }

  // Generic method to make API calls
  async makeRequest(endpoint, params = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          access_token: this.accessToken,
          ...params
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Graph API Error: ${error.message}`);
      throw error;
    }
  }

  // Get Facebook Page insights
  async getFacebookPageInsights(pageId, metrics, period = 'month') {
    const endpoint = `/${pageId}/insights`;
    const params = {
      metric: metrics.join(','),
      period,
      date_preset: 'last_30d'
    };
    
    return await this.makeRequest(endpoint, params);
  }

  // Get Instagram Business Account insights for monthly reporting
  async getInstagramInsights(metrics, period = 'day', instagramBusinessAccountId = null, startDate = null, endDate = null) {
    const accountId = instagramBusinessAccountId || this.instagramBusinessAccountId;
    if (!accountId) {
      throw new Error('Instagram Business Account ID not configured');
    }

    try {
      logger.info(`Making Instagram insights requests for account: ${accountId}`);
      
      const results = [];
      
      // Calculate date range for the month
      const now = new Date();
      const startOfMonth = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const since = Math.floor(startOfMonth.getTime() / 1000);
      const until = Math.floor(endOfMonth.getTime() / 1000);
      
      logger.info(`Date range: ${startOfMonth.toISOString()} to ${endOfMonth.toISOString()}`);
      
      // Request 1: Follower count (for growth calculation)
      if (metrics.includes('follower_count')) {
        try {
          const followerParams = {
            metric: 'follower_count',
            period: 'day',
            since,
            until
          };
          
          const followerResponse = await this.makeRequest(`/${accountId}/insights`, followerParams);
          if (followerResponse.data) {
            results.push(...followerResponse.data);
          }
        } catch (error) {
          logger.warn(`Follower count request failed: ${error.response?.data?.error?.message}`);
        }
      }
      
      // Request 2: Profile views (for highlights)
      if (metrics.includes('profile_views')) {
        try {
          const profileParams = {
            metric: 'profile_views',
            period: 'day',
            since,
            until,
            metric_type: 'total_value'
          };
          
          const profileResponse = await this.makeRequest(`/${accountId}/insights`, profileParams);
          if (profileResponse.data) {
            results.push(...profileResponse.data);
          }
        } catch (error) {
          logger.warn(`Profile views request failed: ${error.response?.data?.error?.message}`);
        }
      }
      
      // Request 3: Reach (if supported for account level)
      if (metrics.includes('reach')) {
        try {
          const reachParams = {
            metric: 'reach',
            period: 'day',
            since,
            until
          };
          
          const reachResponse = await this.makeRequest(`/${accountId}/insights`, reachParams);
          if (reachResponse.data) {
            results.push(...reachResponse.data);
          }
        } catch (error) {
          logger.warn(`Reach request failed: ${error.response?.data?.error?.message}`);
        }
      }
      
      return { data: results };
    } catch (error) {
      logger.error(`Instagram insights error: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  // Get posts from Facebook Page
  async getFacebookPosts(pageId, limit = 25) {
    const endpoint = `/${pageId}/posts`;
    const params = {
      fields: 'id,message,created_time,type,permalink_url,insights.metric(post_impressions,post_engagements,post_reactions_by_type_total)',
      limit
    };

    return await this.makeRequest(endpoint, params);
  }

  // Get Instagram posts for monthly reporting
  async getInstagramPosts(limit = 25, instagramBusinessAccountId = null, startDate = null, endDate = null) {
    const accountId = instagramBusinessAccountId || this.instagramBusinessAccountId;
    if (!accountId) {
      throw new Error('Instagram Business Account ID not configured');
    }

    const endpoint = `/${accountId}/media`;
    const params = {
      fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,insights.metric(engagement,reach,impressions)',
      limit
    };

    // Add date filtering if provided
    if (startDate && endDate) {
      const since = Math.floor(new Date(startDate).getTime() / 1000);
      const until = Math.floor(new Date(endDate).getTime() / 1000);
      params.since = since;
      params.until = until;
    }

    try {
      logger.info(`Making Instagram posts request to: ${endpoint}`);
      const response = await this.makeRequest(endpoint, params);
      
      // Process posts to enhance with insights data
      if (response.data) {
        response.data = response.data.map(post => ({
          ...post,
          // Use actual data if available, otherwise keep placeholders
          like_count: post.like_count || 0,
          comments_count: post.comments_count || 0,
          insights: post.insights || { data: [] }
        }));
      }
      
      return response;
    } catch (error) {
      logger.error(`Instagram posts error: ${error.response?.data || error.message}`);
      throw error;
    }
  }

  // Get audience demographics
  async getAudienceDemographics(pageId) {
    const endpoint = `/${pageId}/insights`;
    const params = {
      metric: 'page_fans_city,page_fans_country,page_fans_gender_age',
      period: 'lifetime'
    };

    return await this.makeRequest(endpoint, params);
  }

  // Get page information
  async getPageInfo(pageId) {
    const endpoint = `/${pageId}`;
    const params = {
      fields: 'name,fan_count,followers_count,verification_status,category,instagram_business_account{id,username,media_count,followers_count}'
    };

    return await this.makeRequest(endpoint, params);
  }

  // Get comprehensive monthly data
  async getMonthlyData(pageId, startDate = null, endDate = null) {
    try {
      // First get page info to check for Instagram connection
      const pageInfo = await this.getPageInfo(pageId);
      
      // Check if Instagram is connected - this is our primary focus
      let instagramBusinessAccountId = this.instagramBusinessAccountId;
      if (!instagramBusinessAccountId && pageInfo.instagram_business_account) {
        instagramBusinessAccountId = pageInfo.instagram_business_account.id;
      }

      let instagramInsights = null;
      let instagramPosts = null;
      let instagramKPIs = null;

      // Fetch Instagram data as primary focus
      if (instagramBusinessAccountId) {
        try {
          logger.info(`Fetching Instagram data for account: ${instagramBusinessAccountId}`);
          // Calculate Instagram KPIs for the specified month with historical follower data
          // Historical data: March, April, May = 58 followers
          instagramKPIs = await this.calculateInstagramKPIs(instagramBusinessAccountId, startDate, endDate, 58);
          
          instagramInsights = { data: [] }; // Keep for backward compatibility
          instagramPosts = instagramKPIs.posts;
          logger.info('Instagram data fetched successfully');
        } catch (error) {
          logger.warn(`Instagram data not available: ${error.message}`);
          logger.warn(`Error details: ${JSON.stringify(error.response?.data)}`);
          
          // Return basic Instagram data even when API calls fail
          try {
            const accountInfo = await this.makeRequest(`/${instagramBusinessAccountId}`, {
              fields: 'followers_count,media_count,username'
            });
            
            instagramInsights = { data: [] };
            instagramPosts = { count: 0, data: [] };
                         instagramKPIs = {
               followerGrowth: {
                 percentage: 0,
                 startCount: 58, // March 2025 baseline
                 endCount: accountInfo.followers_count || 58,
                 formula: `(${accountInfo.followers_count || 58} - 58) / 58 * 100`
               },
              engagementRate: {
                percentage: 0,
                totalLikes: 0,
                totalComments: 0,
                totalEngagement: 0,
                endFollowers: accountInfo.followers_count || 58,
                formula: `(0 + 0) / ${accountInfo.followers_count || 58} * 100`,
                note: 'Data unavailable due to API limitations'
              },
              profileViews: {
                total: 0,
                period: 'monthly'
              },
              reach: {
                total: 0,
                period: 'monthly'
              },
              posts: {
                count: 0,
                data: []
              },
              reportingPeriod: {
                start: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                end: endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
              }
            };
          } catch (fallbackError) {
            logger.error(`Fallback Instagram data also failed: ${fallbackError.message}`);
            // Still return null if even the basic account info fails
            instagramInsights = null;
            instagramPosts = null;
            instagramKPIs = null;
          }
        }
      }

      // Only fetch basic Facebook data if needed (minimal)
      let facebookInsights = null;
      let facebookPosts = null;
      
      // Skip Facebook insights for now since we're focusing on Instagram
      // Only get basic page info which we already have

      return {
        facebook: {
          pageInfo,
          insights: facebookInsights,
          posts: facebookPosts
        },
        instagram: instagramBusinessAccountId ? {
          businessAccountId: instagramBusinessAccountId,
          insights: instagramInsights,
          posts: instagramPosts,
          kpis: instagramKPIs
        } : null,
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      logger.error(`Error fetching monthly data: ${error.message}`);
      throw error;
    }
  }

  // Fetch insights for a single Instagram media ID
  async getInstagramMediaInsights(mediaId) {
    const endpoint = `/${mediaId}/insights`;
    const params = {
      metric: 'engagement,reach'
    };
    return await this.makeRequest(endpoint, params);
  }

  // Calculate contract-required KPIs for monthly reporting
  async calculateInstagramKPIs(instagramBusinessAccountId = null, startDate = null, endDate = null, historicalFollowers = null) {
    const accountId = instagramBusinessAccountId || this.instagramBusinessAccountId;
    if (!accountId) {
      throw new Error('Instagram Business Account ID not configured');
    }

    try {
      logger.info('Calculating Instagram KPIs for contract reporting...');
      
      // Get account insights for the month
      const accountInsights = await this.getInstagramInsights(
        ['follower_count', 'profile_views', 'reach'],
        'day',
        accountId,
        startDate,
        endDate
      );

      // Debug account insights (commented out for production)
      // console.log('Account insights response:', JSON.stringify(accountInsights, null, 2));

      // Try to get current follower count from account info
      let currentFollowers = 0;
      try {
        const accountInfo = await this.makeRequest(`/${accountId}`, {
          fields: 'followers_count,media_count,username'
        });
        currentFollowers = accountInfo.followers_count || 0;
        // console.log('Current follower count from account info:', currentFollowers);
      } catch (error) {
        logger.warn(`Could not get follower count from account info: ${error.message}`);
      }

      // Get posts for the month (without individual insights to avoid 400 errors)
      const postsData = await this.getInstagramPosts(
        100, // Get more posts to ensure we capture all monthly posts
        accountId,
        startDate,
        endDate
      );

      // Calculate follower growth
      const followerData = accountInsights.data.find(metric => metric.name === 'follower_count');
      let followerGrowth = 0;
      let startFollowers = 0;
      let endFollowers = 0;

                // Use historical data if provided (March 2025 baseline = 58 followers)
          if (historicalFollowers !== null && historicalFollowers !== undefined) {
            startFollowers = historicalFollowers;
            logger.info(`Using historical follower count: ${historicalFollowers} (March 2025 baseline)`);
          } else {
        // Debug follower data (commented out for production)
        // console.log('Follower data found:', !!followerData);

        if (followerData && followerData.values && followerData.values.length >= 2) {
          startFollowers = followerData.values[0].value;
          endFollowers = followerData.values[followerData.values.length - 1].value;
          followerGrowth = startFollowers > 0 ? ((endFollowers - startFollowers) / startFollowers) * 100 : 0;
        } else if (followerData && followerData.total_value) {
          // Fallback to total_value if available
          endFollowers = followerData.total_value.value || 0;
          startFollowers = endFollowers; // For now, assume no growth if we only have current value
        } else {
          // Use current follower count from account info as fallback
          endFollowers = currentFollowers;
          startFollowers = currentFollowers; // For now, assume no growth if we only have current value
        }
      }

      // If we used historical data, calculate growth from historical to current
      if (historicalFollowers !== null && historicalFollowers !== undefined) {
        endFollowers = currentFollowers;
        followerGrowth = startFollowers > 0 ? ((endFollowers - startFollowers) / startFollowers) * 100 : 0;
        logger.info(`Follower growth calculation: (${endFollowers} - ${startFollowers}) / ${startFollowers} * 100 = ${followerGrowth}%`);
      }

      // Calculate engagement rate
      let totalLikes = 0;
      let totalComments = 0;
      let totalEngagement = 0;

      if (postsData.data && postsData.data.length > 0) {
        postsData.data.forEach(post => {
          totalLikes += post.like_count || 0;
          totalComments += post.comments_count || 0;
          
          // Note: Individual post insights are not available due to API limitations
          // We're using like_count and comments_count directly from the posts
        });
      }

      const engagementRate = endFollowers > 0 ? ((totalLikes + totalComments) / endFollowers) * 100 : 0;
      
      // Debug engagement calculation (commented out for production)
      // console.log('Engagement calculation details:');
      // console.log(`  Total likes: ${totalLikes}`);
      // console.log(`  Total comments: ${totalComments}`);
      // console.log(`  End followers: ${endFollowers}`);
      // console.log(`  Engagement rate: ${engagementRate}%`);

      // Calculate profile views for the month
      const profileViewsData = accountInsights.data.find(metric => metric.name === 'profile_views');
      let totalProfileViews = 0;

      if (profileViewsData && profileViewsData.values) {
        totalProfileViews = profileViewsData.values.reduce((sum, day) => sum + (day.value || 0), 0);
      } else if (profileViewsData && profileViewsData.total_value) {
        // Use total_value if available (like in the current response)
        totalProfileViews = profileViewsData.total_value.value || 0;
      }

      // Calculate total reach for the month
      const reachData = accountInsights.data.find(metric => metric.name === 'reach');
      let totalReach = 0;

      if (reachData && reachData.values) {
        totalReach = reachData.values.reduce((sum, day) => sum + (day.value || 0), 0);
      }

      return {
        followerGrowth: {
          percentage: Math.round(followerGrowth * 100) / 100,
          startCount: startFollowers,
          endCount: endFollowers,
          formula: `(${endFollowers} - ${startFollowers}) / ${startFollowers} * 100`
        },
        engagementRate: {
          percentage: Math.round(engagementRate * 100) / 100,
          totalLikes,
          totalComments,
          totalEngagement,
          endFollowers,
          formula: `(${totalLikes} + ${totalComments}) / ${endFollowers} * 100`,
          note: 'Shares are omitted due to API limitations'
        },
        profileViews: {
          total: totalProfileViews,
          period: 'monthly'
        },
        reach: {
          total: totalReach,
          period: 'monthly'
        },
        posts: {
          count: postsData.data?.length || 0,
          data: postsData.data || []
        },
        reportingPeriod: {
          start: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          end: endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
        }
      };

    } catch (error) {
      logger.error(`Error calculating Instagram KPIs: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GraphAPI; 