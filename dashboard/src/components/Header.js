import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>SealRite Analytics</h1>
          <p>Social Media Reporting Dashboard</p>
        </div>
        <nav className="nav">
          <button className="nav-button active">Dashboard</button>
          <button className="nav-button">Reports</button>
          <button className="nav-button">Settings</button>
        </nav>
      </div>
    </header>
  );
};

export default Header; 