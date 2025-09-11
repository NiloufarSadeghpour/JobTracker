// src/pages/AdminMessages.jsx
import React, { useEffect, useState } from 'react';
import axios, { tokenStore } from '../utils/axios';
import AdminShell from '../components/AdminShell';
import { Bell } from 'lucide-react';

export default function AdminMessages({ user, setUser }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // compose
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expiresAt, setExpiresAt] = useState(''); // optional

  async function fetchAnnc(retried = false) {
    setLoading(true); setErr('');
    try {
      const { data } = await axios.get('/admin/announcements', { params: { include_expired: 0 } });
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch (e) {
      const s = e?.response?.status;
      if (!retried && s === 401) {
        try {
          const r = await axios.post('/auth/refresh');
          if (r?.data?.accessToken) {
            tokenStore.set(r.data.accessToken);
            setUser?.(r.data.user);
            return fetchAnnc(true);
          }
        } catch {}
      }
      setErr(e?.response?.data?.message || e.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAnnc(false); /* eslint-disable-next-line */ }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    try {
      const { data } = await axios.post('/admin/announcements', {
        title: title.trim(),
        body: body.trim(),
        expires_at: expiresAt || null,
      });
      setItems(prev => [data, ...prev]);
      setTitle(''); setBody(''); setExpiresAt('');
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to create announcement');
    }
  };

  const markRead = async (id) => {
    try {
      await axios.post(`/admin/announcements/${id}/read`);
      setItems(prev => prev.map(a => a.id === id ? { ...a, is_read: 1 } : a));
      setUnread(u => Math.max(0, u - 1));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to mark as read');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`/admin/announcements/${id}`);
      setItems(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to delete');
    }
  };

  return (
    <AdminShell user={user} setUser={setUser}>
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-900" />
        <h2 className="text-xl font-bold text-blue-900">
          Announcements
          {unread ? (
            <span className="ml-2 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-800">
              {unread} unread
            </span>
          ) : null}
        </h2>
      </div>

      {/* Composer */}
      <form onSubmit={create} className="mt-3 mb-4 grid gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
        <input
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={e=>setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 resize-y"
          rows={4}
          placeholder="Write an announcement for all admins…"
          value={body}
          onChange={e=>setBody(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-600">Expires (optional):</label>
          <input
            className="rounded-lg border border-blue-200 bg-white px-3 py-2"
            type="datetime-local"
            value={expiresAt}
            onChange={e=>setExpiresAt(e.target.value)}
          />
          <div className="flex-1" />
          <button
            className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 transition"
            type="submit"
          >
            Publish
          </button>
        </div>
      </form>

      {/* Alerts */}
      {err && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
          {err}
        </div>
      )}
      {loading && <p className="text-slate-600">Loading…</p>}
      {!loading && !err && !items.length && <p className="text-slate-600">No announcements yet.</p>}

      {/* List */}
      {!!items.length && (
        <div className="grid gap-3">
          {items.map(a => {
            const expired = a.expires_at && new Date(a.expires_at).getTime() < Date.now();
            return (
              <div key={a.id} className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="m-0 text-base font-bold text-blue-900">{a.title}</h3>
                  {expired && (
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                      expired
                    </span>
                  )}
                  {!expired && !a.is_read && (
                    <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                      unread
                    </span>
                  )}
                </div>

                <div className="whitespace-pre-wrap text-slate-800">{a.body}</div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span>
                    By <b className="text-slate-800">{a.created_by_username || 'System'}</b> • {new Date(a.created_at).toLocaleString()}
                  </span>
                  {a.expires_at && (
                    <span>Expires {new Date(a.expires_at).toLocaleString()}</span>
                  )}
                  <div className="flex-1" />
                  {!a.is_read && !expired && (
                    <button
                      onClick={()=>markRead(a.id)}
                      className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-50"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={()=>del(a.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
