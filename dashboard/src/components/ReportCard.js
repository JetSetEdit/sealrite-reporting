import React, { useState, useEffect } from 'react';
import './ReportCard.css';

const ReportCard = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('current');

  const months = ['june', 'current'];
  const monthNames = {
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
        'june': 5   // June (0-indexed: 5)
      };
      
      const monthIndex = monthMap[month];
      const startDate = new Date(currentYear, monthIndex, 1);
      const endDate = new Date(currentYear, monthIndex, 0); // Last day of the month
      
      return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    
    try {
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
      setReportData(data.instagram?.kpis);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth]);

  const formatNumber = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString();
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const calculateGrowth = (current, previous) => {
    if (!current || !previous) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="report-card loading">
        <div className="card-header">
          <h3>Instagram Analytics Report</h3>
          <div className="loading-spinner"></div>
        </div>
        <div className="card-content">
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-card error">
        <div className="card-header">
          <h3>Instagram Analytics Report</h3>
        </div>
        <div className="card-content">
          <p className="error-message">Error loading data: {error}</p>
          <button onClick={fetchReportData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="report-card no-data">
        <div className="card-header">
          <h3>Instagram Analytics Report</h3>
        </div>
        <div className="card-content">
          <p>No report data available</p>
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
          </div>
        </div>
        <div className="month-selector">
          <label htmlFor="month-select">Select Month:</label>
          <select 
            id="month-select"
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="month-dropdown"
          >
            {months.map(month => (
              <option key={month} value={month}>
                {monthNames[month]}
              </option>
            ))}
          </select>
        </div>
        <div className="report-period">
          {monthNames[selectedMonth]} Performance Report
        </div>
      </div>
      
      <div className="card-content">
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
            <div className="metric-icon">👁️</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(reportData.impressions?.total)}</div>
              <div className="metric-label">Impressions</div>
            </div>
          </div>
          
          <div className="metric-item primary">
            <div className="metric-icon">👤</div>
            <div className="metric-content">
              <div className="metric-value">{formatNumber(reportData.profileViews?.total)}</div>
              <div className="metric-label">Profile Views</div>
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
              {formatPercentage(reportData.engagementRate?.percentage / 100)}
            </div>
            <div className="rate-label">Engagement Rate</div>
            <div className="rate-formula">
              {reportData.engagementRate?.formula || '(Likes + Comments + Saved + Shares) ÷ Total Reach × 100'}
            </div>
          </div>
        </div>

        <div className="conversion-section">
          <h4>🔗 Conversion Metrics</h4>
          <div className="conversion-item">
            <span className="label">Website Clicks:</span>
            <span className="value">{formatNumber(reportData.conversions?.websiteClicks)}</span>
          </div>
        </div>

        <div className="report-summary">
          <h4>📋 Performance Summary</h4>
          <div className="summary-points">
            <div className="summary-point">
              <span className="point-icon">📈</span>
              <span className="point-text">
                Strong engagement rate of {formatPercentage(reportData.engagementRate?.percentage / 100)} 
                indicates high audience interaction
              </span>
            </div>
            <div className="summary-point">
              <span className="point-icon">👥</span>
              <span className="point-text">
                {formatNumber(reportData.followerGrowth?.endCount)} followers with 
                {formatNumber(reportData.profileViews?.total)} profile views showing good discovery
              </span>
            </div>
            <div className="summary-point">
              <span className="point-icon">🔗</span>
              <span className="point-text">
                {formatNumber(reportData.conversions?.websiteClicks)} website clicks demonstrate 
                effective call-to-action performance
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard; 