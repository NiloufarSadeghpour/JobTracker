// src/pages/JobListPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import Sidebar from '../components/Sidebar';

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
        const http = err?.response?.status;
        if (http === 401 || http === 403) {
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

  const badgeClass = (s) => {
    const k = (s || 'Wishlist').toLowerCase();
    switch (k) {
      case 'wishlist':  return 'bg-slate-100 text-slate-700';
      case 'applied':   return 'bg-blue-100 text-blue-800';
      case 'interview': return 'bg-emerald-100 text-emerald-800';
      case 'offer':     return 'bg-amber-100 text-amber-900';
      case 'rejected':  return 'bg-rose-100 text-rose-800';
      default:          return 'bg-slate-100 text-slate-700';
    }
  };

  const safeJobs = Array.isArray(jobs) ? jobs : [];

  return (
    <div className="flex min-h-[calc(100vh-120px)] bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="m-0 text-2xl font-bold text-blue-900">Your Jobs</h1>
            <p className="mt-1 text-sm text-slate-600">
              Filter, sort, and manage your applications in one place.
            </p>
          </div>
          <Link
            to="/add-job"
            className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            + Add Job
          </Link>
        </div>

        {/* Filters card */}
        <div className="mb-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Search title, company, or tags…"
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="rounded-lg border border-blue-200 px-3 py-2 outline-none focus:border-blue-400"
            />

            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="rounded-lg border border-blue-200 px-3 py-2 outline-none focus:border-blue-400"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Tags (comma-separated, e.g. react,remote)"
              value={tags}
              onChange={(e) => { setPage(1); setTags(e.target.value); }}
              className="rounded-lg border border-blue-200 px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {state.loading && (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 text-slate-700 shadow-sm">
            Loading…
          </div>
        )}
        {!state.loading && state.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
            {state.error}
          </div>
        )}

        {/* List */}
        {!state.loading && !state.error && (
          <>
            {safeJobs.length === 0 ? (
              <div className="rounded-2xl border border-blue-100 bg-white p-6 text-slate-700 shadow-sm">
                No jobs match your filters.{' '}
                <Link to="/add-job" className="font-semibold text-blue-700 underline">
                  Add a job
                </Link>{' '}
                or clear filters.
              </div>
            ) : (
              <ul className="grid gap-3">
                {safeJobs.map((job) => {
                  const dueIn = typeof job.due_in_days === 'number' ? job.due_in_days : null;
                  const highlight = job.highlight === 1 || (dueIn !== null && dueIn >= 3 && dueIn <= 5);

                  return (
                    <li
                      key={job.id}
                      className={`rounded-xl border p-4 shadow-sm transition ${
                        highlight
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-blue-100 bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-lg font-semibold text-slate-900">
                          {job.title || job.position} <span className="font-normal text-slate-500">@</span> {job.company}
                        </h3>

                        <span className={`ml-auto rounded-full px-3 py-1 text-sm font-semibold ${badgeClass(job.status)}`}>
                          {job.status || 'Wishlist'}
                        </span>

                        {highlight && (
                          <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                            {dueIn !== null ? `Due in ${dueIn} day${dueIn === 1 ? '' : 's'}` : 'Due soon'}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {job.location && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                            {job.location}
                          </span>
                        )}
                        {job.deadline && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                            Deadline: {formatDate(job.deadline)}
                          </span>
                        )}
                      </div>

                      {job.job_link && (
                        <p className="mt-2 text-sm">
                          <a
                            href={job.job_link}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-blue-700 underline"
                          >
                            View job posting ↗
                          </a>
                        </p>
                      )}

                      {job.notes && (
                        <p className="mt-1 text-slate-700">
                          {job.notes.length > 140 ? `${job.notes.slice(0, 140)}…` : job.notes}
                        </p>
                      )}

                      <div className="mt-3">
                        <Link
                          to={`/edit-job/${job.id}`}
                          className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-900 hover:bg-blue-50 transition"
                        >
                          Edit
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  page <= 1
                    ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                    : 'border border-blue-200 bg-white text-blue-900 hover:bg-blue-50'
                }`}
              >
                Prev
              </button>
              <span className="px-2 text-sm text-slate-700">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-900 hover:bg-blue-50 transition"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
