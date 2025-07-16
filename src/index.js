const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const GraphAPI = require('./graphApi');
const ReportGenerator = require('./reportGenerator');
const moment = require('moment');
const { body, validationResult } = require('express-validator');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve static files from the dashboard build directory
app.use(express.static(path.join(__dirname, '../dashboard/build')));

// Initialize Graph API and Report Generator
const graphApi = new GraphAPI();
const reportGenerator = new ReportGenerator();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get available metrics
app.get('/api/metrics', (req, res) => {
  const metrics = {
    facebook: [
      'page_impressions',
      'page_engaged_users',
      'page_post_engagements',
      'page_followers',
      'page_views_total',
      'page_fans_city',
      'page_fans_country',
      'page_fans_gender_age'
    ],
    instagram: [
      'impressions',
      'reach',
      'profile_views',
      'follower_count',
      'email_contacts',
      'get_directions_clicks',
      'phone_call_clicks',
      'text_message_clicks',
      'website_clicks'
    ]
  };
  
  res.json(metrics);
});

// Fetch data from Graph API
app.post(
  '/api/fetch-data',
  [body('pageId').notEmpty().withMessage('Page ID is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { pageId, includeInstagram = true, month } = req.body;

      logger.info(`Fetching data for page: ${pageId}${month ? ` for month: ${month}` : ''}`);
    
    // Calculate date range for the specified month
    let startDate = null;
    let endDate = null;
    
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      startDate = new Date(year, monthNum - 1, 1).toISOString();
      endDate = new Date(year, monthNum, 0).toISOString();
      logger.info(`Date range: ${startDate} to ${endDate}`);
    }
    
    const data = await graphApi.getMonthlyData(pageId, startDate, endDate);
    
    res.json({
      success: true,
      data,
      fetchedAt: new Date().toISOString(),
      month: month || 'current'
    });
  } catch (error) {
    logger.error(`Error fetching data: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch data',
      message: error.message
    });
  }
});

// Generate monthly report
app.post(
  '/api/generate-report',
  [
    body('pageId').notEmpty().withMessage('Page ID is required'),
    body('pageName').notEmpty().withMessage('Page Name is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { pageId, pageName, month, data } = req.body;

    // If data is not provided, fetch it
    let reportData = data;
    if (!reportData) {
      logger.info(`Fetching data for report generation: ${pageId}`);
      reportData = await graphApi.getMonthlyData(pageId);
    }

    // Use current month if not specified
    const reportMonth = month || moment().format('YYYY-MM');
    
    logger.info(`Generating report for ${pageName} - ${reportMonth}`);
    const reportFiles = await reportGenerator.generateComprehensiveReport(
      reportData,
      pageName,
      reportMonth
    );

    res.json({
      success: true,
      message: 'Report generated successfully',
      files: reportFiles
    });
  } catch (error) {
    logger.error(`Error generating report: ${error.message}`);
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

// Get specific Facebook insights
app.get('/api/facebook/:pageId/insights', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { metrics, period = 'month' } = req.query;
    
    const metricsArray = metrics ? metrics.split(',') : [
      'page_impressions',
      'page_engaged_users',
      'page_post_engagements',
      'page_followers'
    ];

    const insights = await graphApi.getFacebookPageInsights(pageId, metricsArray, period);
    res.json(insights);
  } catch (error) {
    logger.error(`Error fetching Facebook insights: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch Facebook insights',
      message: error.message
    });
  }
});

// Get Instagram insights
app.get('/api/instagram/insights', async (req, res) => {
  try {
    const { metrics, period = 'month' } = req.query;
    
    const metricsArray = metrics ? metrics.split(',') : [
      'impressions',
      'reach',
      'profile_views',
      'follower_count'
    ];

    const insights = await graphApi.getInstagramInsights(metricsArray, period);
    res.json(insights);
  } catch (error) {
    logger.error(`Error fetching Instagram insights: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch Instagram insights',
      message: error.message
    });
  }
});

// Get posts from Facebook
app.get('/api/facebook/:pageId/posts', async (req, res) => {
  try {
    const { pageId } = req.params;
    const { limit = 25 } = req.query;
    
    const posts = await graphApi.getFacebookPosts(pageId, parseInt(limit));
    res.json(posts);
  } catch (error) {
    logger.error(`Error fetching Facebook posts: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch Facebook posts',
      message: error.message
    });
  }
});

// Get Instagram posts
app.get('/api/instagram/posts', async (req, res) => {
  try {
    const { limit = 25 } = req.query;
    
    const posts = await graphApi.getInstagramPosts(parseInt(limit));
    res.json(posts);
  } catch (error) {
    logger.error(`Error fetching Instagram posts: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch Instagram posts',
      message: error.message
    });
  }
});

// Get available pages for the user
app.get('/api/pages', async (req, res) => {
  try {
    // Fetch pages from Facebook Graph API
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: 'FACEBOOK_ACCESS_TOKEN not set in environment' });
    }
    const axios = require('axios');
    const response = await axios.get('https://graph.facebook.com/v22.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,category,fan_count,followers_count'
      }
    });
    const allPages = response.data.data;
    if (!allPages || allPages.length === 0) {
      return res.status(404).json({ error: 'No pages found. Make sure your access token has the correct permissions.' });
    }
    
    // Filter to only show "Sealrite WSM by OptiSeal"
    const pages = allPages.filter(page => page.name === 'Sealrite WSM by OptiSeal');
    
    if (pages.length === 0) {
      return res.status(404).json({ error: 'Sealrite WSM by OptiSeal page not found.' });
    }
    
    res.json(pages);
  } catch (error) {
    logger.error(`Error fetching pages: ${error.response?.data?.error || error.message}`);
    res.status(500).json({
      error: 'Failed to fetch pages',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error(`Unhandled error: ${error.message}`);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler - serve React app for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/build/index.html'));
});

// Start server
app.listen(PORT, () => {
  logger.info(`SealRite Reporting Server running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API documentation available at http://localhost:${PORT}/api/metrics`);
});

module.exports = app; 