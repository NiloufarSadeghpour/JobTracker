import { useEffect, useState } from 'react';
import axios from '../utils/axios';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get('/jobs')
      .then(res => setJobs(res.data))
      .catch(err => console.error('Job fetch failed', err));
  }, []);

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
