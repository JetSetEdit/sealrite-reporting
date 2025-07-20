import React, { useState, useEffect, useCallback } from 'react';
import './UnifiedDashboard.css';

const UnifiedDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [cachedData, setCachedData] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [exporting, setExporting] = useState(false);
  const [monthLoading, setMonthLoading] = useState(false);

  const months = ['march', 'april', 'may', 'june', 'current'];
  const monthNames = {
    'march': 'March 2025',
    'april': 'April 2025',
    'may': 'May 2025',
    'june': 'June 2025',
    'current': 'Last 30 Days'
  };

  const getMonthDateRange = (month) => {
    if (month === 'current') {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    } else {
      const currentYear = 2025;
      const monthMap = {
        'march': 2,
        'april': 3,
        'may': 4,
        'june': 5
      };
      
      const monthIndex = monthMap[month];
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex + 1, 0);
      
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }
  };



  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    
    // Check if we have cached data for this month
    if (cachedData[selectedMonth] && !forceRefresh) {
      setDashboardData(cachedData[selectedMonth]);
      setLoading(false);
      setMonthLoading(false);
      setError(null);
      return;
    }
    
    setLoading(true);
    setMonthLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/instagram/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
          startDate: startDate,
          endDate: endDate,
          forceRefresh: forceRefresh
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const kpisData = data.instagram?.kpis;
      
      if (kpisData) {
        setDashboardData(kpisData);
        // Cache the data for this specific month
        setCachedData(prev => ({
          ...prev,
          [selectedMonth]: kpisData
        }));
        setLastUpdated(prev => ({
          ...prev,
          [selectedMonth]: new Date()
        }));
        setError(null);
      } else {
        throw new Error('No data received from API');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
      if (!cachedData[selectedMonth]) {
        setDashboardData(null);
      }
    } finally {
      setLoading(false);
      setMonthLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, cachedData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

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
    if (!dashboardData) {
      alert('No data available to export');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/export-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: format,
          data: dashboardData,
          month: selectedMonth,
          monthName: monthNames[selectedMonth],
          preview: preview
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      if (preview && format === 'pdf') {
        try {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
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
    fetchDashboardData();
  }, [selectedMonth, fetchDashboardData]);

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
    if (typeof date === 'object' && date[selectedMonth]) {
      return date[selectedMonth].toLocaleString();
    }
    return date.toLocaleString();
  };

  const calculateEngagementBreakdown = () => {
    if (!dashboardData?.posts?.data) return null;
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalSaved = 0;
    let totalShares = 0;
    
    dashboardData.posts.data.forEach(post => {
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

  if (loading) {
    return (
      <div className="unified-dashboard loading">
        <div className="dashboard-header">
          <h2>Instagram Analytics Dashboard</h2>
          <div className="loading-spinner"></div>
        </div>
        <div className="dashboard-content">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="unified-dashboard error">
        <div className="dashboard-header">
          <h2>Instagram Analytics Dashboard</h2>
        </div>
        <div className="dashboard-content">
          <p className="error-message">Error loading data: {error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="unified-dashboard no-data">
        <div className="dashboard-header">
          <h2>Instagram Analytics Dashboard</h2>
        </div>
        <div className="dashboard-content">
          <p>No dashboard data available</p>
          <button onClick={fetchDashboardData} className="connect-button">
            Connect Instagram Account
          </button>
        </div>
      </div>
    );
  }

  const engagementBreakdown = calculateEngagementBreakdown();

  return (
    <div className="unified-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h2>Instagram Analytics Dashboard</h2>
          <div className="header-controls">
            <button 
              onClick={handleRefresh} 
              className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
              disabled={refreshing}
            >
              {refreshing ? '🔄' : '🔄'} Refresh
            </button>
            <div className="export-controls">
              <button 
                onClick={() => handleExport('pdf', true)} 
                className="export-button"
                disabled={exporting}
              >
                📄 Preview PDF
              </button>
              <button 
                onClick={() => handleExport('pdf')} 
                className="export-button"
                disabled={exporting}
              >
                📄 Export PDF
              </button>
              <button 
                onClick={() => handleExport('xlsx')} 
                className="export-button"
                disabled={exporting}
              >
                📊 Export Excel
              </button>
            </div>
          </div>
        </div>
        
        <div className="month-navigator">
          <div className="month-buttons">
            <div className="month-buttons-row">
              {months.slice(0, 4).map((month) => (
                <button
                  key={month}
                  className={`month-button ${selectedMonth === month ? 'active' : ''} ${monthLoading && selectedMonth === month ? 'loading' : ''}`}
                  onClick={() => setSelectedMonth(month)}
                  disabled={monthLoading}
                  aria-label={`Select ${monthNames[month]}`}
                >
                  {monthLoading && selectedMonth === month ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Loading...
                    </>
                  ) : (
                    monthNames[month]
                  )}
                </button>
              ))}
            </div>
            <div className="month-buttons-row">
              {months.slice(4).map((month) => (
                <button
                  key={month}
                  className={`month-button ${selectedMonth === month ? 'active' : ''} ${monthLoading && selectedMonth === month ? 'loading' : ''}`}
                  onClick={() => setSelectedMonth(month)}
                  disabled={monthLoading}
                  aria-label={`Select ${monthNames[month]}`}
                >
                  {monthLoading && selectedMonth === month ? (
                    <>
                      <span className="loading-spinner-small"></span>
                      Loading...
                    </>
                  ) : (
                    monthNames[month]
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="date-range-display">
          {(() => {
            const { startDate, endDate } = getMonthDateRange(selectedMonth);
            const start = new Date(startDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            const end = new Date(endDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
            return `${start} - ${end}`;
          })()}
        </div>

        {lastUpdated && (
          <div className="last-updated">
            Last updated: {formatLastUpdated(lastUpdated)}
            {cachedData[selectedMonth] && !loading && (
              <span className="cache-indicator"> (cached)</span>
            )}
          </div>
        )}
      </div>
      
      <div className="dashboard-content">
        {monthLoading && (
          <div className="content-loading-overlay">
            <div className="content-loading-spinner"></div>
            <p>Loading data for {monthNames[selectedMonth]}...</p>
          </div>
        )}
        <div className={`metrics-grid ${monthLoading ? 'loading' : ''}`}>
          {/* Main Engagement Rate Card */}
          <div className="metric-card engagement-card">
            <div className="card-header">
              <h3>📊 Engagement Rate</h3>
            </div>
            <div className="card-content">
              <div className="main-metric">
                <div className="metric-value">
                  {formatPercentage(dashboardData.engagementRate?.percentage)}
                </div>
                <div className="metric-label">Engagement Rate</div>
                <div className="metric-formula">
                  (Likes + Comments + Saved + Shares) ÷ Total Reach × 100
                </div>
              </div>
              
              <div className="metric-breakdown">
                <div className="breakdown-item">
                  <span className="label">Total Engagements:</span>
                  <span className="value">{formatNumber(dashboardData.engagementRate?.totalEngagementsNumerator)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Total Reach:</span>
                  <span className="value">{formatNumber(dashboardData.engagementRate?.denominatorValue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Breakdown Card */}
          <div className="metric-card breakdown-card">
            <div className="card-header">
              <h3>🔍 Engagement Breakdown</h3>
            </div>
            <div className="card-content">
              {engagementBreakdown ? (
                <div className="engagement-details">
                  <div className="engagement-item">
                    <span className="icon">👍</span>
                    <span className="label">Likes</span>
                    <span className="value">{formatNumber(engagementBreakdown.likes)}</span>
                  </div>
                  <div className="engagement-item">
                    <span className="icon">💬</span>
                    <span className="label">Comments</span>
                    <span className="value">{formatNumber(engagementBreakdown.comments)}</span>
                  </div>
                  <div className="engagement-item">
                    <span className="icon">🔖</span>
                    <span className="label">Saved</span>
                    <span className="value">{formatNumber(engagementBreakdown.saved)}</span>
                  </div>
                  <div className="engagement-item">
                    <span className="icon">📤</span>
                    <span className="label">Shares</span>
                    <span className="value">{formatNumber(engagementBreakdown.shares)}</span>
                  </div>
                  <div className="engagement-item total">
                    <span className="icon">📈</span>
                    <span className="label">Total</span>
                    <span className="value">{formatNumber(engagementBreakdown.total)}</span>
                  </div>
                </div>
              ) : (
                <p>No engagement data available</p>
              )}
            </div>
          </div>

          {/* Profile Views Card */}
          <div className="metric-card profile-card">
            <div className="card-header">
              <h3>👁️ Profile Views</h3>
            </div>
            <div className="card-content">
              <div className="main-metric">
                <div className="metric-value">
                  {formatNumber(dashboardData.profileViews?.total)}
                </div>
                <div className="metric-label">Profile Views</div>
              </div>
            </div>
          </div>

          {/* Follower Growth Card */}
          <div className="metric-card followers-card">
            <div className="card-header">
              <h3>👥 Followers</h3>
            </div>
            <div className="card-content">
              <div className="main-metric">
                <div className="metric-value">
                  {formatNumber(dashboardData.followerGrowth?.endCount || 60)}
                </div>
                <div className="metric-label">Current Followers</div>
                <div className="growth-rate">
                  {formatPercentage(dashboardData.followerGrowth?.percentage || 0)} growth
                </div>
              </div>
            </div>
          </div>

          {/* Posts Summary Card */}
          <div className="metric-card posts-card">
            <div className="card-header">
              <h3>📝 Posts Summary</h3>
            </div>
            <div className="card-content">
              <div className="posts-summary">
                <div className="summary-item">
                  <span className="label">Total Posts:</span>
                  <span className="value">{dashboardData.posts?.data?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Avg. Reach per Post:</span>
                  <span className="value">
                    {dashboardData.posts?.data?.length > 0 
                      ? formatNumber(Math.round(dashboardData.engagementRate?.denominatorValue / dashboardData.posts.data.length))
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Detail Panel */}
      {dashboardData.posts?.data && dashboardData.posts.data.length > 0 && (
        <div className="posts-panel">
          <div className="panel-header">
            <h3>📱 Posts from {monthNames[selectedMonth]}</h3>
            <div className="panel-subtitle">
              Showing {dashboardData.posts.data.length} post{dashboardData.posts.data.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="posts-grid">
            {dashboardData.posts.data.map((post, index) => {
              const getPostInsightValue = (metricName, fallbackValue = 0) => {
                const insight = post.insights?.data?.find(i => i.name === metricName);
                return insight?.values?.[0]?.value || fallbackValue;
              };

              const postLikes = getPostInsightValue('likes', post.like_count);
              const postComments = getPostInsightValue('comments', post.comments_count);
              const postSaved = getPostInsightValue('saved');
              const postShares = getPostInsightValue('shares');
              const postReach = getPostInsightValue('reach');
              const totalEngagements = postLikes + postComments + postSaved + postShares;
              const postEngagementRate = postReach > 0 ? (totalEngagements / postReach) * 100 : 0;

              const postDate = new Date(post.timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="post-date">{postDate}</div>
                    <div className="post-type">
                      {post.media_type === 'VIDEO' ? '🎥' : post.media_type === 'CAROUSEL_ALBUM' ? '📷' : '🖼️'}
                      {post.media_type}
                    </div>
                  </div>
                  
                  {post.media_url && (
                    <div className="post-media">
                      <img 
                        src={post.media_url} 
                        alt="Post media" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="media-fallback" style={{ display: 'none' }}>
                        <div className="fallback-icon">📷</div>
                        <div className="fallback-text">Media not available</div>
                      </div>
                    </div>
                  )}
                  
                  {post.caption && (
                    <div className="post-caption">
                      {post.caption.length > 100 
                        ? `${post.caption.substring(0, 100)}...` 
                        : post.caption
                      }
                    </div>
                  )}
                  
                  <div className="post-metrics">
                    <div className="metric-row">
                      <div className="metric-item">
                        <span className="metric-icon">👁️</span>
                        <span className="metric-label">Reach</span>
                        <span className="metric-value">{formatNumber(postReach)}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-icon">📊</span>
                        <span className="metric-label">Engagement Rate</span>
                        <span className="metric-value">{formatPercentage(postEngagementRate)}</span>
                      </div>
                    </div>
                    
                    <div className="engagement-breakdown">
                      <div className="breakdown-item">
                        <span className="icon">👍</span>
                        <span className="value">{formatNumber(postLikes)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="icon">💬</span>
                        <span className="value">{formatNumber(postComments)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="icon">🔖</span>
                        <span className="value">{formatNumber(postSaved)}</span>
                      </div>
                      <div className="breakdown-item">
                        <span className="icon">📤</span>
                        <span className="value">{formatNumber(postShares)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {post.permalink && (
                    <div className="post-link">
                      <a 
                        href={post.permalink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-post-link"
                      >
                        View on Instagram →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedDashboard; 