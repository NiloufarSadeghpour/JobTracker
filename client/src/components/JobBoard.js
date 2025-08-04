import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { Link } from 'react-router-dom';


export default function JobBoard() {
  const [jobs, setJobs] = useState([]);

useEffect(() => {
  const token = localStorage.getItem('token');

  axios.get('/jobs', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => setJobs(res.data))
    .catch(err => console.error('Job fetch failed', err));
}, []);

const handleDelete = async (jobId) => {
  const confirmed = window.confirm('Are you sure you want to delete this job?');
  if (!confirmed) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(`/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    // Refresh job list after deletion
    setJobs(prev => prev.filter(job => job.id !== jobId));
  } catch (err) {
    console.error('Delete failed', err);
    alert('Failed to delete job');
  }
};


  const handleHeart = async (value) => {
    try {
      await axios.post('/favorites', { type: 'job', value });
      alert('Saved to favorites!');
    } catch (err) {
      console.error('Favorite failed', err);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {jobs.length === 0 ? (
        <p>No jobs yet. Add one to get started!</p>
      ) : (
        jobs.map((job) => (
          <div key={job.id} style={cardStyle}>
            <button
              onClick={() => handleHeart(`${job.position} at ${job.company}`)}
              style={{ float: 'right', fontSize: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
              title="Save to favorites"
            >
              ❤️
            </button>
              {/* 🧱 Edit button */}
  <Link
    to={`/edit-job/${job.id}`}
    style={{
      float: 'right',
      fontSize: '1rem',
      color: '#4a90e2',
      textDecoration: 'underline',
      marginRight: '10px',
      cursor: 'pointer'
    }}
  >
    ✏️ Edit
  </Link>
            <button
  onClick={() => handleDelete(job.id)}
  style={{
    float: 'right',
    fontSize: '1rem',
    color: 'red',
    marginLeft: '10px',
    border: 'none',
    background: 'none',
    cursor: 'pointer'
  }}
  title="Delete job"
>
  🗑️
</button>


            <h3>{job.position} @ {job.company}</h3>
            <p>Status: <strong>{job.status}</strong></p>
            <p>Date Applied: {job.date_applied?.slice(0, 10)}</p>
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = {
  border: '1px solid #ccc',
  padding: '1rem',
  borderRadius: '5px',
  marginBottom: '1rem',
  background: '#f9f9f9',
  position: 'relative'
};
