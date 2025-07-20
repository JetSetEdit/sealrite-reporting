const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { format, data, month, monthName, preview = false } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No data provided for export' });
  }

  try {
    let buffer;
    let contentType;
    let filename;

    if (format === 'pdf') {
      buffer = await generatePDFReport(data, monthName);
      contentType = 'application/pdf';
      filename = `instagram-report-${month}.pdf`;
    } else if (format === 'xlsx') {
      buffer = await generateExcelReport(data, monthName);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `instagram-report-${month}.xlsx`;
    } else if (format === 'csv') {
      buffer = await generateCSVReport(data, monthName);
      contentType = 'text/csv';
      filename = `instagram-report-${month}.csv`;
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
};

async function generatePDFReport(data, monthName) {
  const sanitizeText = (text) => {
    if (!text) return '';
    return text.toString().replace(/[<>]/g, '');
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Instagram Analytics Report - ${monthName}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 40px;
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #667eea;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2d3748;
          margin: 0;
          font-size: 2.5rem;
          font-weight: 700;
        }
        .header .subtitle {
          color: #718096;
          font-size: 1.2rem;
          margin-top: 10px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-bottom: 40px;
        }
        .metric-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .metric-card h3 {
          margin: 0 0 15px 0;
          color: #2d3748;
          font-size: 1.3rem;
          font-weight: 600;
        }
        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 5px;
        }
        .metric-label {
          color: #718096;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .metric-formula {
          font-size: 0.8rem;
          color: #a0aec0;
          margin-top: 10px;
          font-style: italic;
        }
        .engagement-breakdown {
          margin-top: 20px;
        }
        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .breakdown-item {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .breakdown-icon {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }
        .breakdown-value {
          font-size: 1.2rem;
          font-weight: 600;
          color: #2d3748;
        }
        .breakdown-label {
          font-size: 0.8rem;
          color: #718096;
          margin-top: 5px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #a0aec0;
          font-size: 0.9rem;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .metric-card { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 Instagram Analytics Report</h1>
        <div class="subtitle">${monthName}</div>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>📈 Engagement Rate</h3>
          <div class="metric-value">${formatPercentage(data.engagementRate?.percentage)}</div>
          <div class="metric-label">Engagement Rate</div>
          <div class="metric-formula">${sanitizeText(data.engagementRate?.formula)}</div>
          <div class="engagement-breakdown">
            <div class="breakdown-grid">
              <div class="breakdown-item">
                <div class="breakdown-icon">👍</div>
                <div class="breakdown-value">${formatNumber(data.engagementRate?.totalEngagementsNumerator)}</div>
                <div class="breakdown-label">Total Engagements</div>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-icon">👁️</div>
                <div class="breakdown-value">${formatNumber(data.engagementRate?.denominatorValue)}</div>
                <div class="breakdown-label">Total Reach</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="metric-card">
          <h3>👥 Followers</h3>
          <div class="metric-value">${formatNumber(data.followerGrowth?.endCount)}</div>
          <div class="metric-label">Current Followers</div>
          <div class="metric-formula">${formatPercentage(data.followerGrowth?.percentage)} growth</div>
        </div>
        
        <div class="metric-card">
          <h3>👁️ Profile Views</h3>
          <div class="metric-value">${formatNumber(data.profileViews?.total)}</div>
          <div class="metric-label">Profile Views</div>
        </div>
        
        <div class="metric-card">
          <h3>📝 Posts</h3>
          <div class="metric-value">${data.posts?.data?.length || 0}</div>
          <div class="metric-label">Total Posts</div>
        </div>
      </div>
      
      <div class="footer">
        <p>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Data provided by Instagram Graph API</p>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  const pdf = await page.pdf({
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
  return pdf;
}

async function generateExcelReport(data, monthName) {
  const sanitizeText = (text) => {
    if (!text) return '';
    return text.toString().replace(/[<>]/g, '');
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Instagram Analytics');

  // Add title
  worksheet.addRow(['Instagram Analytics Report']);
  worksheet.addRow([monthName]);
  worksheet.addRow([]);

  // Add metrics
  worksheet.addRow(['Metric', 'Value', 'Details']);
  worksheet.addRow(['Engagement Rate', formatPercentage(data.engagementRate?.percentage), sanitizeText(data.engagementRate?.formula)]);
  worksheet.addRow(['Total Engagements', formatNumber(data.engagementRate?.totalEngagementsNumerator), '']);
  worksheet.addRow(['Total Reach', formatNumber(data.engagementRate?.denominatorValue), '']);
  worksheet.addRow(['Followers', formatNumber(data.followerGrowth?.endCount), '']);
  worksheet.addRow(['Follower Growth', formatPercentage(data.followerGrowth?.percentage), '']);
  worksheet.addRow(['Profile Views', formatNumber(data.profileViews?.total), '']);
  worksheet.addRow(['Total Posts', data.posts?.data?.length || 0, '']);

  // Style the worksheet
  worksheet.getRow(1).font = { bold: true, size: 16 };
  worksheet.getRow(2).font = { bold: true, size: 14 };
  worksheet.getRow(4).font = { bold: true };

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = Math.max(column.width || 0, 20);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function generateCSVReport(data, monthName) {
  const sanitizeText = (text) => {
    if (!text) return '';
    return text.toString().replace(/[<>]/g, '').replace(/"/g, '""');
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const csvContent = [
    ['Instagram Analytics Report', monthName],
    [''],
    ['Metric', 'Value', 'Details'],
    ['Engagement Rate', formatPercentage(data.engagementRate?.percentage), sanitizeText(data.engagementRate?.formula)],
    ['Total Engagements', formatNumber(data.engagementRate?.totalEngagementsNumerator), ''],
    ['Total Reach', formatNumber(data.engagementRate?.denominatorValue), ''],
    ['Followers', formatNumber(data.followerGrowth?.endCount), ''],
    ['Follower Growth', formatPercentage(data.followerGrowth?.percentage), ''],
    ['Profile Views', formatNumber(data.profileViews?.total), ''],
    ['Total Posts', data.posts?.data?.length || 0, '']
  ].map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
  
  return Buffer.from(csvContent, 'utf-8');
} 