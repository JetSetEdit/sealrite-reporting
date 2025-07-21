import React, { useState } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    setLogs(prev => [...prev, logEntry]);
    console.log(`[${timestamp}] ${message}`);
  };

  const makeApiCall = async (endpoint, requestBody, operationName) => {
    const startTime = Date.now();
    setLoading(prev => ({ ...prev, [operationName]: true }));
    addLog(`🚀 Starting ${operationName}...`, 'info');

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      addLog(`✅ ${operationName} completed in ${responseTime}ms`, 'success');
      addLog(`📊 Response: ${JSON.stringify(data, null, 2)}`, 'data');
      
      setResults(prev => ({ 
        ...prev, 
        [operationName]: { 
          data, 
          responseTime, 
          timestamp: new Date().toISOString() 
        } 
      }));

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      addLog(`❌ ${operationName} failed after ${responseTime}ms: ${error.message}`, 'error');
      
      setResults(prev => ({ 
        ...prev, 
        [operationName]: { 
          error: error.message, 
          responseTime, 
          timestamp: new Date().toISOString() 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [operationName]: false }));
    }
  };

  const testOperations = [
    {
      name: 'Fetch Page ID',
      endpoint: 'instagram/kpis',
      requestBody: {
        pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-03-31T23:59:59.999Z',
        forceRefresh: true,
        testMode: 'pageId'
      }
    },
    {
      name: 'Fetch Current Followers',
      endpoint: 'instagram/kpis',
      requestBody: {
        pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-03-31T23:59:59.999Z',
        forceRefresh: true,
        testMode: 'followers'
      }
    },
    {
      name: 'Fetch Profile Views',
      endpoint: 'instagram/kpis',
      requestBody: {
        pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-03-31T23:59:59.999Z',
        forceRefresh: true,
        testMode: 'profileViews'
      }
    },
    {
      name: 'Fetch Posts & Engagement',
      endpoint: 'instagram/kpis',
      requestBody: {
        pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-03-31T23:59:59.999Z',
        forceRefresh: true,
        testMode: 'posts'
      }
    },
    {
      name: 'Full KPI Calculation',
      endpoint: 'instagram/kpis',
      requestBody: {
        pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
        startDate: '2025-03-01T00:00:00.000Z',
        endDate: '2025-03-31T23:59:59.999Z',
        forceRefresh: true,
        testMode: 'full'
      }
    }
  ];

  const clearLogs = () => {
    setLogs([]);
    setResults({});
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔧 Facebook Graph API Test Dashboard</h1>
        <p>Individual API request testing with detailed logging</p>
      </header>

      <main className="App-main">
        {/* Environment Info */}
        <div className="env-info">
          <h3>📋 Environment Variables</h3>
          <div className="env-grid">
            <div>FACEBOOK_ACCESS_TOKEN: {process.env.REACT_APP_FACEBOOK_ACCESS_TOKEN ? '✅ SET' : '❌ NOT SET'}</div>
            <div>INSTAGRAM_BUSINESS_ACCOUNT_ID: {process.env.REACT_APP_INSTAGRAM_BUSINESS_ACCOUNT_ID ? '✅ SET' : '❌ NOT SET'}</div>
            <div>FACEBOOK_PAGE_ID: {process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676'}</div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="test-buttons">
          <h3>🧪 Individual API Tests</h3>
          <div className="button-grid">
            {testOperations.map((operation) => (
              <button
                key={operation.name}
                onClick={() => makeApiCall(operation.endpoint, operation.requestBody, operation.name)}
                disabled={loading[operation.name]}
                className={`test-button ${loading[operation.name] ? 'loading' : ''} ${results[operation.name]?.error ? 'error' : results[operation.name]?.data ? 'success' : ''}`}
              >
                {loading[operation.name] ? '⏳ Loading...' : operation.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Display */}
        <div className="results-section">
          <h3>📊 Test Results</h3>
          {Object.entries(results).map(([operationName, result]) => (
            <div key={operationName} className={`result-card ${result.error ? 'error' : 'success'}`}>
              <h4>{operationName}</h4>
              <div className="result-meta">
                <span>⏱️ Response Time: {result.responseTime}ms</span>
                <span>🕐 Timestamp: {new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>
              {result.error ? (
                <div className="error-message">❌ {result.error}</div>
              ) : (
                <div className="success-message">
                  ✅ Success
                  <details>
                    <summary>View Response Data</summary>
                    <pre>{JSON.stringify(result.data, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live Logs */}
        <div className="logs-section">
          <div className="logs-header">
            <h3>📝 Live Logs</h3>
            <button onClick={clearLogs} className="clear-logs">Clear Logs</button>
          </div>
          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="no-logs">No logs yet. Click a test button to start...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.type}`}>
                  <span className="log-timestamp">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
