import React, { useState, useEffect, useCallback } from 'react';
import './ReportCard.css';

const ReportCard = () => {
  const [reportData, setReportData] = useState(null);
  const [cachedData, setCachedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [exporting, setExporting] = useState(false);

  const months = ['may', 'june', 'current'];
  const monthNames = {
    'may': 'May 2025',
    'june': 'June 2025',
    'current': 'Last 30 Days'
  };

  const getMonthDateRange = (month) => {
    if (month === 'current') {
      // For current period, use last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    } else {
      // For specific months
      const currentYear = 2025;
      const monthMap = {
        'may': 4,   // May (0-indexed: 4)
        'june': 5   // June (0-indexed: 5)
      };
      
      const monthIndex = monthMap[month];
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0); // Last day of the month
      
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }
  };

  const fetchReportData = useCallback(async (forceRefresh = false) => {
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    
    // If we have cached data and not forcing refresh, show it immediately
    if (cachedData && !forceRefresh) {
      setReportData(cachedData);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/instagram/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
          startDate: startDate,
          endDate: endDate,
          forceRefresh: forceRefresh // Add flag for backend to bypass cache if needed
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const kpisData = data.instagram?.kpis;
      
      if (kpisData) {
        setReportData(kpisData);
        setCachedData(kpisData);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error('No data received from API');
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message);
      // If we have cached data, keep showing it even on error
      if (!cachedData) {
        setReportData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, cachedData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData(true);
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleExport = async (format, preview = false) => {
    if (!reportData) {
      alert('No data available to export');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('http://localhost:3001/api/export-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: format,
          data: reportData,
          month: selectedMonth,
          monthName: monthNames[selectedMonth],
          preview: preview
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response type:', response.type);

      if (preview && format === 'pdf') {
        // For PDF preview, open in new tab with HTML wrapper
        try {
          console.log('Creating PDF preview...');
          const blob = await response.blob();
          console.log('Blob created:', blob);
          const url = window.URL.createObjectURL(blob);
          console.log('URL created:', url);
          
          // Create a new window with HTML wrapper
          const newWindow = window.open('', '_blank');
          const base64PDF = await blobToBase64(blob);
          
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>PDF Preview - ${monthNames[selectedMonth]}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
                .pdf-container { width: 100%; height: 90vh; border: 1px solid #ccc; background: white; }
                .header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                .download-link { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                .close-btn { padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>PDF Preview - ${monthNames[selectedMonth]}</h1>
                <div>
                  <a href="data:application/pdf;base64,${base64PDF}" download="instagram-report-${selectedMonth}.pdf" class="download-link">Download PDF</a>
                  <button onclick="window.close()" class="close-btn">Close</button>
                </div>
              </div>
              <div class="pdf-container">
                <embed src="data:application/pdf;base64,${base64PDF}" type="application/pdf" width="100%" height="100%">
              </div>
            </body>
            </html>
          `);
          newWindow.document.close();
          
          window.URL.revokeObjectURL(url);
          alert('PDF preview opened in new tab');
        } catch (previewError) {
          console.error('PDF preview error:', previewError);
          alert(`PDF preview failed: ${previewError.message}`);
        }
      } else {
        // For download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `instagram-report-${selectedMonth}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert(`Report exported successfully as ${format.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, fetchReportData]);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatLastUpdated = (date) => {
    if (!date) return null;
    return date.toLocaleString();
  };

  // Calculate detailed engagement breakdown from posts data
  const calculateEngagementBreakdown = () => {
    if (!reportData?.posts?.data) return null;
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalSaved = 0;
    let totalShares = 0;
    
    reportData.posts.data.forEach(post => {
      // Get values from post insights data
      const getPostInsightValue = (metricName, fallbackValue = 0) => {
        const insight = post.insights?.data?.find(i => i.name === metricName);
        return insight?.values?.[0]?.value || fallbackValue;
      };
      
      totalLikes += getPostInsightValue('likes', post.like_count);
      totalComments += getPostInsightValue('comments', post.comments_count);
      totalSaved += getPostInsightValue('saved');
      totalShares += getPostInsightValue('shares');
    });
    
    return {
      likes: totalLikes,
      comments: totalComments,
      saved: totalSaved,
      shares: totalShares,
      total: totalLikes + totalComments + totalSaved + totalShares
    };
  };

  // Show skeleton loading state
  if (loading && !reportData) {
    return (
      <div className="report-card loading">
        <div className="card-header">
          <h3>📊 Instagram Analytics Report</h3>
          <div className="loading-spinner"></div>
        </div>
        <div className="card-content">
          <div className="skeleton-grid">
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
          </div>
          <p className="loading-text">Loading fresh data from Instagram...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !reportData) {
    return (
      <div className="report-card error">
        <div className="card-header">
          <h3>📊 Instagram Analytics Report</h3>
        </div>
        <div className="card-content">
          <div className="error-icon">⚠️</div>
          <p className="error-message">Error loading data: {error}</p>
          <div className="error-actions">
            <button onClick={() => fetchReportData(true)} className="retry-button">
              🔄 Retry
            </button>
            {cachedData && (
              <button onClick={() => setReportData(cachedData)} className="use-cached-button">
                📋 Use Cached Data
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!reportData) {
    return (
      <div className="report-card no-data">
        <div className="card-header">
          <h3>📊 Instagram Analytics Report</h3>
        </div>
        <div className="card-content">
          <div className="no-data-icon">📊</div>
          <p>No report data available</p>
          <button onClick={() => fetchReportData(true)} className="retry-button">
            🔄 Load Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-card">
      <div className="card-header">
        <div className="header-top">
          <h3>📊 Instagram Analytics Report</h3>
          <div className="header-controls">
            <div className="metric-icon">📈</div>
            {refreshing && <div className="refresh-spinner"></div>}
            <div className="export-controls">
              <button 
                onClick={() => handleExport('pdf', true)} 
                className="export-button preview"
                disabled={loading || refreshing || exporting}
                title="Preview PDF in browser"
              >
                👁️ Preview
              </button>
              <button 
                onClick={() => handleExport('pdf')} 
                className="export-button pdf"
                disabled={loading || refreshing || exporting}
                title="Export as PDF"
              >
                📄 PDF
              </button>
              <button 
                onClick={() => handleExport('xlsx')} 
                className="export-button excel"
                disabled={loading || refreshing || exporting}
                title="Export as Excel"
              >
                📊 Excel
              </button>
              <button 
                onClick={() => handleExport('csv')} 
                className="export-button csv"
                disabled={loading || refreshing || exporting}
                title="Export as CSV"
              >
                📋 CSV
              </button>
            </div>
          </div>
        </div>
        <div className="month-selector">
          <label htmlFor="month-select">Select Month:</label>
          <select 
            id="month-select"
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-dropdown"
            disabled={loading}
          >
            {months.map(month => (
              <option key={month} value={month}>
                {monthNames[month]}
              </option>
            ))}
          </select>
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            disabled={loading || refreshing}
            title="Refresh data from Instagram"
          >
            🔄
          </button>
        </div>
        <div className="report-period">
          {monthNames[selectedMonth]} Performance Report
          {lastUpdated && (
            <div className="last-updated">
              Last updated: {formatLastUpdated(lastUpdated)}
            </div>
          )}
        </div>
      </div>
      
      <div className="card-content">
        {refreshing && (
          <div className="refresh-indicator">
            <div className="refresh-spinner"></div>
            <span>Refreshing data...</span>
          </div>
        )}
        
        <div className="metrics-grid">
          <div className="metric-item primary">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(reportData.followerGrowth?.endCount)}</div>
              <div className="metric-label">Followers</div>
            </div>
          </div>
          
          <div className="metric-item primary">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(reportData.reach?.total)}</div>
              <div className="metric-label">Total Reach</div>
            </div>
          </div>
          
          <div className="metric-item primary">
            <div className="metric-icon">👤</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(reportData.profileViews?.total)}</div>
              <div className="metric-label">Profile Views</div>
            </div>
          </div>
          
          <div className="metric-item primary">
            <div className="metric-icon">📸</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(reportData.posts?.count)}</div>
              <div className="metric-label">Posts</div>
            </div>
          </div>
        </div>

        <div className="engagement-section">
          <h4>💚 Engagement Metrics</h4>
          <div className="engagement-grid">
            <div className="engagement-item">
              <span className="label">Total Engagements:</span>
              <span className="value">{formatNumber(reportData.engagementRate?.totalEngagementsNumerator)}</span>
            </div>
            <div className="engagement-item">
              <span className="label">Total Reach:</span>
              <span className="value">{formatNumber(reportData.engagementRate?.denominatorValue)}</span>
            </div>
          </div>
          
          <div className="engagement-rate-highlight">
            <div className="rate-value">
              {formatPercentage(reportData.engagementRate?.percentage)}
            </div>
            <div className="rate-label">Engagement Rate</div>
            <div className="rate-formula">
              {reportData.engagementRate?.formula || '(Likes + Comments + Saved + Shares) ÷ Total Reach × 100'}
            </div>
          </div>
        </div>

        <div className="posts-section">
          <h4>📸 Posts Summary</h4>
          <div className="posts-summary">
            <div className="posts-count">
              <span className="label">Total Posts:</span>
              <span className="value">{reportData.posts?.count || 0}</span>
            </div>
            {reportData.posts?.count > 0 && (
              <div className="posts-breakdown">
                <h5>Engagement Breakdown:</h5>
                {(() => {
                  const breakdown = calculateEngagementBreakdown();
                  return breakdown ? (
                    <div className="breakdown-grid">
                      <div className="breakdown-item">
                        <span className="label">Likes:</span>
                        <span className="value">{formatNumber(breakdown.likes)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="label">Comments:</span>
                        <span className="value">{formatNumber(breakdown.comments)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="label">Saved:</span>
                        <span className="value">{formatNumber(breakdown.saved)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="label">Shares:</span>
                        <span className="value">{formatNumber(breakdown.shares)}</span>
                      </div>
                    </div>
                  ) : (
                    <p>No engagement data available</p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="conversions-section">
          <h4>🎯 Conversion Metrics</h4>
          <div className="conversions-grid">
            {reportData.conversions?.websiteClicks !== null && reportData.conversions?.websiteClicks !== undefined && (
              <div className="conversion-item">
                <div className="conversion-icon">🌐</div>
                <div className="conversion-content">
                  <div className="conversion-value">{formatNumber(reportData.conversions?.websiteClicks)}</div>
                  <div className="conversion-label">Website Clicks</div>
                </div>
              </div>
            )}
            <div className="conversion-item">
              <div className="conversion-icon">📞</div>
              <div className="conversion-content">
                <div className="conversion-value">{formatNumber(reportData.conversions?.otherContactClicks)}</div>
                <div className="conversion-label">Contact Clicks</div>
              </div>
            </div>
          </div>
        </div>

        <div className="report-footer">
          <div className="report-period-info">
            <strong>Reporting Period:</strong> {new Date(reportData.reportingPeriod?.start).toLocaleDateString()} - {new Date(reportData.reportingPeriod?.end).toLocaleDateString()}
          </div>
          {reportData.engagementRate?.note && (
            <div className="report-note">
              <small>Note: {reportData.engagementRate.note}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportCard; 