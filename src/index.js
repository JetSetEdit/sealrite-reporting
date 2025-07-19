const express = require('express');
const cors = require('cors');
const GraphAPI = require('./graphApi');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
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

// Debug endpoint to test PDF generation with sample data
app.get('/api/debug/pdf-test', async (req, res) => {
  try {
    console.log('🔍 Testing PDF generation with sample data...');
    
    const sampleData = {
      followerGrowth: {
        percentage: 5.2,
        startCount: 1000,
        endCount: 1052,
        formula: '(End Followers - Start Followers) / Start Followers * 100'
      },
      engagementRate: {
        percentage: 2.5,
        totalEngagementsNumerator: 250,
        denominatorValue: 10000,
        formula: '(Likes + Comments + Saved + Shares) / Total Reach * 100',
        note: 'Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights.'
      },
      profileViews: {
        total: 1500,
        period: 'monthly'
      },
      reach: {
        total: 10000,
        period: 'monthly'
      },
      posts: {
        count: 12,
        data: []
      },
      conversions: {
        websiteClicks: null,
        otherContactClicks: 25
      },
      reportingPeriod: {
        start: '2025-06-01T00:00:00.000Z',
        end: '2025-06-30T00:00:00.000Z'
      }
    };

    const buffer = await generatePDFReport(sampleData, 'Test Month');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.send(buffer);
    
    console.log('✅ PDF test successful');
  } catch (error) {
    console.error('❌ PDF test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
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

// Export report endpoint
app.post('/api/export-report', async (req, res) => {
  try {
    const { format, data, month, monthName, preview = false } = req.body;
    
    console.log(`📊 Exporting ${monthName} report as ${format.toUpperCase()}${preview ? ' (PREVIEW)' : ''}`);
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided for export' });
    }

    let buffer;
    let contentType;
    let filename;

    switch (format.toLowerCase()) {
      case 'pdf':
        buffer = await generatePDFReport(data, monthName);
        contentType = 'application/pdf';
        filename = `instagram-report-${month}.pdf`;
        break;
      
      case 'xlsx':
        buffer = await generateExcelReport(data, monthName);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `instagram-report-${month}.xlsx`;
        break;
      
      case 'csv':
        buffer = await generateCSVReport(data, monthName);
        contentType = 'text/csv';
        filename = `instagram-report-${month}.csv`;
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }

    if (preview && format.toLowerCase() === 'pdf') {
      // For PDF preview, show in browser
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', 'inline');
      res.send(buffer);
    } else {
      // For download, force download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    }

  } catch (error) {
    console.error('❌ Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate PDF Report
async function generatePDFReport(data, monthName) {
  try {
    console.log('📄 Generating PDF report with jsPDF...');
    
    // Create a new PDF document
    const doc = new jsPDF();
    
    // Helper function to sanitize text and remove HTML tags
    const sanitizeText = (text) => {
      if (typeof text !== 'string') return String(text || 'N/A');
      // Remove HTML tags and decode entities
      return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };
    
    // Helper function to format numbers
    const formatNumber = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value.toLocaleString();
    };
    
    // Helper function to format percentages
    const formatPercentage = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Number(value).toFixed(2)}%`;
    };
    
    let yPosition = 20;
    
    // Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`Instagram Analytics Report - ${sanitizeText(monthName)}`, 20, yPosition);
    yPosition += 15;
    
    // Date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 20;
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Engagement Rate
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Engagement Rate (By Reach)', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPercentage(data.engagementRate?.percentage), 20, yPosition);
    yPosition += 20;
    
    // Key Metrics Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Metrics:', 20, yPosition);
    yPosition += 15;
    
    // Key Metrics - only include metrics that have actual data
    const metrics = [
      ['Total Engagements', formatNumber(data.engagementRate?.totalEngagementsNumerator)],
      ['Total Reach', formatNumber(data.engagementRate?.denominatorValue)],
      ['Profile Views', formatNumber(data.profileViews?.total)],
      ['Posts', formatNumber(data.posts?.count)],
      ['Follower Growth', formatPercentage(data.followerGrowth?.percentage)],
      ['Contact Clicks', formatNumber(data.conversions?.otherContactClicks)]
    ];
    
    // Only add website clicks if it has actual data (not null)
    if (data.conversions?.websiteClicks !== null && data.conversions?.websiteClicks !== undefined) {
      metrics.push(['Website Clicks', formatNumber(data.conversions?.websiteClicks)]);
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    metrics.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, 20, yPosition);
      yPosition += 12;
    });
    
    yPosition += 10;
    
    // Formula
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Formula:', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(77, 77, 77);
    doc.text(sanitizeText(data.engagementRate?.formula || '(Likes + Comments + Saved + Shares) / Total Reach * 100'), 20, yPosition);
    yPosition += 20;
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    
    // Reporting Period
    if (data.reportingPeriod) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporting Period:', 20, yPosition);
      yPosition += 15;
      
      const startDate = new Date(data.reportingPeriod.start).toLocaleDateString();
      const endDate = new Date(data.reportingPeriod.end).toLocaleDateString();
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${startDate} - ${endDate}`, 20, yPosition);
      yPosition += 20;
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by SealRite Reporting System', 20, 280);
    
    console.log('✅ PDF report generated successfully with jsPDF');
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('❌ Error generating PDF report:', error);
    throw error;
  }
}

// Generate Excel Report
async function generateExcelReport(data, monthName) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Instagram Analytics');
  
  // Helper function to sanitize text and remove HTML tags
  const sanitizeText = (text) => {
    if (typeof text !== 'string') return String(text || 'N/A');
    // Remove HTML tags and decode entities
    return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };
  
  // Helper function to format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };
  
  // Helper function to format percentages
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toFixed(2)}%`;
  };
  
  // Title
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = `Instagram Analytics Report - ${sanitizeText(monthName)}`;
  worksheet.getCell('A1').font = { bold: true, size: 16 };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  // Engagement Rate Section
  worksheet.getCell('A3').value = 'Engagement Rate (By Reach)';
  worksheet.getCell('A3').font = { bold: true, size: 14 };
  
  worksheet.getCell('A4').value = formatPercentage(data.engagementRate?.percentage);
  worksheet.getCell('A4').font = { bold: true, size: 16 };
  
  // Key Metrics
  worksheet.getCell('A6').value = 'Key Metrics';
  worksheet.getCell('A6').font = { bold: true, size: 14 };
  
  const metrics = [
    ['Total Engagements', formatNumber(data.engagementRate?.totalEngagementsNumerator)],
    ['Total Reach', formatNumber(data.engagementRate?.denominatorValue)],
    ['Profile Views', formatNumber(data.profileViews?.total)],
    ['Posts', formatNumber(data.posts?.count)],
    ['Follower Growth', formatPercentage(data.followerGrowth?.percentage)],
    ['Contact Clicks', formatNumber(data.conversions?.otherContactClicks)]
  ];
  
  // Only add website clicks if it has actual data (not null)
  if (data.conversions?.websiteClicks !== null && data.conversions?.websiteClicks !== undefined) {
    metrics.push(['Website Clicks', formatNumber(data.conversions?.websiteClicks)]);
  }
  
  metrics.forEach(([label, value], index) => {
    const row = 7 + index;
    worksheet.getCell(`A${row}`).value = label;
    worksheet.getCell(`B${row}`).value = value;
    worksheet.getCell(`A${row}`).font = { bold: true };
  });
  
  // Formula
  const formulaRow = 7 + metrics.length + 2;
  worksheet.getCell(`A${formulaRow}`).value = 'Formula';
  worksheet.getCell(`A${formulaRow}`).font = { bold: true, size: 14 };
  
  worksheet.getCell(`A${formulaRow + 1}`).value = sanitizeText(data.engagementRate?.formula || '(Likes + Comments + Saved + Shares) / Total Reach * 100');
  
  // Reporting Period
  if (data.reportingPeriod) {
    const periodRow = formulaRow + 3;
    worksheet.getCell(`A${periodRow}`).value = 'Reporting Period';
    worksheet.getCell(`A${periodRow}`).font = { bold: true, size: 14 };
    
    const startDate = new Date(data.reportingPeriod.start).toLocaleDateString();
    const endDate = new Date(data.reportingPeriod.end).toLocaleDateString();
    worksheet.getCell(`A${periodRow + 1}`).value = `${startDate} - ${endDate}`;
  }
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 20;
  });
  
  return await workbook.xlsx.writeBuffer();
}

// Generate CSV Report
async function generateCSVReport(data, monthName) {
  const csvRows = [];
  
  // Helper function to sanitize text and remove HTML tags
  const sanitizeText = (text) => {
    if (typeof text !== 'string') return String(text || 'N/A');
    // Remove HTML tags and decode entities
    return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };
  
  // Helper function to format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };
  
  // Helper function to format percentages
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toFixed(2)}%`;
  };
  
  // Header
  csvRows.push(['Instagram Analytics Report', sanitizeText(monthName)]);
  csvRows.push([]);
  
  // Engagement Rate
  csvRows.push(['Engagement Rate (By Reach)', formatPercentage(data.engagementRate?.percentage)]);
  csvRows.push([]);
  
  // Key Metrics - only include metrics that have actual data
  csvRows.push(['Key Metrics', 'Value']);
  csvRows.push(['Total Engagements', formatNumber(data.engagementRate?.totalEngagementsNumerator)]);
  csvRows.push(['Total Reach', formatNumber(data.engagementRate?.denominatorValue)]);
  csvRows.push(['Profile Views', formatNumber(data.profileViews?.total)]);
  csvRows.push(['Posts', formatNumber(data.posts?.count)]);
  csvRows.push(['Follower Growth', formatPercentage(data.followerGrowth?.percentage)]);
  csvRows.push(['Contact Clicks', formatNumber(data.conversions?.otherContactClicks)]);
  
  // Only add website clicks if it has actual data (not null)
  if (data.conversions?.websiteClicks !== null && data.conversions?.websiteClicks !== undefined) {
    csvRows.push(['Website Clicks', formatNumber(data.conversions?.websiteClicks)]);
  }
  csvRows.push([]);
  
  // Formula
  csvRows.push(['Formula', sanitizeText(data.engagementRate?.formula || '(Likes + Comments + Saved + Shares) / Total Reach * 100')]);
  csvRows.push([]);
  
  // Reporting Period
  if (data.reportingPeriod) {
    const startDate = new Date(data.reportingPeriod.start).toLocaleDateString();
    const endDate = new Date(data.reportingPeriod.end).toLocaleDateString();
    csvRows.push(['Reporting Period', `${startDate} - ${endDate}`]);
  }
  
  // Convert to CSV string
  const csvContent = csvRows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
  
  return Buffer.from(csvContent, 'utf-8');
}

// Start server with proper error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 SealRite Reporting Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 API documentation available at http://localhost:${PORT}/api/instagram/kpis`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port or kill the process using this port.`);
    console.error(`💡 You can kill the process with: lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app; 