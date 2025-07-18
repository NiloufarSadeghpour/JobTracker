import { Link, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <aside style={{ width: '220px', background: '#4a90e2', color: 'white', padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>JobTracker</h2>
      <nav>
        <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
        <Link to="/add-job" style={linkStyle}>Add Job</Link>
        <Link to="/autofill" style={linkStyle}>Autofill Form</Link>
        <div style={linkStyle} onClick={logout}>Logout</div>
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
