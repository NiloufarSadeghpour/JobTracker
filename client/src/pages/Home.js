// src/pages/Home.js
import React, { useState } from 'react';
import './Home.css';
import { FaBriefcase, FaFileUpload, FaFolderOpen, FaStar, FaEdit, FaTrash } from 'react-icons/fa';
import jobIcon from '../images/job-icon.png';

const Home = () => {
  const [activeTab, setActiveTab] = useState('Job Tracker');

const renderTabContent = () => {
if (activeTab === 'Job Tracker') {
  return (
    <div className="job-tracker-container">
      <div className="job-tracker-header">
        <h2>Job Tracker</h2>
        <button className="add-job-btn">+ Add Job</button>
      </div>
      <table className="job-tracker-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Applied</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <tr key={index}>
              <td>
                <div className="job-title-placeholder"></div>
              </td>
              <td>
                <span className="status-pill">Applied</span>
              </td>
              <td>18/04/2021</td>
              <td>22/05/2021</td>
              <td>
                <span className="icon-btn">✏️</span>
                <span className="icon-btn">🗑️</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

  if (activeTab === 'Portfolio Builder') {
    return (
      <div className="portfolio-builder-preview">
        <div className="portfolio-form">
          <h2>Portfolio Builder</h2>
          <label>Name</label>
          <input type="text" placeholder="Enter your name" />
          <label>Bio</label>
          <textarea placeholder="Write a short bio..." />
          <label>Add media</label>
          <div className="media-upload">
            <input type="text" placeholder="Media URL" />
            <button className="upload-btn">Upload</button>
          </div>
          <button className="save-btn">Save portfolio</button>
        </div>
        <div className="portfolio-preview-box">
          <h3>Preview</h3>
          <div className="preview-card">
            <div className="preview-title" />
            <div className="preview-line short" />
            <div className="preview-line" />
          </div>
        </div>
      </div>
    );
  }
  if (activeTab === 'Autofill Application') {
  return (
    <div className="autofill-preview">
      <div className="autofill-form">
        <h2>Autofill job application</h2>
        <p>Automatically fill in applications using your profile details.</p>
        
        <label>Full name</label>
        <input type="text" placeholder="Jane Doe" />

        <label>Email</label>
        <input type="email" placeholder="jane.doe@example.com" />

        <div className="two-col">
          <div>
            <label>Phone</label>
            <input type="text" placeholder="+1 234 567 890" />
          </div>
          <div>
            <label>Resume</label>
            <div className="resume-field">
              <input type="text" placeholder="resume.pdf" readOnly />
              <span className="external-link">↗</span>
            </div>
          </div>
        </div>

        <label>Job title</label>
        <input type="text" placeholder="Frontend Developer" />

        <button className="autofill-btn">Autofill</button>
      </div>

      <div className="autofill-graphic">
        <div className="circle" />
        <div className="avatar" />
        <div className="briefcase" />
      </div>
    </div>
  );
}
if (activeTab === 'Favorites') {
  return (
    <div className="favorites-preview">
      <div className="favorites-header">Favorites</div>
      <div className="favorites-columns">
        <div className="favorites-column">
          <h3>Jobs</h3>
          <ul>
            <li>💙 Job listing 1</li>
            <li>💙 Job listing 2</li>
            <li>💙 Job listing 3</li>
          </ul>
        </div>
        <div className="favorites-column">
          <h3>Companies</h3>
          <ul>
            <li>💙 Company A</li>
            <li>💙 Company B</li>
            <li>💙 Company C</li>
          </ul>
        </div>
        <div className="favorites-column">
          <h3>Fields</h3>
          <ul>
            <li>💙 Field 1</li>
            <li>💙 Field 2</li>
            <li>💙 Field 3</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

  return <div className="tab-placeholder">Coming soon...</div>;
};

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
<img src={jobIcon} alt="Job Icon" className="hero-image" />
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
      </section>

      <section className="preview-tabs">
        <nav className="tab-nav">
          {['Job Tracker', 'Portfolio Builder', 'Autofill Application', 'Favorites'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="tab-preview">
          {renderTabContent()}
        </div>
      </section>

<section className="community-section">
  <h2>Words from our lovely community</h2>
  <div className="testimonial-carousel">
    {[
      {
        name: "Alex J.",
        role: "Junior Developer",
        message: "This platform streamlined my job search like never before. The autofill tool is a lifesaver!",
      },
      {
        name: "Sandra K.",
        role: "UI/UX Designer",
        message: "The portfolio builder gave me an edge during interviews. It's clean, fast, and intuitive.",
      },
      {
        name: "Michael R.",
        role: "Recent Graduate",
        message: "Tracking my applications with real-time updates helped me stay on top of things. Highly recommend!",
      },
    ].map((testimonial, idx) => (
      <div className="testimonial-card" key={idx}>
        <p className="testimonial-message">“{testimonial.message}”</p>
        <p className="testimonial-name">— {testimonial.name}, <span>{testimonial.role}</span></p>
      </div>
    ))}
  </div>
  
</section>
<section className="next-steps-section">
  <h2>Ready to take the next step?</h2>
  <p>Start organizing your job hunt like a pro.</p>
  <div className="next-steps-buttons">
    <a href="/signup" className="hero-btn">Create Free Account</a>
    <a href="/portfolio" className="hero-btn secondary">Build Portfolio</a>
  </div>
</section>

    </div>
  );
};

export default Home;
