const axios = require('axios');
require('dotenv').config();
const flatCache = require('flat-cache');
const path = require('path');

// Initialize cache outside the class for simplicity
// Cache will be stored in a directory named 'api-cache' in your project root
const cache = flatCache.create('apiCache', path.resolve('./api-cache'));
console.log('Cache loaded from:', path.resolve('./api-cache'));

class GraphAPI {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v23.0';
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    this.facebookPageId = process.env.FACEBOOK_PAGE_ID;
  }

  /**
   * Helper to chunk a date range into 30-day intervals (max allowed by some API insights).
   * @param {Date} start - Start date of the overall period.
   * @param {Date} end - End date of the overall period.
   * @returns {Array<{since: number, until: number}>} - Array of date chunks as Unix timestamps.
   */
  _getDateChunks(start, end) {
    const chunks = [];
    let currentStart = new Date(start);
    const endDate = new Date(end);

    while (currentStart.getTime() <= endDate.getTime()) {
      let chunkEndDate = new Date(currentStart);
      chunkEndDate.setDate(currentStart.getDate() + 29); // 30 days including the start day

      if (chunkEndDate.getTime() > endDate.getTime()) {
        chunkEndDate = new Date(endDate); // Ensure the last chunk doesn't go past the overall end date
      }

      chunks.push({
        since: currentStart.toISOString(),
        until: chunkEndDate.toISOString()
      });

      currentStart.setDate(chunkEndDate.getDate() + 1); // Move to the next day after the chunk ends
      currentStart.setHours(0,0,0,0); // Reset hours to avoid timezone issues affecting date arithmetic
    }
    console.log(`Generated ${chunks.length} date chunks for period.`);
    return chunks;
  }

  /**
   * Makes a generic GET request to the Facebook Graph API, handling retries (for 429) and pagination.
   * Integrates simple file-based caching.
   * @param {string} endpoint - The Graph API endpoint (e.g., '/{id}/insights', '/{id}/media').
   * @param {object} params - Query parameters for the API call.
   * @param {number} retries - Max number of retries for rate limit errors.
   * @param {number} delay - Initial delay in milliseconds for retries.
   * @param {string} cacheKeySuffix - Optional suffix to make cache key unique (e.g., for different periods).
   * @returns {Promise<object>} - An object containing 'data' which is an array of all fetched items.
   */
  async makeRequest(endpoint, params = {}, retries = 3, delay = 1000, cacheKeySuffix = '') {
    const cacheKey = `${endpoint}?${JSON.stringify(params)}_${cacheKeySuffix}`;
    
    // Check cache first
    const cachedData = cache.getKey(cacheKey);
    if (cachedData) {
      console.log('Using cached data for:', cacheKey);
      return cachedData;
    }

    let url = `${this.baseUrl}${endpoint}`;
    let allData = [];
    let currentUrl = url; // This will change for pagination
    let attempt = 0; // Tracks retry attempts for the current URL/page

    while (true) { // Loop to handle pagination and retries
      if (attempt > retries) {
        throw new Error(`Max retries reached for URL: ${url} (last attempted page: ${currentUrl}) due to rate limits or persistent errors.`);
      }

      try {
        console.log(`Making request attempt ${attempt + 1} to: ${currentUrl || url} (initial endpoint: ${endpoint})`);
        
        const response = await axios.get(currentUrl || url, {
          params: (currentUrl === url ? { access_token: this.accessToken, ...params } : {}), // Params only for the first call
          validateStatus: (status) => status >= 200 && status < 500, // Do not throw for 4xx errors; handle them manually
          timeout: 20000 // 20-second timeout for API calls
        });

        console.log('API response status:', response.status);
        
        // Handle Rate Limit (HTTP 429) specifically
        if (response.status === 429) {
          console.log(`Rate limit hit (429) for ${currentUrl || url}. Retrying in ${delay / 1000} seconds. Attempts left: ${retries - attempt}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          delay *= 2; // Exponential backoff
          continue; // Retry the same URL/page
        }

        // Handle other non-successful responses (e.g., 400 Bad Request, 403 Forbidden, 404 Not Found)
        if (response.status >= 400) {
          console.log(`API error for ${currentUrl || url}: Status ${response.status}, Data:`, response.data);
          const errorMessage = response.data?.error?.message || `API error: ${response.status} - ${response.statusText}`;
          throw new Error(errorMessage); // Re-throw other errors
        }

        // Process successful response data
        const responseData = response.data;
        if (responseData.data) {
          allData = allData.concat(responseData.data);
        }

        // Handle Pagination (check for 'next' link)
        if (responseData.paging && responseData.paging.next) {
          currentUrl = responseData.paging.next; // Update URL to fetch the next page
          attempt = 0; // Reset retry attempt counter for the new page
          delay = 1000; // Reset delay for the new page
          console.log('Found next page for pagination. Continuing to fetch...');
        } else {
          currentUrl = null; // No more pages, exit loop
          console.log('No more pages for pagination. Finished fetching.');
        }

        if (!currentUrl) { // If no more pages, break out of the while(true) loop
          break;
        }

      } catch (error) {
        // If it's a network error or an error before response.status could be checked, retry
        if (attempt < retries && !error.response) { // Only retry if it's not an API-specific error with a response
          console.log(`Network/Unhandled error on attempt ${attempt + 1}. Retrying in ${delay / 1000} seconds: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          delay *= 2;
          continue; // Retry the same URL
        } else {
          console.log(`Max retries reached or unhandled API error for ${url}:`, error);
          throw error; // Re-throw the error if max retries exceeded or it's a definitive API error
        }
      }
    }
    
    // Store the result in cache before returning
    const result = { data: allData };
    cache.setKey(cacheKey, result);
    cache.save(); // Persist changes to disk
    console.log('Data cached for:', cacheKey);
    
    return result; // Return all collected data as a single 'data' array
  }

  /**
   * Fetches insights for a Facebook Page.
   */
  async getFacebookPageInsights(pageId, metrics, period = 'month') {
    const endpoint = `/${pageId}/insights`;
    const params = {
      metric: metrics.join(','),
      period,
      date_preset: 'last_30d' // Default to last 30 days
    };
    return await this.makeRequest(endpoint, params, 3, 1000, `fbInsights-${pageId}-${period}`); // Add cache suffix
  }

  /**
   * Fetches account-level insights for an Instagram Business Account.
   * Handles date ranges longer than 30 days by chunking requests and processing in parallel.
   */
  async getInstagramInsights(metrics, period = 'day', instagramBusinessAccountId = null, startDate = null, endDate = null) {
    const accountId = instagramBusinessAccountId || this.instagramBusinessAccountId;
    if (!accountId) {
      throw new Error('Instagram Business Account ID not configured');
    }

    const startOfPeriod = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfPeriod = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    console.log(`Fetching Instagram insights for period: ${startOfPeriod.toISOString()} to ${endOfPeriod.toISOString()}`);
    
    const insightsToFetch = [...new Set(metrics.concat([
        'follower_count', 'profile_views', 'reach', 'impressions',
        'website_clicks'
    ]))];

    const chunks = this._getDateChunks(startOfPeriod, endOfPeriod);
    const endpoint = `/${accountId}/insights`;
    
    // PARALLEL PROCESSING: Launch all chunk requests simultaneously
    const insightPromises = chunks.map(async (chunk, index) => {
      const params = {
        metric: insightsToFetch.join(','),
        period: 'day', // Always request daily values for chunking and aggregation
        metric_type: 'total_value', // Required for profile_views and website_clicks
        since: chunk.since,
        until: chunk.until
      };
      // Add a unique cache suffix for each chunk
      console.log(`Launching parallel insights request for chunk ${index + 1}: ${chunk.since} to ${chunk.until}`);
      return await this.makeRequest(endpoint, params, 3, 1000, `igInsights-${accountId}-${chunk.since}-${chunk.until}`);
    });

    let allResultsData = [];
    try {
      const responses = await Promise.all(insightPromises);
      responses.forEach(response => {
        if (response.data) {
          allResultsData.push(...response.data);
        }
      });
      console.log(`Successfully fetched insights for all ${chunks.length} chunks.`);
    } catch (error) {
      console.error('Error fetching Instagram insights in parallel chunks:', error.message);
      throw error; // Re-throw to propagate the error
    }
    
    // Aggregate results from all chunks. This will ensure unique metric names are processed.
    const aggregatedData = {};
    allResultsData.forEach(metricData => {
        if (!aggregatedData[metricData.name]) {
            aggregatedData[metricData.name] = { ...metricData, values: [] };
        }
        // For 'day' period, values is an array of daily objects, so concatenate
        if (metricData.period === 'day' && Array.isArray(metricData.values)) {
            aggregatedData[metricData.name].values.push(...metricData.values);
        } else if (metricData.values?.[0]?.value !== undefined) {
            // For total_value metrics, sum them up across chunks
            // Ensure proper aggregation if the same metric comes with 'total_value' across different chunks
            // (e.g., if total_value means sum of entire chunk, then sum these up)
            // This assumes a 'total_value' insight from API is meant to be summed for the overall period
            aggregatedData[metricData.name].values = [{ 
                value: (aggregatedData[metricData.name].values[0]?.value || 0) + (metricData.values[0].value || 0) 
            }];
        }
    });

    return { data: Object.values(aggregatedData) };
  }

  /**
   * Fetches Instagram posts and their selected insights for monthly reporting.
   * Handles date ranges longer than 30 days by chunking requests and processing in parallel.
   */
  async getInstagramPosts(limit = 100, instagramBusinessAccountId = null, startDate = null, endDate = null) {
    const accountId = instagramBusinessAccountId || this.instagramBusinessAccountId;
    if (!accountId) {
      throw new Error('Instagram Business Account ID not configured');
    }

    const startOfPeriod = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfPeriod = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const chunks = this._getDateChunks(startOfPeriod, endOfPeriod);
    const endpoint = `/${accountId}/media`;

    // PARALLEL PROCESSING: Launch all chunk requests simultaneously
    const postPromises = chunks.map(async (chunk, index) => {
      const params = {
        // Request likes, comments, saved, and shares explicitly from insights.metric
        fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,insights.metric(likes,comments,saved,shares,reach,impressions,website_clicks)', 
        limit: limit, // Initial limit for the first page of each chunk, makeRequest handles pagination within chunk
        since: chunk.since,
        until: chunk.until,
      };
      console.log(`Launching parallel posts request for chunk ${index + 1}: ${chunk.since} to ${chunk.until}`);
      return await this.makeRequest(endpoint, params, 3, 1000, `igPosts-${accountId}-${chunk.since}-${chunk.until}`); // Add cache suffix
    });

    let allPostsData = [];
    try {
        const responses = await Promise.all(postPromises);
        responses.forEach(response => {
            if (response.data) {
                allPostsData.push(...response.data);
            }
        });
        console.log(`Successfully fetched posts for all ${chunks.length} chunks.`);
    } catch (error) {
        console.error('Error fetching Instagram posts in parallel chunks:', error.message);
        throw error; // Re-throw to propagate the error
    }

    // Process all collected posts
    if (allPostsData) {
      allPostsData = allPostsData.map(post => ({
        ...post,
        like_count: post.like_count || 0,
        comments_count: post.comments_count || 0,
        insights: post.insights || { data: [] } 
      }));
    }
    return { data: allPostsData }; 
  }

  /**
   * Gets audience demographics (Placeholder, using lifetime).
   */
  async getAudienceDemographics(pageId) {
    const endpoint = `/${pageId}/insights`;
    const params = {
      metric: 'page_fans_city,page_fans_country,page_fans_gender_age',
      period: 'lifetime'
    };
    return await this.makeRequest(endpoint, params, 3, 1000, `demographics-${pageId}`); // Add cache suffix
  }

  /**
   * Gets basic Facebook Page information, including linked Instagram Business Account details.
   */
  async getPageInfo(pageId) {
    const endpoint = `/${pageId}`;
    const params = {
      fields: 'name,fan_count,followers_count,verification_status,category,instagram_business_account{id,username,media_count,followers_count}'
    };
    return await this.makeRequest(endpoint, params, 3, 1000, `pageInfo-${pageId}`); // Add cache suffix
  }

  /**
   * Fetches comprehensive monthly data for a page and its connected Instagram account.
   */
  async getMonthlyData(pageId, startDate = null, endDate = null) {
    console.log(`Fetching monthly data for page: ${pageId} from ${startDate} to ${endDate}`);
    try {
      const pageInfo = await this.getPageInfo(pageId);
      
      let instagramBusinessAccountId = this.instagramBusinessAccountId;
      if (!instagramBusinessAccountId && pageInfo.instagram_business_account) {
        instagramBusinessAccountId = pageInfo.instagram_business_account.id;
      }

      let instagramInsights = null;
      let instagramPosts = null;
      let instagramKPIs = null;

      if (instagramBusinessAccountId) {
        try {
          console.log(`Fetching Instagram data for account: ${instagramBusinessAccountId}`);
          instagramKPIs = await this.calculateInstagramKPIs(instagramBusinessAccountId, startDate, endDate);
          
          instagramInsights = { data: [] }; 
          instagramPosts = instagramKPIs.posts;
          console.log('Instagram data fetched successfully');
        } catch (error) {
          console.warn('Instagram data not available:', error.message);
          console.warn('Error details:', error.response?.data);
        }
      }

      // Placeholder for Facebook insights and posts (not primary focus right now)
      let facebookInsights = null;
      let facebookPosts = null;
      
      // Placeholder for GA4 data (from previous discussions)
      let ga4Data = null;
      try {
        ga4Data = await this.getGA4Data(startDate, endDate);
        console.log('GA4 data fetched successfully.');
      } catch (error) {
        console.warn('GA4 data not available (placeholder failure):', error.message);
      }

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
        ga4: ga4Data, 
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      throw error;
    }
  }

  /**
   * Placeholder for GA4 data fetching.
   */
  async getGA4Data(startDate, endDate) {
    console.log(`Fetching GA4 data for ${startDate} to ${endDate} (placeholder)`);

    return {
      totalConversions: 63, 
      linkClicks: 50, 
      formSubmissions: 5,
      bioTaps: 8,
      siteVisits: 214 
    };
  }

  /**
   * Fetches insights for a single Instagram media ID.
   */
  async getInstagramMediaInsights(mediaId) {
    const endpoint = `/${mediaId}/insights`;
    // Request all potential engagement metrics at the media level
    const params = {
      metric: 'likes,comments,saved,shares,reach,impressions,website_clicks' 
    };
    return await this.makeRequest(endpoint, params, 3, 1000, `mediaInsights-${mediaId}`); // Add cache suffix
  }

  /**
   * Calculates contract-required KPIs for monthly reporting for Instagram.
   */
  async calculateInstagramKPIs(instagramBusinessAccountId = null, startDate = null, endDate = null) {
    const accountId = instagramBusinessAccountId || this.instagramBusinessAccountId;
    if (!accountId) {
      throw new Error('Instagram Business Account ID not configured');
    }

    console.log('📊 Calculating Instagram KPIs for contract reporting...');
    
    const now = new Date();
    const startOfPeriod = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfPeriod = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Fetch account-level insights (reach, impressions, profile_views, follower_count, website_clicks)
    const accountInsights = await this.getInstagramInsights(
      ['follower_count', 'profile_views', 'reach', 'impressions', 'website_clicks'],
      'day', // Period is day for daily totals which will be summed later
      accountId,
      startOfPeriod.toISOString(),
      endOfPeriod.toISOString()
    );

    console.log('Account insights response for KPIs:', accountInsights);

    let startFollowers = 0;
    let endFollowers = 0;
    let averageFollowers = 0;

    const followerDataSeries = accountInsights.data.find(metric => metric.name === 'follower_count');
    if (followerDataSeries && followerDataSeries.values && followerDataSeries.values.length > 0) {
        startFollowers = followerDataSeries.values[0].value;
        endFollowers = followerDataSeries.values[followerDataSeries.values.length - 1].value;
        
        const totalDailyFollowers = followerDataSeries.values.reduce((sum, day) => sum + (day.value || 0), 0);
        averageFollowers = totalDailyFollowers / followerDataSeries.values.length;
        console.log(`Calculated average followers from daily data: ${averageFollowers}`);
    } else {
      try {
        const accountInfo = await this.makeRequest(`/${accountId}`, { fields: 'followers_count' });
        endFollowers = accountInfo.followers_count || 0;
        startFollowers = endFollowers; 
        averageFollowers = endFollowers; 
        console.log(`Fallback: Used single current follower count for start, end, and average: ${endFollowers}`);
      } catch (error) {
        console.log('Could not get current follower count from account info for fallback:', error.message);
      }
    }

    let followerGrowthPercentage = 0;
    if (startFollowers > 0) {
        followerGrowthPercentage = ((endFollowers - startFollowers) / startFollowers) * 100;
    } else if (endFollowers > 0) {
        followerGrowthPercentage = Infinity; 
    }
    console.log(`Follower growth calculation: (${endFollowers} - ${startFollowers}) / ${startFollowers} * 100 = ${followerGrowthPercentage}%`);

    const postsData = await this.getInstagramPosts(
      100, // Fetch up to 100 posts per chunk. Pagination in makeRequest handles more.
      accountId,
      startOfPeriod.toISOString(),
      endOfPeriod.toISOString()
    );
    console.log(`Fetched ${postsData.data?.length || 0} posts for KPI calculation.`);

    let totalEngagementsNumerator = 0; // This will be the numerator for the new Engagement Rate
    let totalWebsiteClicks = 0;
    let totalOtherContactClicks = 0;

    if (postsData.data && postsData.data.length > 0) {
      postsData.data.forEach(post => {
        // Get values from post.insights.data (e.g., likes, comments, saved, shares)
        // Values will be 0 if the insight is not available for that specific post or permission.
        const getPostInsightValue = (postInsightsData, metricName, fallbackValue = 0) => {
            const insight = postInsightsData?.find(i => i.name === metricName);
            return insight?.values?.[0]?.value || fallbackValue;
        };

        const postLikes = getPostInsightValue(post.insights?.data, 'likes', post.like_count); // Fallback to direct like_count
        const postComments = getPostInsightValue(post.insights?.data, 'comments', post.comments_count); // Fallback to direct comments_count
        const postSaved = getPostInsightValue(post.insights?.data, 'saved'); 
        const postShares = getPostInsightValue(post.insights?.data, 'shares');

        totalEngagementsNumerator += postLikes + postComments + postSaved + postShares;
        
        const websiteClicksInsight = post.insights?.data?.find(i => i.name === 'website_clicks');
        totalWebsiteClicks += websiteClicksInsight?.values?.[0]?.value || 0;
      });
    }

    const getAccountMetricTotal = (metricName) => {
        const metric = accountInsights.data.find(m => m.name === metricName);
        // Sum values across all daily entries for total_value if period='day' was used in insight fetching
        if (metric?.values && metric.period === 'day') {
            return metric.values.reduce((sum, day) => sum + (day.value || 0), 0);
        }
        // Fallback for single total_value insight (if period='total_value' was primarily used)
        return metric?.values?.[0]?.value || 0; 
    };

    // Note: get_directions_clicks, email_contacts, phone_call_clicks, text_message_clicks are not available in Instagram API
    // These metrics are not supported for Instagram Business accounts

    const totalReach = getAccountMetricTotal('reach');
    const totalImpressions = getAccountMetricTotal('impressions'); 

    // Use Total Reach for engagement rate calculation denominator
    const engagementRatePercentage = totalReach > 0 ? (totalEngagementsNumerator / totalReach) * 100 : 0;
    
    console.log('Engagement calculation details:');
    console.log(`  Total Engagements Numerator (Likes + Comments + Saved + Shares from posts): ${totalEngagementsNumerator}`);
    console.log(`  Total Reach (denominator): ${totalReach}`);
    console.log(`  Engagement rate (based on Reach): ${engagementRatePercentage}%`);
    console.log(`  Total website clicks from posts: ${totalWebsiteClicks}`);
    console.log(`  Total other contact clicks from insights: ${totalOtherContactClicks}`);

    const profileViewsData = accountInsights.data.find(metric => metric.name === 'profile_views');
    const totalProfileViews = getAccountMetricTotal('profile_views');

    return {
      followerGrowth: {
        percentage: Math.round(followerGrowthPercentage * 100) / 100,
        startCount: startFollowers,
        endCount: endFollowers,
        formula: `(End Followers - Start Followers) / Start Followers * 100`
      },
      engagementRate: {
        percentage: Math.round(engagementRatePercentage * 100) / 100,
        totalEngagementsNumerator: totalEngagementsNumerator, 
        denominatorValue: totalReach, // Total Reach for the "By Reach" context
        formula: `(Likes + Comments + Saved + Shares) / Total Reach * 100`, // Updated formula display
        note: 'Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights.' 
      },
      profileViews: {
        total: totalProfileViews,
        period: 'monthly'
      },
      reach: {
        total: totalReach,
        period: 'monthly'
      },
      impressions: { 
        total: totalImpressions,
        period: 'monthly'
      },
      posts: {
        count: postsData.data?.length || 0,
        data: postsData.data || []
      },
      conversions: { 
        websiteClicks: totalWebsiteClicks,
        otherContactClicks: totalOtherContactClicks,
      },
      reportingPeriod: {
        start: startOfPeriod.toISOString(),
        end: endOfPeriod.toISOString()
      }
    };

  } catch (error) {
    console.error('Error calculating Instagram KPIs:', error);
    throw error;
  }
}

module.exports = GraphAPI; 