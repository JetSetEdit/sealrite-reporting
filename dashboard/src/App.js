import React from 'react';
import './App.css';

function App() {
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
