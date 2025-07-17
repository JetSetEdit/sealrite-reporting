import React from 'react';
import './App.css';
import Header from './components/Header';
import EngagementRateCard from './components/EngagementRateCard';
import ReportCard from './components/ReportCard';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <div className="container">
          <h2>Instagram Analytics Dashboard</h2>
          <div className="metrics-grid">
            <EngagementRateCard />
            <ReportCard />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
