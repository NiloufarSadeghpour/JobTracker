// src/pages/Home.js
import React from 'react';
import './Home.css';
import { FaBriefcase, FaFileUpload, FaFolderOpen, FaStar } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Your best Job Tracker and Portfolio Manager</h1>
          <p>Stay organized and streamline your job search process with ease.</p>
          <div className="hero-buttons">
            <a href="/dashboard" className="hero-btn">Get Started</a>
            <a href="/jobs" className="hero-btn secondary">Explore Jobs</a>
          </div>
        </div>
        <img src="/job-icon.png" alt="Job Icon" className="hero-image" />
      </section>

      <section className="features-section">
        <div className="feature-card">
          <FaBriefcase size={32} className="feature-icon" />
          <h3>Track Applications</h3>
          <p>Monitor your job apps in one central dashboard.</p>
        </div>
        <div className="feature-card">
          <FaFileUpload size={32} className="feature-icon" />
          <h3>Upload Documents</h3>
          <p>Securely upload resumes, cover letters, and more.</p>
        </div>
        <div className="feature-card">
          <FaFolderOpen size={32} className="feature-icon" />
          <h3>Build Portfolio</h3>
          <p>Create and manage a showcase of your projects.</p>
        </div>
        <div className="feature-card">
          <FaStar size={32} className="feature-icon" />
          <h3>Favorites</h3>
          <p>Save jobs and companies you love for later.</p>
        </div>
      </section>

      <section className="preview-tabs">
        <nav className="tab-nav">
          <button className="tab-btn active">Job Tracker</button>
          <button className="tab-btn">Portfolio Builder</button>
          <button className="tab-btn">Autofill Application</button>
          <button className="tab-btn">Favorites</button>
        </nav>

        <div className="tab-preview">
          <img src="/dashboard-preview.png" alt="Job Tracker Preview" />
        </div>
      </section>

      <section className="community-section">
        <h2>Words from our lovely community</h2>
        {/* Future testimonials or carousel here */}
      </section>
    </div>
  );
};

export default Home;
