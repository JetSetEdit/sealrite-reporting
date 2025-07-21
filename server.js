const express = require('express');
const cors = require('cors');
const path = require('path');
const GraphAPI = require('./src/graphApi');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize GraphAPI instance
const graphAPI = new GraphAPI();

// Middleware
app.use(cors());
app.use(express.json());

// Set server timeouts to handle long-running API calls
app.use((req, res, next) => {
  // Set timeout to 5 minutes for all requests
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Sample data for demonstration (fallback when real API fails)
const sampleData = {
  march: {
    followerGrowth: {
      percentage: 8.5,
      startCount: 1150,
      endCount: 1250,
      formula: "(End Followers - Start Followers) / Start Followers * 100"
    },
    engagementRate: {
      percentage: 10.25,
      totalEngagementsNumerator: 1602,
      denominatorValue: 15420,
      formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
      note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
    },
    profileViews: {
      total: 890,
      period: "monthly"
    },
    reach: {
      total: 15420,
      period: "monthly"
    },
    impressions: {
      total: 23450,
      period: "monthly"
    },
    posts: {
      count: 12,
      data: []
    },
    conversions: {
      websiteClicks: 156,
      otherContactClicks: 23
    },
    reportingPeriod: {
      start: "2025-03-01T00:00:00.000Z",
      end: "2025-03-31T23:59:59.999Z"
    }
  },
  april: {
    followerGrowth: {
      percentage: 10.4,
      startCount: 1250,
      endCount: 1380,
      formula: "(End Followers - Start Followers) / Start Followers * 100"
    },
    engagementRate: {
      percentage: 10.55,
      totalEngagementsNumerator: 1924,
      denominatorValue: 18230,
      formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
      note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
    },
    profileViews: {
      total: 1020,
      period: "monthly"
    },
    reach: {
      total: 18230,
      period: "monthly"
    },
    impressions: {
      total: 28760,
      period: "monthly"
    },
    posts: {
      count: 15,
      data: []
    },
    conversions: {
      websiteClicks: 189,
      otherContactClicks: 34
    },
    reportingPeriod: {
      start: "2025-04-01T00:00:00.000Z",
      end: "2025-04-30T23:59:59.999Z"
    }
  },
  may: {
    followerGrowth: {
      percentage: 10.1,
      startCount: 1380,
      endCount: 1520,
      formula: "(End Followers - Start Followers) / Start Followers * 100"
    },
    engagementRate: {
      percentage: 10.85,
      totalEngagementsNumerator: 2379,
      denominatorValue: 21560,
      formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
      note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
    },
    profileViews: {
      total: 1280,
      period: "monthly"
    },
    reach: {
      total: 21560,
      period: "monthly"
    },
    impressions: {
      total: 34210,
      period: "monthly"
    },
    posts: {
      count: 18,
      data: []
    },
    conversions: {
      websiteClicks: 234,
      otherContactClicks: 45
    },
    reportingPeriod: {
      start: "2025-05-01T00:00:00.000Z",
      end: "2025-05-31T23:59:59.999Z"
    }
  },
  june: {
    followerGrowth: {
      percentage: 10.5,
      startCount: 1520,
      endCount: 1680,
      formula: "(End Followers - Start Followers) / Start Followers * 100"
    },
    engagementRate: {
      percentage: 11.15,
      totalEngagementsNumerator: 2847,
      denominatorValue: 24890,
      formula: "(Likes + Comments + Saved + Shares) / Total Reach * 100",
      note: "Rate is based on Total Reach. Numerator includes Likes, Comments, Saves, and Shares where available from post insights."
    },
    profileViews: {
      total: 1560,
      period: "monthly"
    },
    reach: {
      total: 24890,
      period: "monthly"
    },
    impressions: {
      total: 39870,
      period: "monthly"
    },
    posts: {
      count: 22,
      data: []
    },
    conversions: {
      websiteClicks: 289,
      otherContactClicks: 56
    },
    reportingPeriod: {
      start: "2025-06-01T00:00:00.000Z",
      end: "2025-06-30T23:59:59.999Z"
    }
  }
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Instagram Analytics API is running' });
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
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Accept-Ranges', 'bytes');
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

// Alternative debug endpoint that returns HTML with embedded PDF
app.get('/api/debug/pdf-test-html', async (req, res) => {
  try {
    console.log('🔍 Testing PDF generation with HTML wrapper...');
    
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
    const base64PDF = buffer.toString('base64');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PDF Preview - Test Month</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
          .pdf-container { width: 100%; height: 90vh; border: 1px solid #ccc; }
          .header { margin-bottom: 20px; }
          .download-link { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PDF Preview - Test Month</h1>
          <a href="data:application/pdf;base64,${base64PDF}" download="test-report.pdf" class="download-link">Download PDF</a>
        </div>
        <div class="pdf-container">
          <embed src="data:application/pdf;base64,${base64PDF}" type="application/pdf" width="100%" height="100%">
        </div>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
    
    console.log('✅ PDF HTML test successful');
  } catch (error) {
    console.error('❌ PDF HTML test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
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
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Accept-Ranges', 'bytes');
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
    console.log('📄 Generating PDF report with Puppeteer...');
    
    // Helper function to sanitize text and remove HTML tags
    const sanitizeText = (text) => {
      if (typeof text !== 'string') return String(text || 'N/A');
      return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };

    const formatNumber = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return value.toLocaleString();
    };

    const formatPercentage = (value) => {
      if (value === null || value === undefined) return 'N/A';
      return `${Number(value).toFixed(2)}%`;
    };

    // Create HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Instagram Analytics Report - ${sanitizeText(monthName)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
          }
          .date {
            font-size: 14px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .metric {
            margin-bottom: 10px;
            padding: 8px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .metric-label {
            font-weight: bold;
            color: #495057;
          }
          .metric-value {
            font-size: 18px;
            color: #007bff;
            margin-left: 10px;
          }
          .formula {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            color: #495057;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Instagram Analytics Report - ${sanitizeText(monthName)}</div>
          <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Engagement Rate (By Reach)</div>
          <div class="metric">
            <span class="metric-label">Engagement Rate:</span>
            <span class="metric-value">${formatPercentage(data.engagementRate?.percentage)}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Key Metrics</div>
          <div class="metric">
            <span class="metric-label">Total Engagements:</span>
            <span class="metric-value">${formatNumber(data.engagementRate?.totalEngagementsNumerator)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Total Reach:</span>
            <span class="metric-value">${formatNumber(data.engagementRate?.denominatorValue)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Profile Views:</span>
            <span class="metric-value">${formatNumber(data.profileViews?.total)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Posts:</span>
            <span class="metric-value">${formatNumber(data.posts?.count)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Follower Growth:</span>
            <span class="metric-value">${formatPercentage(data.followerGrowth?.percentage)}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Contact Clicks:</span>
            <span class="metric-value">${formatNumber(data.conversions?.otherContactClicks)}</span>
          </div>
          ${data.conversions?.websiteClicks !== null && data.conversions?.websiteClicks !== undefined ? 
            `<div class="metric">
              <span class="metric-label">Website Clicks:</span>
              <span class="metric-value">${formatNumber(data.conversions?.websiteClicks)}</span>
            </div>` : ''
          }
        </div>

        <div class="section">
          <div class="section-title">Formula</div>
          <div class="formula">
            ${sanitizeText(data.engagementRate?.formula || '(Likes + Comments + Saved + Shares) / Total Reach * 100')}
          </div>
        </div>

        ${data.reportingPeriod ? `
        <div class="section">
          <div class="section-title">Reporting Period</div>
          <div class="metric">
            <span class="metric-label">From:</span>
            <span class="metric-value">${new Date(data.reportingPeriod.start).toLocaleDateString()}</span>
          </div>
          <div class="metric">
            <span class="metric-label">To:</span>
            <span class="metric-value">${new Date(data.reportingPeriod.end).toLocaleDateString()}</span>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          Generated by SealRite Reporting System
        </div>
      </body>
      </html>
    `;

    // Launch browser and generate PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();
    
    console.log('✅ PDF report generated successfully with Puppeteer');
    return pdfBuffer;
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
  
  // Key Metrics - only include metrics that have actual data
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

app.post('/api/instagram/kpis', async (req, res) => {
  const { startDate, endDate, pageId, forceRefresh = false } = req.body;
  
  try {
    console.log(`📊 Fetching Instagram KPIs for period: ${startDate} to ${endDate}${forceRefresh ? ' (force refresh)' : ''}`);
    
    // Use real API calls with our GraphAPI class
    const kpisData = await graphAPI.calculateInstagramKPIs(
      null, // instagramBusinessAccountId (will use from env)
      startDate,
      endDate,
      forceRefresh // Pass forceRefresh flag to bypass cache if needed
    );
    
    console.log('✅ Successfully fetched real Instagram KPIs');
    
    res.json({
      instagram: {
        kpis: kpisData,
        cacheStatus: forceRefresh ? 'fresh' : 'cached',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching real Instagram KPIs:', error.message);
    console.error('🔍 Full error details:', error);
    console.error('📋 Error stack trace:', error.stack);
    
    // Enhanced error response with more details
    const errorResponse = {
      error: 'Failed to fetch Instagram data',
      message: error.message,
      timestamp: new Date().toISOString(),
      request: {
        startDate,
        endDate,
        pageId,
        forceRefresh
      }
    };
    
    // Fallback to sample data if real API fails
    console.log('🔄 Falling back to sample data...');
    
    const start = new Date(startDate);
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june'];
    const month = monthNames[start.getMonth()];
    
    if (!sampleData[month]) {
      return res.status(400).json({ 
        ...errorResponse,
        error: 'No data available for this period'
      });
    }
    
    res.json({
      instagram: {
        kpis: sampleData[month],
        note: 'Using sample data due to API error',
        cacheStatus: 'fallback',
        timestamp: new Date().toISOString()
      }
    });
  }
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