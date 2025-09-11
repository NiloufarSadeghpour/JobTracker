import React, { useEffect, useMemo, useState } from 'react';
import './Home.css';
import {
  FaBriefcase, FaFileUpload, FaFolderOpen, FaStar, FaEdit, FaTrash, FaCheckCircle,
  FaUsers, FaBolt, FaRocket, FaQuoteLeft, FaSyncAlt, FaHeart, FaBuilding, FaTags
} from 'react-icons/fa';
import jobIcon from '../images/job-icon.png';

const QUOTES = [
  { q: "Opportunities don't happen, you create them.", a: "Chris Grosser" },
  { q: "Success is the sum of small efforts, repeated day in and day out.", a: "Robert Collier" },
  { q: "It's not about ideas. It's about making ideas happen.", a: "Scott Belsky" },
  { q: "Dream big. Start small. Act now.", a: "Robin Sharma" },
  { q: "Action is the foundational key to all success.", a: "Pablo Picasso" },
  { q: "You miss 100% of the shots you don’t take.", a: "Wayne Gretzky" },
  { q: "The future depends on what you do today.", a: "Mahatma Gandhi" },
  { q: "Done is better than perfect.", a: "Sheryl Sandberg" },
  { q: "If you’re offered a seat on a rocket ship, don’t ask which seat.", a: "Sheryl Sandberg" },
  { q: "Stay hungry. Stay foolish.", a: "Steve Jobs" },
  { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { q: "Focus on being productive instead of busy.", a: "Tim Ferriss" },
  { q: "Small progress is still progress.", a: "Unknown" }
];

const DEMO_JOBS = [
  { title: "Frontend Developer", company: "Acme Corp", status: "Interview", applied: "18/08/2025", updated: "02/09/2025" },
  { title: "ML Engineer", company: "DeepLeaf AI", status: "Applied", applied: "20/08/2025", updated: "21/08/2025" },
  { title: "UI/UX Designer", company: "PixelWorks", status: "Phone Screen", applied: "12/08/2025", updated: "28/08/2025" },
  { title: "Data Scientist", company: "Northstar Labs", status: "Offer", applied: "05/08/2025", updated: "06/09/2025" },
  { title: "Full-stack Dev", company: "CloudNimble", status: "Rejected", applied: "30/07/2025", updated: "15/08/2025" },
];

const Home = () => {
  const [activeTab, setActiveTab] = useState('Job Tracker');

  // --- Inspirational Quotes ---
  const [quoteIndex, setQuoteIndex] = useState(0);
  const quote = QUOTES[quoteIndex];

  // Start with a random quote on first render
  const startIndex = useMemo(() => Math.floor(Math.random() * QUOTES.length), []);
  useEffect(() => {
    setQuoteIndex(startIndex);
  }, [startIndex]);

  // Auto-rotate every 8s
  useEffect(() => {
    const id = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const nextQuote = () => setQuoteIndex((i) => (i + 1) % QUOTES.length);

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
              {DEMO_JOBS.map((j, index) => (
               <tr key={index}>
                 <td>
                   <div className="job-title">
                     <strong>{j.title}</strong> <span className="job-company">· {j.company}</span>
                   </div>
                 </td>
                 <td>
                   <span className={`status-pill status-${j.status.replace(/\s+/g,'').toLowerCase()}`}>{j.status}</span>
                 </td>
                 <td>{j.applied}</td>
                 <td>{j.updated}</td>
                 <td>
                   <span className="icon-btn" title="Edit"><FaEdit /></span>
                   <span className="icon-btn" title="Delete"><FaTrash /></span>
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
            <div className="preview-card profile-card">
              <div className="avatar-sm" />
              <div className="profile-head">
               <div className="name">Jane Doe</div>
               <div className="tags"><span>Frontend</span><span>React</span><span>UI/UX</span></div>
              </div>
              <p className="bio">I build fast, accessible web apps with a love for clean design and DX.</p>
              <div className="proj-list">
                 <div className="proj-item">
                  <div className="proj-title">JobTracker Pro</div>
                  <div className="proj-meta">React · Node · PostgreSQL</div>
                 </div> 
                 <div className="proj-item">
                  <div className="proj-title">Portfolio Blocks</div>
                  <div className="proj-meta">Vite · Tailwind · Framer Motion</div>
                 </div>
            </div>
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
              <h3><FaBriefcase /> Jobs</h3>
              <ul>
                <li><FaHeart className="heart-icon" /> Job listing 1</li>
                <li><FaHeart className="heart-icon" /> Job listing 2</li>
                <li><FaHeart className="heart-icon" /> Job listing 3</li>
              </ul>
            </div>
            <div className="favorites-column">
              <h3><FaBuilding /> Companies</h3>
              <ul>
                <li><FaHeart className="heart-icon" /> Company A</li>
                <li><FaHeart className="heart-icon" /> Company B</li>
                <li><FaHeart className="heart-icon" /> Company C</li>
              </ul>
            </div>
            <div className="favorites-column">
              <h3><FaTags /> Fields</h3>
              <ul>
                <li><FaHeart className="heart-icon" /> Field 1</li>
                <li><FaHeart className="heart-icon" /> Field 2</li>
                <li><FaHeart className="heart-icon" /> Field 3</li>
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
      {/* HERO */}
    <section className="hero-section hero-gradient">
     <div className="hero-overlay" aria-hidden />
     <div className="hero-content">
      <div className="hero-kicker">
       <FaBolt /> Job hunting, organized.
      </div>
      <h1>
       Your best <span className="brand-accent">Job Tracker</span> and Portfolio Manager
      </h1>
      <p>Stay organized and streamline your job search process with ease.</p>
      <div className="hero-buttons">
       <a href="/dashboard" className="hero-btn">Get Started</a>
       <a href="/jobs" className="hero-btn secondary">Explore Jobs</a>
      </div>
          {/* quick stats */}
          <div className="stats-strip">
            <div className="stat-pill"><FaCheckCircle /> Track Applications</div>
            <div className="stat-pill"><FaUsers /> Collaborate with Mentors</div>
            <div className="stat-pill"><FaRocket /> Level‑up Portfolio</div>
          </div>
        </div>

          <ul className="hero-aside">
           <li><span className="dot" /> Auto-parse job posts</li>
           <li><span className="dot" /> One-click status updates</li>
           <li><span className="dot" /> Smart reminders</li>
           <li><span className="dot" /> Portfolio blocks</li>
          </ul>
        <img src={jobIcon} alt="Job Icon" className="hero-image floaty" />
        <div className="hero-glow" aria-hidden />
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="feature-card lift">
        <div className="feature-badge"><FaBriefcase size={20} /></div>
        <h3>Track Applications</h3>
        <p>Monitor your job apps in one central dashboard.</p>
       </div>
       <div className="feature-card lift">
        <div className="feature-badge"><FaFileUpload size={20} /></div>
        <h3>Upload Documents</h3>
        <p>Securely upload resumes, cover letters, and more.</p>
       </div>
       <div className="feature-card lift">
        <div className="feature-badge"><FaFolderOpen size={20} /></div>
        <h3>Build Portfolio</h3>
        <p>Create and manage a showcase of your projects.</p>
       </div>
      </section>


      {/* PREVIEWS */}
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

      {/* INSPIRATIONAL QUOTES */}
      <section className="quotes-section">
        <div className="quotes-card">
          <div className="quotes-header">
            <div className="quotes-title"><FaQuoteLeft /> Daily Inspiration</div>
            <button className="refresh-btn" onClick={nextQuote} title="New quote">
              <FaSyncAlt />
              <span>Inspire me</span>
            </button>
          </div>
          <blockquote key={quoteIndex} className="quote">
            “{quote.q}”
          </blockquote>
          <div className="quote-author">— {quote.a}</div>
          <div className="quote-progress"><span style={{ width: `${((quoteIndex % QUOTES.length) + 1) / QUOTES.length * 100}%` }} /></div>
        </div>
      </section>

      {/* TESTIMONIALS */}
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
          ].map((t, idx) => (
           <div className="testimonial-card" key={idx}>
            <div className="testimonial-top">
             <div className="avatar" />
             <div className="who">
              <div className="testimonial-name">{t.name}</div>
              <div className="role">{t.role}</div>
              <div className="stars"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
             </div>
            </div>
            <p className="testimonial-message">“{t.message}”</p>
          </div>

          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="next-steps-section">
        <h2>Ready to take the next step?</h2>
        <p>Start organizing your job hunt like a pro.</p>
        <div className="next-steps-buttons">
          <a href="/auth" className="hero-btn">Create Free Account</a>
          <a href="/portfolio-builder" className="hero-btn secondary">Build Portfolio</a>
        </div>
      </section>
    </div>
  );
};

export default Home;
