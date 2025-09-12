// src/components/FavoritesBoard.js
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios, { tokenStore } from '../utils/axios';

export default function FavoritesBoard() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [pending, setPending] = useState({}); 

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t && tokenStore?.set) tokenStore.set(t);

    (async () => {
      try {
        const { data } = await axios.get('/favorites?me=1'); // user-scoped
        setFavorites(Array.isArray(data) ? data : data?.items || []);
      } catch (e) {
        setErr(e?.response?.data?.message || 'Failed to fetch favorites');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const unfavorite = async (fav) => {
    // optimistic remove
    const prev = favorites;
    setPending((p) => ({ ...p, [fav.id]: true }));
    setFavorites((list) => list.filter((x) => x.id !== fav.id));

    try {
      // Primary: DELETE by favorite id
      await axios.delete(`/favorites/${fav.id}`);

    } catch (e1) {
      try {
        if (fav.jobId) {
          await axios.delete(`/favorites/job/${fav.jobId}`);
        } else if (fav.type && fav.value) {
          await axios.delete('/favorites', { data: { type: fav.type, value: fav.value } });
        } else {
          throw e1;
        }
      } catch (e2) {
        setFavorites(prev);
        setErr(e2?.response?.data?.message || 'Failed to remove favorite');
      }
    } finally {
      setPending((p) => ({ ...p, [fav.id]: false }));
    }
  };

  return (
    <div className="space-y-4">
      {loading && <p className="text-slate-600">Loading favorites…</p>}
      {err && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
          {err}
        </div>
      )}

      {!loading && !err && favorites.length === 0 && (
        <div className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm text-slate-700">
          No favorites saved yet.{" "}
          <Link to="/jobs" className="text-blue-700 font-semibold hover:underline">
            Browse jobs
          </Link>
          .
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm hover:shadow-md transition"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-wide uppercase text-slate-500">
                  {fav.type || 'Item'}
                </div>
                <div className="mt-1 text-lg font-semibold text-blue-900">
                  {fav.value || fav.title || fav.name || `#${fav.id}`}
                </div>
                {fav.company && (
                  <div className="text-xs text-slate-500">{fav.company}</div>
                )}
              </div>

              <button
                onClick={() => unfavorite(fav)}
                disabled={!!pending[fav.id]}
                className="icon-btn !m-0 text-blue-700"
                title="Unfavorite"
                aria-label="Unfavorite"
              >
                {pending[fav.id] ? '…' : '★ Remove'}
              </button>
            </div>

            {/* Footer actions */}
            <div className="mt-3 flex items-center gap-2">
              {fav.jobId && (
                <Link
                  to={`/jobs/${fav.jobId}`}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition"
                >
                  View
                </Link>
              )}
              {fav.portfolioId && (
                <Link
                  to={`/portfolio/${fav.portfolioId}`}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition"
                >
                  Open Portfolio
                </Link>
              )}
              {fav.resumeId && (
                <Link
                  to={`/resume/${fav.resumeId}`}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 transition"
                >
                  Open CV
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
