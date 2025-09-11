// src/components/JobBoard.js
import { useEffect, useState, useRef } from 'react';
import axios from '../utils/axios';
import { Link } from 'react-router-dom';
import { Heart, Pencil, Trash2, ExternalLink } from 'lucide-react';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [favingId, setFavingId] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await axios.get('/jobs', { params: { limit: 5 } });
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
      await axios.delete(`/jobs/${jobId}`);
      setJobs((prev) => prev.filter((job) => (job.id ?? job._id) !== jobId));
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete job');
    }
  };

  const handleHeart = async (job) => {
    const id = job.id ?? job._id;
    setFavingId(id);
    try {
      await axios.post('/favorites', {
        type: 'job',
        value: `${job.title ?? job.position ?? 'Untitled'} at ${job.company ?? '—'}`,
      });
    } catch (e) {
      console.error('Favorite failed', e);
      alert('Could not save to favorites');
    } finally {
      setFavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
        {err}
      </div>
    );
  }

  const safeJobs = Array.isArray(jobs) ? jobs : [];

  return (
    <div className="grid gap-3">
      {safeJobs.length === 0 ? (
        <p className="text-slate-600">
          No jobs yet.{' '}
          <Link to="/add-job" className="font-semibold text-blue-700 hover:underline">
            Add one
          </Link>{' '}
          to get started!
        </p>
      ) : (
        safeJobs.map((job) => {
          const id = job.id ?? job._id;
          const title = job.title ?? job.position ?? 'Untitled';
          const company = job.company ?? '—';
          const status = job.status || 'Wishlist';
          const created = job.created_at ? String(job.created_at).slice(0, 10) : null;
          const deadline = job.deadline ? String(job.deadline).slice(0, 10) : null;

          return (
            <div
              key={id}
              className="relative rounded-2xl border border-blue-100 bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              {/* Top row: title & actions */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">
                    {title} <span className="font-semibold text-slate-700">@ {company}</span>
                  </h3>
                  <div className="mt-1">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900">
                      {status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Favorite */}
                  <button
                    onClick={() => handleHeart(job)}
                    title="Save to favorites"
                    className="rounded-lg border border-blue-200 bg-white p-2 hover:bg-blue-50 transition"
                  >
                    <Heart className={`h-4 w-4 ${favingId === id ? 'animate-pulse fill-blue-600 text-blue-600' : 'text-blue-900'}`} />
                  </button>

                  {/* Edit */}
                  <Link
                    to={`/edit-job/${id}`}
                    className="rounded-lg border border-blue-200 bg-white p-2 text-blue-900 hover:bg-blue-50 transition"
                    title="Edit job"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(id)}
                    className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100 transition"
                    title="Delete job"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meta row */}
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-3">
                <div>
                  <span className="opacity-70">Created:</span>{' '}
                  {created || '—'}
                </div>
                <div>
                  <span className="opacity-70">Deadline:</span>{' '}
                  {deadline || '—'}
                </div>
                <div className="truncate">
                  {job.job_link ? (
                    <a
                      href={job.job_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:underline"
                      title={job.job_link}
                    >
                      View posting <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="opacity-70">No link</span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
