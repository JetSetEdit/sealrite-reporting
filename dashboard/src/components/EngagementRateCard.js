import React, { useState, useEffect, useCallback } from 'react';
import './EngagementRateCard.css';

const EngagementRateCard = () => {
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('current'); // Default to current period

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
      const currentYear = 2025; // Since account started in March 2025
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

  const navigateMonth = (direction) => {
    const currentIndex = months.indexOf(selectedMonth);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : months.length - 1;
    } else {
      newIndex = currentIndex < months.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedMonth(months[newIndex]);
  };

  const fetchEngagementData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    
    try {
      // Fetch data from your backend API
      const response = await fetch('http://localhost:3001/api/instagram/kpis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
          startDate: startDate,
          endDate: endDate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEngagementData(data.instagram?.kpis);
    } catch (err) {
      console.error('Error fetching engagement data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchEngagementData();
  }, [fetchEngagementData]);

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  // Calculate detailed engagement breakdown from posts data
  const calculateEngagementBreakdown = () => {
    if (!engagementData?.posts?.data) return null;
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalSaved = 0;
    let totalShares = 0;
    
    engagementData.posts.data.forEach(post => {
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

  if (loading) {
    return (
      <div className="engagement-card loading">
        <div className="card-header">
          <h3>Engagement Rate (By Reach)</h3>
          <div className="loading-spinner"></div>
        </div>
        <div className="card-content">
          <p>Loading engagement data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="engagement-card error">
        <div className="card-header">
          <h3>Engagement Rate (By Reach)</h3>
        </div>
        <div className="card-content">
          <p className="error-message">Error loading data: {error}</p>
          <button onClick={fetchEngagementData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!engagementData) {
    return (
      <div className="engagement-card no-data">
        <div className="card-header">
          <h3>Engagement Rate (By Reach)</h3>
        </div>
        <div className="card-content">
          <p>No engagement data available</p>
          <button onClick={fetchEngagementData} className="connect-button">
            Connect Instagram Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="engagement-card">
      <div className="card-header">
        <div className="header-top">
          <h3>Engagement Rate (By Reach)</h3>
          <div className="header-controls">
            <div className="metric-icon">📊</div>
          </div>
        </div>
        <div className="month-navigator">
          <button 
            className="nav-arrow prev-arrow" 
            onClick={() => navigateMonth('prev')}
            aria-label="Previous month"
          >
            ‹
          </button>
          <div className="month-display">
            {monthNames[selectedMonth]}
          </div>
          <button 
            className="nav-arrow next-arrow" 
            onClick={() => navigateMonth('next')}
            aria-label="Next month"
          >
            ›
          </button>
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
      </div>
      
      <div className="card-content">
        <div className="main-metric">
          <div className="metric-value">
            {formatPercentage(engagementData.engagementRate?.percentage)}
          </div>
          <div className="metric-label">Engagement Rate</div>
          <div className="metric-period">{selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1)} 2025</div>
        </div>
        
        <div className="metric-breakdown">
          <div className="breakdown-item">
            <span className="label">Total Engagements:</span>
            <span className="value">{formatNumber(engagementData.engagementRate?.totalEngagementsNumerator)}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Total Reach:</span>
            <span className="value">{formatNumber(engagementData.engagementRate?.denominatorValue)}</span>
          </div>
          <div className="breakdown-item formula-item">
            <span className="label">Formula:</span>
            <span className="formula">(Likes + Comments + Saved + Shares) ÷ Total Reach × 100</span>
          </div>
        </div>

        {/* Enhanced Formula Display */}
        <div className="formula-breakdown">
          <div className="formula-title">📐 Calculation Breakdown</div>
          <div className="formula-steps">
            <div className="formula-step">
              <span className="step-number">1.</span>
              <span className="step-text">Sum all engagements: {formatNumber(engagementData.engagementRate?.totalEngagementsNumerator)}</span>
            </div>
            <div className="formula-step">
              <span className="step-number">2.</span>
              <span className="step-text">Divide by total reach: {formatNumber(engagementData.engagementRate?.totalEngagementsNumerator)} ÷ {formatNumber(engagementData.engagementRate?.denominatorValue)}</span>
            </div>
            <div className="formula-step">
              <span className="step-number">3.</span>
              <span className="step-text">Multiply by 100: {engagementData.engagementRate?.denominatorValue > 0 ? ((engagementData.engagementRate?.totalEngagementsNumerator / engagementData.engagementRate?.denominatorValue) * 100).toFixed(6) : '0'}%</span>
            </div>
          </div>
        </div>

        {/* Detailed Engagement Breakdown */}
        {(() => {
          const breakdown = calculateEngagementBreakdown();
          if (!breakdown) return null;
          
          return (
            <div className="detailed-breakdown">
              <h4>📊 Detailed Engagement Breakdown</h4>
              <div className="engagement-grid">
                <div className="engagement-item">
                  <span className="engagement-icon">❤️</span>
                  <span className="engagement-label">Likes:</span>
                  <span className="engagement-value">{formatNumber(breakdown.likes)}</span>
                  <span className="engagement-percentage">({((breakdown.likes / breakdown.total) * 100).toFixed(1)}%)</span>
                </div>
                <div className="engagement-item">
                  <span className="engagement-icon">💬</span>
                  <span className="engagement-label">Comments:</span>
                  <span className="engagement-value">{formatNumber(breakdown.comments)}</span>
                  <span className="engagement-percentage">({((breakdown.comments / breakdown.total) * 100).toFixed(1)}%)</span>
                </div>
                <div className="engagement-item">
                  <span className="engagement-icon">🔖</span>
                  <span className="engagement-label">Saved:</span>
                  <span className="engagement-value">{formatNumber(breakdown.saved)}</span>
                  <span className="engagement-percentage">({((breakdown.saved / breakdown.total) * 100).toFixed(1)}%)</span>
                </div>
                <div className="engagement-item">
                  <span className="engagement-icon">📤</span>
                  <span className="engagement-label">Shares:</span>
                  <span className="engagement-value">{formatNumber(breakdown.shares)}</span>
                  <span className="engagement-percentage">({((breakdown.shares / breakdown.total) * 100).toFixed(1)}%)</span>
                </div>
              </div>
              <div className="calculation-summary">
                <div className="calculation-line">
                  <span>Total: {formatNumber(breakdown.total)} engagements</span>
                </div>
                <div className="calculation-line">
                  <span>Reach: {formatNumber(engagementData.engagementRate?.denominatorValue)}</span>
                </div>
                <div className="calculation-line">
                  <span>Rate: {formatPercentage(engagementData.engagementRate?.percentage)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Performance Indicator */}
        <div className="performance-indicator">
          <div className="performance-title">📈 Performance Indicator</div>
          <div className="performance-content">
            {(() => {
              const rate = engagementData.engagementRate?.percentage || 0;
              let performance = 'Average';
              let color = '#f59e0b';
              let icon = '📊';
              
              if (rate >= 5) {
                performance = 'Excellent';
                color = '#10b981';
                icon = '🚀';
              } else if (rate >= 3) {
                performance = 'Good';
                color = '#3b82f6';
                icon = '👍';
              } else if (rate >= 1) {
                performance = 'Fair';
                color = '#f59e0b';
                icon = '📊';
              } else {
                performance = 'Needs Improvement';
                color = '#ef4444';
                icon = '⚠️';
              }
              
              return (
                <div className="performance-badge" style={{ color }}>
                  <span className="performance-icon">{icon}</span>
                  <span className="performance-text">{performance}</span>
                </div>
              );
            })()}
          </div>
        </div>
        
        <div className="metric-note">
          <small>{engagementData.engagementRate?.note}</small>
        </div>
      </div>
    </div>
  );
};

export default EngagementRateCard; 