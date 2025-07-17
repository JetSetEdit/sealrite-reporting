import React, { useState, useEffect, useCallback } from 'react';
import './EngagementRateCard.css';

const EngagementRateCard = () => {
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('current'); // Default to current period

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
      const currentYear = 2025; // Since account started in March 2025
      const monthMap = {
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
            {formatPercentage(engagementData.engagementRate?.percentage / 100)}
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
          <div className="breakdown-item">
            <span className="label">Formula:</span>
            <span className="formula">(Likes + Comments + Saved + Shares) / Total Reach × 100</span>
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