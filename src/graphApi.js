const axios = require('axios');
require('dotenv').config();
const flatCache = require('flat-cache');
const path = require('path');

// Custom error class for token expiration
class TokenExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TokenExpiredError';
    this.isTokenExpired = true;
  }
}

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
    
    // Validate token on initialization
    this.validateToken();
  }

  /**
   * Validates the access token and provides helpful error messages
   */
  validateToken() {
    if (!this.accessToken) {
      throw new Error('❌ FACEBOOK_ACCESS_TOKEN environment variable is not set. Please add it to your .env file.');
    }
    
    if (this.accessToken.length < 50) {
      throw new Error('❌ Access token appears to be invalid (too short). Please check your FACEBOOK_ACCESS_TOKEN in .env file.');
    }
    
    console.log('✅ Access token loaded successfully');
  }

  /**
   * Checks if an error is due to token expiration
   */
  isTokenExpiredError(error) {
    const errorMessage = error.message || '';
    const errorData = error.response?.data?.error;
    
    return (
      errorMessage.includes('Session has expired') ||
      errorMessage.includes('Error validating access token') ||
      errorData?.code === 190 ||
      errorData?.error_subcode === 463
    );
  }

  /**
   * Provides helpful guidance for token expiration
   */
  getTokenExpirationHelp() {
    return `
🔑 **Access Token Expired**

Your Facebook access token has expired. Here's how to fix it:

1. **Generate New Token:**
   - Go to: https://developers.facebook.com/tools/explorer/
   - Click "Generate Access Token"
   - Select required permissions (Instagram permissions)
   - Copy the new token

2. **Update Your Environment:**
   - Replace FACEBOOK_ACCESS_TOKEN in your .env file
   - Restart your server

3. **Required Permissions:**
   - instagram_basic
   - instagram_manage_insights
   - pages_read_engagement
   - pages_show_list

**Note:** Tokens expire every 60 days, not due to request volume.
    `;
  }

  /**
   * Helper to chunk a date range into smaller intervals for memory efficiency.
   * @param {Date} start - Start date of the overall period.
   * @param {Date} end - End date of the overall period.
   * @returns {Array<{since: number, until: number}>} - Array of date chunks as Unix timestamps.
   */
  _getDateChunks(start, end) {
    const chunks = [];
    let currentStart = new Date(start);
    const endDate = new Date(end);
    let iterationCount = 0;
    const maxIterations = 1000; // Safety limit to prevent infinite loops

    while (currentStart.getTime() <= endDate.getTime() && iterationCount < maxIterations) {
      iterationCount++;
      
      let chunkActualEnd = new Date(currentStart);
      chunkActualEnd.setDate(currentStart.getDate() + 2); // This sets the end of the 3-day chunk

      // If the 3-day chunk end goes past the overall endDate, cap it at overall endDate
      if (chunkActualEnd.getTime() > endDate.getTime()) {
        chunkActualEnd = new Date(endDate);
      }

      // The 'until' parameter for the API should be the day *after* chunkActualEnd
      // This ensures that since < until for all API requests
      let apiUntilDate = new Date(chunkActualEnd);
      apiUntilDate.setDate(apiUntilDate.getDate() + 1);
      apiUntilDate.setUTCHours(0,0,0,0); // Normalize to start of next day in UTC

      chunks.push({
        since: currentStart.toISOString().split('T')[0],
        until: apiUntilDate.toISOString().split('T')[0]
      });

      // Move currentStart to the day after chunkActualEnd for the next iteration
      currentStart = new Date(chunkActualEnd);
      currentStart.setDate(currentStart.getDate() + 1);
      currentStart.setHours(0,0,0,0); // Normalize to start of day
    }
    
    if (iterationCount >= maxIterations) {
      console.warn(`⚠️ Warning: Reached maximum iterations (${maxIterations}) in _getDateChunks. This may indicate an infinite loop.`);
    }
    
    console.log(`Generated ${chunks.length} date chunks for period (3-day intervals for memory efficiency).`);
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
  async makeRequest(endpoint, params = {}, retries = 3, delay = 1000, cacheKeySuffix = '', maxPageFetches = 20, forceRefresh = false) { // Added maxPageFetches and forceRefresh
    const cacheKey = `${endpoint}?${JSON.stringify(params)}_${cacheKeySuffix}`;
    
    // Check cache first (unless forceRefresh is true)
    if (!forceRefresh) {
      const cachedData = cache.getKey(cacheKey);
      if (cachedData) {
        console.log('Using cached data for:', cacheKey);
        return cachedData;
      }
    } else {
      console.log('Force refresh requested - bypassing cache for:', cacheKey);
    }

    let url = `${this.baseUrl}${endpoint}`;
    let allData = [];
    let currentUrl = url; // This will change for pagination
    let attempt = 0; // Tracks retry attempts for the current URL/page
    let pageCount = 0; // Initialize page counter

    while (true) { // Loop to handle pagination and retries
      if (pageCount >= maxPageFetches) {
        console.warn(`WARNING: Max page fetches (${maxPageFetches}) reached for ${endpoint}. Stopping pagination to prevent infinite loop.`);
        break; // Exit loop if max pages reached
      }
      if (attempt > retries) {
        throw new Error(`Max retries reached for URL: ${url} (last attempted page: ${currentUrl}) due to rate limits or persistent errors.`);
      }

      try {
        const finalUrl = currentUrl || url;
        const startTime = Date.now();
        console.log(`🚀 Making request attempt ${attempt + 1} to: ${finalUrl} (initial endpoint: ${endpoint})`);
        console.log(`⏱️ Request started at: ${new Date().toISOString()}`);
        console.log(`DEBUG: Making request to final URL: ${finalUrl} with params:`, (currentUrl === url ? { access_token: this.accessToken, ...params } : {}));
        
        const response = await axios.get(finalUrl, {
          params: (currentUrl === url ? { access_token: this.accessToken, ...params } : {}), // Params only for the first call
          validateStatus: (status) => status >= 200 && status < 500, // Do not throw for 4xx errors; handle them manually
          timeout: 60000 // 60-second timeout for API calls (increased from 20s to handle slow Instagram API responses)
        });

        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`✅ API response received in ${duration}ms - Status: ${response.status}`);
        
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
          
          // Check for token expiration specifically - don't retry these
          const errorData = response.data?.error;
          if (errorData?.code === 190 || errorData?.error_subcode === 463) {
            console.error('🔑 TOKEN EXPIRED ERROR DETECTED');
            console.error(this.getTokenExpirationHelp());
            throw new TokenExpiredError('Access token has expired. Please generate a new token and update your environment variables.');
          }
          
          const errorMessage = response.data?.error?.message || `API error: ${response.status} - ${response.statusText}`;
          throw new Error(errorMessage); // Re-throw other errors
        }

        // Process successful response data
        const responseData = response.data;
        if (responseData.data) {
          allData = allData.concat(responseData.data);
        }

        pageCount++; // Increment page counter for each successful fetch attempt

        // Handle Pagination (check for 'next' link)
        if (responseData.paging && responseData.paging.next) {
          currentUrl = responseData.paging.next; // Update URL to fetch the next page
          attempt = 0; // Reset retry attempt counter for the new page
          delay = 1000; // Reset delay for the new page
          console.log(`Found next page for pagination. Continuing to fetch... (Page ${pageCount}/${maxPageFetches})`);
        } else {
          currentUrl = null; // No more pages, exit loop
          console.log('No more pages for pagination. Finished fetching.');
        }

        if (!currentUrl) { // If no more pages, break out of the while(true) loop
          break;
        }

      } catch (error) {
        // Check for token expiration first - don't retry these
        if (error.isTokenExpired || this.isTokenExpiredError(error)) {
          console.error('🔑 TOKEN EXPIRED ERROR DETECTED');
          console.error(this.getTokenExpirationHelp());
          throw error; // Re-throw the token expired error without retrying
        }
        
        // Handle timeout errors specifically
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.log(`⏰ Timeout error on attempt ${attempt + 1} for ${currentUrl || url}. Retrying in ${delay / 1000} seconds...`);
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, delay));
            attempt++;
            delay *= 2;
            continue; // Retry the same URL/page
          } else {
            console.error(`❌ Max retries reached for timeout errors on ${url}`);
            throw new Error(`Request timed out after ${retries} attempts. The Instagram API may be experiencing high load.`);
          }
        }
        
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
   * Clears cache for specific keys or all cache if no pattern provided
   */
  clearCache(pattern = null) {
    if (pattern) {
      // Clear specific cache keys matching pattern
      const keys = cache.getAllKeys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      matchingKeys.forEach(key => {
        cache.deleteKey(key);
        console.log(`Cleared cache for: ${key}`);
      });
    } else {
      // Clear all cache
      cache.clear();
      console.log('All cache cleared');
    }
    cache.save();
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
    console.log(`DEBUG: Account ID used for Instagram Insights endpoint: ${accountId}`);

    const startOfPeriod = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfPeriod = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    console.log(`Fetching Instagram insights for period: ${startOfPeriod.toISOString()} to ${endOfPeriod.toISOString()}`);
    
    // Combine requested metrics with default ones, ensuring uniqueness
    // Note: 'impressions' is deprecated in API v22+ and removed from default metrics
    // Note: 'website_clicks' is returning 0 for this account, so removed to reduce API calls
    const insightsToFetchAll = [...new Set(metrics.concat([
        'profile_views', 'reach'
    ]))];

    // Categorize metrics based on their compatibility with 'metric_type=total_value'
    const metricsRequiringTotalValue = ['profile_views'];
    const metricsForPeriodDay = insightsToFetchAll.filter(metric => !metricsRequiringTotalValue.includes(metric));
    const metricsForTotalValue = insightsToFetchAll.filter(metric => metricsRequiringTotalValue.includes(metric));

    const chunks = this._getDateChunks(startOfPeriod, endOfPeriod);
    const endpoint = `/${accountId}/insights`;
    
    let allResultsData = [];

    // Process chunks sequentially to reduce memory usage
    console.log(`Processing ${chunks.length} chunks sequentially for memory efficiency...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.since} to ${chunk.until}`);

      // 1. Fetch metrics that DO NOT require metric_type=total_value
      if (metricsForPeriodDay.length > 0) {
        const params = {
          metric: metricsForPeriodDay.join(','),
          period: 'day',
          since: chunk.since,
          until: chunk.until
        };
        try {
          const result = await this.makeRequest(endpoint, params, 3, 1000, `igInsights-day-${accountId}-${chunk.since}-${chunk.until}`);
          if (result.data) {
            allResultsData.push(...result.data);
          }
        } catch (error) {
          console.error(`Error fetching chunk ${i + 1} (day metrics):`, error.message);
        }
      }

      // 2. Fetch metrics that DO require metric_type=total_value
      if (metricsForTotalValue.length > 0) {
        const params = {
          metric: metricsForTotalValue.join(','),
          period: 'day',
          metric_type: 'total_value',
          since: chunk.since,
          until: chunk.until
        };
        try {
          const result = await this.makeRequest(endpoint, params, 3, 1000, `igInsights-total_value-${accountId}-${chunk.since}-${chunk.until}`);
          if (result.data) {
            allResultsData.push(...result.data);
          }
        } catch (error) {
          console.error(`Error fetching chunk ${i + 1} (total_value metrics):`, error.message);
        }
      }

      // Add a small delay between chunks to prevent overwhelming the API and reduce memory pressure
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully fetched insights for all ${chunks.length} chunks sequentially.`);
    
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

    let allPostsData = [];

    // Process chunks sequentially to reduce memory usage
    console.log(`Processing ${chunks.length} post chunks sequentially for memory efficiency...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing post chunk ${i + 1}/${chunks.length}: ${chunk.since} to ${chunk.until}`);

      const params = {
        // Request likes, comments, saved, and shares explicitly from insights.metric
        fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count,insights.metric(likes,comments,saved,shares,reach)', 
        limit: limit, // Initial limit for the first page of each chunk, makeRequest handles pagination within chunk
        since: chunk.since,
        until: chunk.until,
      };
      
      console.log(`DEBUG: Calling makeRequest for posts with params: ${JSON.stringify(params)}`);
      
      try {
        const result = await this.makeRequest(endpoint, params, 3, 1000, `igPosts-${accountId}-${chunk.since}-${chunk.until}`);
        console.log(`DEBUG: Received ${result.data?.length || 0} posts for chunk ${i + 1}/${chunks.length}`);
        if (result.data) {
          allPostsData.push(...result.data);
        }
      } catch (error) {
        console.error(`Error fetching post chunk ${i + 1}:`, error.message);
      }

      // Add a small delay between chunks to prevent overwhelming the API and reduce memory pressure
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Successfully fetched posts for all ${chunks.length} chunks sequentially.`);

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
      metric: 'likes,comments,saved,shares,reach,impressions' 
    };
    return await this.makeRequest(endpoint, params, 3, 1000, `mediaInsights-${mediaId}`); // Add cache suffix
  }

  /**
   * Calculates contract-required KPIs for monthly reporting for Instagram.
   */
  async calculateInstagramKPIs(instagramBusinessAccountId = null, startDate = null, endDate = null, forceRefresh = false) {
    const accountId = instagramBusinessAccountId || this.instagramBusinessAccountId;
    if (!accountId) {
      throw new Error('Instagram Business Account ID not configured');
    }
    console.log(`DEBUG: calculateInstagramKPIs - accountId: ${accountId}`);
    console.log(`DEBUG: calculateInstagramKPIs - instagramBusinessAccountId parameter: ${instagramBusinessAccountId}`);
    console.log(`DEBUG: calculateInstagramKPIs - this.instagramBusinessAccountId: ${this.instagramBusinessAccountId}`);

    console.log('📊 Calculating Instagram KPIs for contract reporting...');
    
    const now = new Date();
    const startOfPeriod = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfPeriod = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Fetch account-level insights (reach, profile_views)
    // Note: 'impressions' is deprecated in API v22+ and no longer supported
    // Note: 'website_clicks' is returning 0 for this account, so removed to reduce API calls
    const accountInsights = await this.getInstagramInsights(
      ['profile_views', 'reach'],
      'day', // Period is day for daily totals which will be summed later
      accountId, // Instagram Business Account ID
      startOfPeriod.toISOString(), // startDate
      endOfPeriod.toISOString()    // endDate
    );

    console.log('Account insights response for KPIs:', accountInsights);

    let startFollowers = 0;
    let endFollowers = 0;
    let averageFollowers = 0;

    // Get current follower count from account info (direct API call for single object)
    try {
      const url = `${this.baseUrl}/${accountId}`;
      const response = await axios.get(url, {
        params: { 
          fields: 'followers_count',
          access_token: this.accessToken
        },
        timeout: 30000 // 30-second timeout for follower count requests
      });
      
      endFollowers = response.data.followers_count || 0;
      startFollowers = endFollowers; 
      averageFollowers = endFollowers; 
      console.log(`Current follower count: ${endFollowers}`);
    } catch (error) {
      console.log('Could not get current follower count from account info:', error.message);
      // Set default values if method fails
      startFollowers = 0;
      endFollowers = 0;
      averageFollowers = 0;
      console.log('Using default follower count values of 0');
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
        
        // Note: website_clicks is not available for individual post insights
        // It's only available at the account level, which we fetch separately
      });
    }

    const getAccountMetricTotal = (metricName) => {
        const metric = accountInsights.data.find(m => m.name === metricName);
        
        // Handle total_value format (for metrics like profile_views, website_clicks)
        if (metric?.total_value?.value !== undefined) {
            return metric.total_value.value;
        }
        
        // Handle values array format (for metrics like reach)
        if (metric?.values && Array.isArray(metric.values) && metric.values.length > 0) {
            if (metric.period === 'day') {
                // Sum values across all daily entries
                return metric.values.reduce((sum, day) => sum + (day.value || 0), 0);
            } else {
                // Single value
                return metric.values[0]?.value || 0;
            }
        }
        
        // Fallback
        return 0;
    };

    // Note: get_directions_clicks, email_contacts, phone_call_clicks, text_message_clicks are not available in Instagram API
    // These metrics are not supported for Instagram Business accounts

    const totalReach = getAccountMetricTotal('reach');
    
    // Use Total Reach for engagement rate calculation denominator
    const engagementRatePercentage = totalReach > 0 ? (totalEngagementsNumerator / totalReach) * 100 : 0;
    
    const totalProfileViews = getAccountMetricTotal('profile_views');

    console.log('Engagement calculation details:');
    console.log(`  Total Engagements Numerator (Likes + Comments + Saved + Shares from posts): ${totalEngagementsNumerator}`);
    console.log(`  Total Reach (denominator): ${totalReach}`);
    console.log(`  Engagement rate (based on Reach): ${engagementRatePercentage}%`);
    console.log(`  Total profile views: ${totalProfileViews}`);
    console.log(`  Total other contact clicks from insights: ${totalOtherContactClicks}`);

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
      posts: {
        count: postsData.data?.length || 0,
        data: postsData.data || []
      },
      conversions: { 
        websiteClicks: null, // Not available in Instagram API
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

  /**
   * Get Instagram followers data for a specific period
   */
  async getFollowers(pageId, startDate, endDate) {
    console.log('📊 Fetching followers data...');
    
    try {
      const followersData = await this.getInstagramInsights(
        ['follower_count'],
        'day',
        this.instagramBusinessAccountId,
        startDate,
        endDate
      );
      
      console.log('✅ Followers data fetched successfully');
      return {
        success: true,
        data: followersData,
        period: { startDate, endDate }
      };
    } catch (error) {
      console.log('❌ Error fetching followers:', error.message);
      throw error;
    }
  }

  /**
   * Get Instagram profile views for a specific period
   */
  async getProfileViews(pageId, startDate, endDate) {
    console.log('📊 Fetching profile views data...');
    
    try {
      const profileViewsData = await this.getInstagramInsights(
        ['profile_views'],
        'day',
        this.instagramBusinessAccountId,
        startDate,
        endDate
      );
      
      console.log('✅ Profile views data fetched successfully');
      return {
        success: true,
        data: profileViewsData,
        period: { startDate, endDate }
      };
    } catch (error) {
      console.log('❌ Error fetching profile views:', error.message);
      throw error;
    }
  }

  /**
   * Get Instagram posts and engagement data for a specific period
   */
  async getPosts(pageId, startDate, endDate) {
    console.log('📊 Fetching posts and engagement data...');
    
    try {
      const postsData = await this.getInstagramPosts(
        100, // limit
        this.instagramBusinessAccountId,
        startDate,
        endDate
      );
      
      console.log('✅ Posts data fetched successfully');
      return {
        success: true,
        data: postsData,
        period: { startDate, endDate }
      };
    } catch (error) {
      console.log('❌ Error fetching posts:', error.message);
      throw error;
    }
  }
}

module.exports = GraphAPI; 