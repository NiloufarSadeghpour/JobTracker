import { useEffect, useState, useRef } from 'react';
import axios from '../utils/axios';
import { Link } from 'react-router-dom';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setErr(null);

        // ✅ Do NOT read localStorage; axios instance adds Authorization itself
        const res = await axios.get('/jobs', { params: { limit: 5 } });

        // ✅ Your API returns { data: [...] }
        setJobs(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (e) {
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setJobs([]);
          setErr('Your session expired. Please log in again.');
        } else {
          console.error('Job fetch failed', e);
          setErr('Failed to load jobs.');
          setJobs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchJobs, 200);
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      // ✅ No manual headers; interceptor handles Authorization
      await axios.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((job) => (job.id ?? job._id) !== jobId));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete job');
    }
  };

  const handleHeart = async (value) => {
    try {
      // ✅ Using configured axios, Authorization is attached
      await axios.post('/favorites', { type: 'job', value });
      alert('Saved to favorites!');
    } catch (err) {
      console.error('Favorite failed', err);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (err) return <p>{err}</p>;

  const safeJobs = Array.isArray(jobs) ? jobs : [];

  return (
    <div style={{ marginTop: '1rem' }}>
      {safeJobs.length === 0 ? (
        <p>No jobs yet. <Link to="/add-job">Add one</Link> to get started!</p>
      ) : (
        safeJobs.map((job) => {
          const id = job.id ?? job._id;
          return (
            <div key={id} style={cardStyle}>
              <button
                onClick={() => handleHeart(`${job.title ?? job.position} at ${job.company}`)}
                style={{ float: 'right', fontSize: '1.2rem', border: 'none', background: 'none', cursor: 'pointer' }}
                title="Save to favorites"
              >
                ❤️
              </button>

              <Link
                to={`/edit-job/${id}`}
                style={{
                  float: 'right',
                  fontSize: '1rem',
                  color: '#4a90e2',
                  textDecoration: 'underline',
                  marginRight: '10px',
                  cursor: 'pointer',
                }}
              >
                ✏️ Edit
              </Link>

              <button
                onClick={() => handleDelete(id)}
                style={{
                  float: 'right',
                  fontSize: '1rem',
                  color: 'red',
                  marginLeft: '10px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                }}
                title="Delete job"
              >
                🗑️
              </button>

              <h3>{(job.title ?? job.position) ?? 'Untitled'} @ {job.company}</h3>
              <p>Status: <strong>{job.status || 'Wishlist'}</strong></p>

              {/* Optional: your table returns created_at/deadline; date_applied may be empty */}
              {job.created_at && <p>Created: {String(job.created_at).slice(0,10)}</p>}
              {job.deadline && <p>Deadline: {String(job.deadline).slice(0,10)}</p>}

              {job.job_link && (
                <p>
                  <a href={job.job_link} target="_blank" rel="noreferrer">View posting ↗</a>
                </p>
              )}
            </div>
          );
        })
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
  position: 'relative',
};
