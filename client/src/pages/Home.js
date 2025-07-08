// src/pages/Home.js
import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-hero">
        <h1>Welcome to JobTracker</h1>
        <p>Your personal assistant to manage job applications and portfolios.</p>
        <a href="/register" className="home-btn">Get Started</a>
      </div>
    </div>
  );
};

export default Home;
