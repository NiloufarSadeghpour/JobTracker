// src/components/ProjectBoard.js
import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { ExternalLink } from 'lucide-react';

export default function ProjectBoard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get('/projects');
        setProjects(Array.isArray(res.data) ? res.data : (res.data?.data || []));
      } catch (e) {
        setError('Failed to load projects.');
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const parseStack = (v) =>
    Array.isArray(v)
      ? v
      : String(v || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-full rounded bg-slate-200" />
            <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>;
  }

  if (!projects.length) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
        <p className="text-slate-700">No portfolio projects yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => {
        const stack = parseStack(p.tech_stack);
        return (
          <div
            key={p.id || p._id}
            className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="m-0 text-lg font-bold text-blue-900">
                {p.title || 'Untitled Project'}
              </h3>
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 hover:bg-blue-50 transition"
                  title="Open project"
                >
                  View <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            {p.description && (
              <p className="mt-2 text-sm text-slate-700">{p.description}</p>
            )}

            {!!stack.length && (
              <div className="mt-3 flex flex-wrap gap-2">
                {stack.map((t, idx) => (
                  <span
                    key={`${t}-${idx}`}
                    className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
