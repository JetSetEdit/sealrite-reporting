const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data for demonstration (you can replace this with real API calls)
const sampleData = {
  march: {
    reach: 15420,
    impressions: 23450,
    followerCount: 1250,
    profileViews: 890,
    websiteClicks: 156,
    engagementRate: {
      totalLikes: 1234,
      totalComments: 89,
      totalSaved: 234,
      totalShares: 45,
      percentage: 10.25,
      note: "Based on total reach"
    }
  },
  april: {
    reach: 18230,
    impressions: 28760,
    followerCount: 1380,
    profileViews: 1020,
    websiteClicks: 189,
    engagementRate: {
      totalLikes: 1456,
      totalComments: 112,
      totalSaved: 289,
      totalShares: 67,
      percentage: 10.55,
      note: "Based on total reach"
    }
  },
  may: {
    reach: 21560,
    impressions: 34210,
    followerCount: 1520,
    profileViews: 1280,
    websiteClicks: 234,
    engagementRate: {
      totalLikes: 1789,
      totalComments: 145,
      totalSaved: 356,
      totalShares: 89,
      percentage: 10.85,
      note: "Based on total reach"
    }
  },
  june: {
    reach: 24890,
    impressions: 39870,
    followerCount: 1680,
    profileViews: 1560,
    websiteClicks: 289,
    engagementRate: {
      totalLikes: 2134,
      totalComments: 178,
      totalSaved: 423,
      totalShares: 112,
      percentage: 11.15,
      note: "Based on total reach"
    }
  }
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Instagram Analytics API is running' });
});

app.get('/api/instagram/summary', (req, res) => {
  const { month = 'june' } = req.query;
  
  if (!sampleData[month]) {
    return res.status(400).json({ error: 'Invalid month' });
  }
  
  res.json({
    month,
    data: sampleData[month]
  });
});

app.get('/api/instagram/all-months', (req, res) => {
  res.json({
    months: Object.keys(sampleData),
    data: sampleData
  });
});

app.post('/api/instagram/kpis', (req, res) => {
  const { startDate, endDate } = req.body;
  
  // Determine which month based on the date range
  const start = new Date(startDate);
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june'];
  const month = monthNames[start.getMonth()];
  
  if (!sampleData[month]) {
    return res.status(400).json({ error: 'No data available for this period' });
  }
  
  res.json({
    instagram: {
      kpis: sampleData[month]
    }
  });
});

// Serve static files from the dashboard
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard/build')));

// Catch-all handler for React app
app.get('/dashboard/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/build', 'index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Instagram Analytics API',
    endpoints: {
      health: '/api/health',
      summary: '/api/instagram/summary?month=june',
      allMonths: '/api/instagram/all-months',
      kpis: '/api/instagram/kpis (POST)',
      dashboard: '/dashboard'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard`);
  console.log(`🔗 API health check: http://localhost:${PORT}/api/health`);
}); 