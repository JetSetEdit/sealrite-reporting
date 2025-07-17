import React from 'react';
import './App.css';
import Header from './components/Header';
import EngagementRateCard from './components/EngagementRateCard';

function App() {
  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <div className="container">
          <h2>Instagram Analytics Dashboard</h2>
          <div className="metrics-grid">
            <EngagementRateCard />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
