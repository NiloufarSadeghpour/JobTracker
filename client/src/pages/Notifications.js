// src/pages/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios';
import Sidebar from '../components/Sidebar';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    try {
      setLoading(true); setErr('');
      const { data } = await axios.get('/notifications', { params: { page, limit } });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setErr('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  const markAll = async () => {
    try {
      await axios.post('/notifications/read-all');
      setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch {}
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-blue-900 m-0">Notifications</h2>
            <button
              onClick={markAll}
              className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 font-semibold"
            >
              Mark all read
            </button>
          </div>

          {err && <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg mb-3">{err}</div>}
          {loading && <p className="text-slate-600">Loading…</p>}
          {!loading && !items.length && <p className="text-slate-600">No notifications.</p>}

          {!!items.length && (
            <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
              {items.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-blue-50 ${n.is_read ? '' : 'bg-blue-50/40'}`}
                >
                  <div className="text-blue-900 font-semibold">{n.title}</div>
                  {n.body && <div className="text-slate-700">{n.body}</div>}
                  <div className="flex items-center gap-2 mt-1">
                    {n.link && (
                      <Link to={n.link} className="text-sm text-blue-700 font-semibold underline">
                        Open →
                      </Link>
                    )}
                    <span className="ml-auto text-[12px] text-slate-500">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pager */}
          {total > limit && (
            <div className="flex gap-2 justify-end mt-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:bg-slate-300 font-semibold text-sm"
                disabled={page <= 1}
              >
                Prev
              </button>
              <span className="text-slate-600 text-sm self-center">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:bg-slate-300 font-semibold text-sm"
                disabled={page * limit >= total}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
