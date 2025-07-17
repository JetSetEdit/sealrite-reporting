const express = require('express');
const cors = require('cors');
const GraphAPI = require('./graphApi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize GraphAPI
const graphApi = new GraphAPI();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SealRite Reporting API is running',
    timestamp: new Date().toISOString()
  });
});

// Instagram KPIs endpoint
app.post('/api/instagram/kpis', async (req, res) => {
  try {
    const { pageId, startDate, endDate } = req.body;
    
    console.log(`📊 Fetching Instagram KPIs for page: ${pageId}`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    
    // Use the enhanced calculateInstagramKPIs method
    const kpis = await graphApi.calculateInstagramKPIs(
      null, // Use default Instagram Business Account ID from env
      startDate,
      endDate
    );
    
    console.log('✅ Instagram KPIs calculated successfully');
    
    res.json({
      success: true,
      instagram: {
        kpis: kpis
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching Instagram KPIs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Instagram posts endpoint
app.get('/api/instagram/posts', async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;
    
    console.log(`📸 Fetching Instagram posts (limit: ${limit})`);
    
    const posts = await graphApi.getInstagramPosts(
      parseInt(limit),
      null, // Use default Instagram Business Account ID from env
      startDate,
      endDate
    );
    
    console.log(`✅ Fetched ${posts.data?.length || 0} Instagram posts`);
    
    res.json({
      success: true,
      posts: posts.data || [],
      count: posts.data?.length || 0,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching Instagram posts:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Monthly data endpoint (comprehensive)
app.post('/api/monthly-data', async (req, res) => {
  try {
    const { pageId, startDate, endDate } = req.body;
    
    console.log(`📊 Fetching comprehensive monthly data for page: ${pageId}`);
    
    const monthlyData = await graphApi.getMonthlyData(
      pageId || process.env.FACEBOOK_PAGE_ID,
      startDate,
      endDate
    );
    
    console.log('✅ Monthly data fetched successfully');
    
    res.json({
      success: true,
      ...monthlyData
    });
    
  } catch (error) {
    console.error('❌ Error fetching monthly data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SealRite Reporting Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 API documentation available at http://localhost:${PORT}/api/instagram/kpis`);
});

module.exports = app; 