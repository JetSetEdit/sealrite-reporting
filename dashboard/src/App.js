import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('⏳ Testing...');
  const [apiData, setApiData] = useState(null);
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry, data);
    setDebugLog(prev => [...prev, logEntry]);
  };

  useEffect(() => {
    // Simple API test with verbose debugging
    const testAPI = async () => {
      try {
        addDebugLog('🔧 Starting API test...');
        addDebugLog('📋 Environment variables check:');
        addDebugLog('  - REACT_APP_FACEBOOK_PAGE_ID:', process.env.REACT_APP_FACEBOOK_PAGE_ID);
        addDebugLog('  - NODE_ENV:', process.env.NODE_ENV);
        
        const requestBody = {
          pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID || '651877034666676',
          startDate: '2025-06-01T00:00:00.000Z',
          endDate: '2025-06-30T23:59:59.999Z',
          forceRefresh: false
        };
        
        addDebugLog('📤 Request body:', requestBody);
        addDebugLog('🌐 Making fetch request to /api/instagram/kpis...');
        
        const response = await fetch('/api/instagram/kpis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        addDebugLog('📡 Response received:');
        addDebugLog('  - Status:', response.status);
        addDebugLog('  - Status Text:', response.statusText);
        addDebugLog('  - Headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          addDebugLog('✅ Response is OK, parsing JSON...');
          const data = await response.json();
          addDebugLog('✅ JSON parsed successfully:', data);
          setApiStatus('✅ API Working!');
          setApiData(data);
        } else {
          addDebugLog('❌ Response is not OK, reading error text...');
          const errorText = await response.text();
          addDebugLog('❌ Error response body:', errorText);
          setApiStatus(`❌ API Error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        addDebugLog('💥 Exception caught:', error);
        addDebugLog('💥 Error name:', error.name);
        addDebugLog('💥 Error message:', error.message);
        addDebugLog('💥 Error stack:', error.stack);
        setApiStatus(`💥 Network Error: ${error.message}`);
      }
    };

    testAPI();
  }, []);

  return (
    <div className="App">
      <header style={{ 
        background: '#1e293b', 
        color: 'white', 
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1>🚀 SealRite Dashboard</h1>
        <p>Simple Test Version</p>
      </header>
      
      <main style={{ padding: '20px' }}>
        <div style={{ 
          background: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2>✅ Basic Dashboard Working</h2>
          <p>If you can see this, the basic React app is functioning correctly.</p>
          <p>Current time: {new Date().toLocaleString()}</p>
        </div>
        
        <div style={{ 
          background: '#e0f2fe', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🔧 Environment Check</h3>
          <p>Facebook Page ID: {process.env.REACT_APP_FACEBOOK_PAGE_ID || 'Not set'}</p>
          <p>Node Environment: {process.env.NODE_ENV}</p>
        </div>

        <div style={{ 
          background: '#fef3c7', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🔧 API Test</h3>
          <p><strong>Status:</strong> {apiStatus}</p>
          {apiData && (
            <div>
              <p><strong>✅ API Response:</strong></p>
              <pre style={{ 
                background: '#f1f5f9', 
                padding: '10px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div style={{ 
          background: '#fef2f2', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>🐛 Debug Log</h3>
          <p><strong>Console logs (check browser console for full details):</strong></p>
          <pre style={{ 
            background: '#1f2937', 
            color: '#10b981',
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '11px',
            overflow: 'auto',
            maxHeight: '300px',
            fontFamily: 'monospace'
          }}>
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </pre>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
            💡 Open browser console (F12) for detailed debugging information
          </p>
        </div>
        
        <div style={{ 
          background: '#f0fdf4', 
          padding: '20px', 
          borderRadius: '8px'
        }}>
          <h3>📋 Next Steps</h3>
          <ol>
            <li>✅ Basic React app working</li>
            <li>⏳ Add simple API test</li>
            <li>⏳ Add basic data display</li>
            <li>⏳ Add month selection</li>
            <li>⏳ Add real API integration</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

export default App;
