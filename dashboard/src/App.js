import React from 'react';
import './App.css';
import Header from './components/Header';
import UnifiedDashboard from './components/UnifiedDashboard';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <UnifiedDashboard />
      </main>
    </div>
  );
}

export default App;
