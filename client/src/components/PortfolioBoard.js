// src/components/PortfolioBoard.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { Eye, EyeOff, ExternalLink, Trash2, Pencil } from 'lucide-react';

export default function PortfolioBoard() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/portfolios/me');
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load portfolios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePublic = async (p) => {
    try {
      await axios.put(`/portfolios/${p.id}`, { is_public: !p.is_public });
      setList(cur => cur.map(x => x.id === p.id ? { ...x, is_public: !x.is_public } : x));
    } catch (e) {
      alert('Could not update visibility');
    }
  };

  const handleDelete = async (p, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this portfolio?')) return;
    try {
      await axios.delete(`/portfolios/${p.id}`);
      setList(cur => cur.filter(x => x.id !== p.id));
    } catch {
      alert('Delete failed');
    }
  };

  const goEdit = (p) => {
    navigate('/portfolio-builder', { state: { initialData: p || {} } });
  };

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">{error}</div>;
  }

  if (!list.length) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
        <p className="text-slate-700">No portfolios yet.</p>
        <button
          onClick={() => goEdit(null)}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
        >
          + Create your first portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map(p => (
        <div
          key={p.id}
          onClick={() => goEdit(p)}     // click card = edit
          className="cursor-pointer rounded-2xl border border-blue-100 bg-white p-4 shadow-sm hover:shadow-md transition"
          title="Click to edit"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-blue-900 m-0">{p.title || 'Untitled Portfolio'}</h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                p.is_public
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {p.is_public ? 'Public' : 'Private'}
            </span>
          </div>

          {/* Meta */}
          <div className="mt-2 text-sm text-slate-700">
            <div className="truncate">
              <span className="opacity-70">Slug:</span> <code>{p.slug}</code>
            </div>
            <div className="opacity-70">
              Updated: {p.updated_at ? new Date(p.updated_at).toLocaleString() : '—'}
            </div>
          </div>

          {/* Actions */}
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            onClick={(e) => e.stopPropagation()} // prevent card click when pressing buttons/links
          >
            {p.is_public ? (
              <a
                href={`/p/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 hover:bg-blue-50 transition"
                title="Open public page"
              >
                View public <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => togglePublic(p)}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 hover:bg-blue-50 transition"
              title={p.is_public ? 'Make private' : 'Make public'}
            >
              {p.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {p.is_public ? 'Make private' : 'Make public'}
            </button>

            <button
              type="button"
              onClick={() => goEdit(p)}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-blue-900 hover:bg-blue-50 transition"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>

            <button
              type="button"
              onClick={(e) => handleDelete(p, e)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100 transition"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
