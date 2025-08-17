import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';

const STATUSES = ['All', 'Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function JobListPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [tags, setTags] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [state, setState] = useState({ loading: true, error: null });
  const debounceRef = useRef(null);

  const queryParams = useMemo(
    () => ({
      search: search.trim(),
      status,
      tags: tags.trim(),
      page,
      limit,
      highlightStart: 3,
      highlightEnd: 5,
    }),
    [search, status, tags, page, limit]
  );

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        const res = await axios.get('/jobs', { params: queryParams });
        setJobs(Array.isArray(res.data?.data) ? res.data.data : []);
        setState({ loading: false, error: null });
      } catch (err) {
        console.error('GET /jobs failed', err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setJobs([]);
          setState({ loading: false, error: 'Your session expired. Please log in again.' });
          return;
        }
        setJobs([]);
        setState({ loading: false, error: 'Failed to load jobs.' });
      }
    };

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchJobs, 300);
    return () => clearTimeout(debounceRef.current);
  }, [queryParams]);

  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d).slice(0, 10);
      return dt.toLocaleDateString();
    } catch {
      return String(d).slice(0, 10);
    }
  };

  if (state.loading)
    return (
      <div className="job-page">
        <div className="job-container">
          <p>Loading…</p>
        </div>
      </div>
    );

  if (state.error)
    return (
      <div className="job-page">
        <div className="job-container">
          <p>{state.error}</p>
        </div>
      </div>
    );

  const safeJobs = Array.isArray(jobs) ? jobs : [];

  return (
    <div className="job-page">
      <div className="job-container">
        {/* Header + controls */}
        <div className="job-list-header">
          <h2>Your Jobs</h2>
          <Link to="/add-job" className="job-add-btn">
            + Add Job
          </Link>
        </div>

        <div
          className="job-controls"
          style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 1fr' }}
        >
          <input
            type="text"
            placeholder="Search title, company, or tags…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Tags (comma-separated, e.g. react,remote)"
            value={tags}
            onChange={(e) => {
              setPage(1);
              setTags(e.target.value);
            }}
          />
        </div>

        {safeJobs.length === 0 ? (
          <div className="job-empty">
            <p>
              No jobs match your filters. <Link to="/add-job">Add a job</Link> or clear filters.
            </p>
          </div>
        ) : (
          <ul className="job-list">
            {safeJobs.map((job) => {
              const dueIn = typeof job.due_in_days === 'number' ? job.due_in_days : null;
              const highlight = job.highlight === 1 || (dueIn !== null && dueIn >= 3 && dueIn <= 5);

              return (
                <li
                  key={job.id}
                  className={`job-item ${highlight ? 'due-soon' : ''}`}
                  style={highlight ? { background: 'rgba(255,205,0,0.12)' } : undefined}
                >
                  <div className="job-item-main">
                    <h3 className="job-title">
                      {job.title || job.position} <span className="at">@</span> {job.company}
                    </h3>

                    <div className={`badge badge-${(job.status || 'Wishlist').toLowerCase()}`}>
                      {job.status || 'Wishlist'}
                    </div>

                    {highlight && (
                      <span
                        className="badge badge-warning"
                        style={{
                          marginLeft: 8,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {dueIn !== null ? `Due in ${dueIn} day${dueIn === 1 ? '' : 's'}` : 'Due soon'}
                      </span>
                    )}
                  </div>

                  <div className="job-meta">
                    {job.location && <span className="meta-chip">{job.location}</span>}
                    {job.deadline && <span className="meta-chip">Deadline: {formatDate(job.deadline)}</span>}
                  </div>

                  {job.job_link && (
                    <p className="job-link">
                      <a href={job.job_link} target="_blank" rel="noreferrer">
                        View job posting ↗
                      </a>
                    </p>
                  )}

                  {job.notes && (
                    <p className="job-notes">
                      {job.notes.length > 140 ? `${job.notes.slice(0, 140)}…` : job.notes}
                    </p>
                  )}

                  <div className="job-actions">
                    <Link to={`/edit-job/${job.id}`} className="job-action-link">
                      Edit
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Optional simple pagination controls */}
        <div
          className="job-pagination"
          style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}
        >
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <span>Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
