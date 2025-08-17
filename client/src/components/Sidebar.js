// src/components/Sidebar.js
import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/auth'); // better: send to auth
  };

  return (
    <aside style={{ width: '220px', background: '#4a90e2', color: 'white', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>JobTracker</h2>
      <nav>
        <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
        <Link to="/jobs" style={linkStyle}>All Jobs</Link> {/* <-- add this */}
        <Link to="/add-job" style={linkStyle}>Add Job</Link>
        <Link to="/autofill" style={linkStyle}>Autofill Form</Link>
        <Link to="/portfolio-builder" style={linkStyle}>Portfolio Builder</Link>
        <button onClick={logout} style={linkStyle}>Logout</button>
      </nav>
    </aside>
  );
}

const linkStyle = {
  display: 'block',
  color: 'white',
  marginBottom: '10px',
  cursor: 'pointer',
};
