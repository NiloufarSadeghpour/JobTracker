// src/pages/AdminInvite.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios, { tokenStore } from '../utils/axios';
import AdminShell from '../components/AdminShell';
import { MailPlus, Link as LinkIcon, Clock } from 'lucide-react';

export default function AdminInvite({ user, setUser }) {
  const [email, setEmail]       = useState('');
  const [ttl, setTtl]           = useState(1440); // minutes (24h)
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);

  // existing invites
  const [invites, setInvites]   = useState([]);
  const [iLoading, setILoading] = useState(true);
  const [iError, setIError]     = useState('');

  const frontendBase = useMemo(() => window.location.origin, []);
  const link = result?.token ? `${frontendBase}/admin/register?token=${result.token}` : '';

  async function fetchInvites(retried = false) {
    try {
      const { data } = await axios.get('/admin/invites');
      setInvites(data.items || []);
      setIError('');
    } catch (e) {
      const status = e?.response?.status;
      if (!retried && status === 401) {
        try {
          const r = await axios.post('/auth/refresh');
          if (r?.data?.accessToken) {
            tokenStore.set(r.data.accessToken);
            setUser?.(r.data.user);
            return fetchInvites(true);
          }
        } catch {}
      }
      setIError(e?.response?.data?.message || e.message || 'Failed to load invites');
    } finally {
      setILoading(false);
    }
  }

  useEffect(() => { fetchInvites(false); /* eslint-disable-next-line */ }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data } = await axios.post('/admin/invites', {
        email,
        ttlMinutes: Number(ttl) || 60,
      });
      setResult({ token: data.token, email: data.email, expires_in_minutes: data.expires_in_minutes });
      setEmail('');
      setILoading(true);
      await fetchInvites(false);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text) => { try { await navigator.clipboard.writeText(text); } catch {} };
  const openLink = () => { if (link) window.open(link, '_blank', 'noopener,noreferrer'); };

  const revoke = async (id) => {
    if (!window.confirm('Revoke this invite?')) return;
    try {
      await axios.delete(`/admin/invites/${id}`);
      setInvites(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to revoke invite');
    }
  };

  const statusOf = (it) => {
    const now = Date.now();
    const exp = it.expires_at ? new Date(it.expires_at).getTime() : null;
    if (it.used_at) return { label: `Used ${new Date(it.used_at).toLocaleString()}`, tone: 'used' };
    if (exp && exp < now) return { label: `Expired ${new Date(it.expires_at).toLocaleString()}`, tone: 'expired' };
    return { label: exp ? `Active until ${new Date(it.expires_at).toLocaleString()}` : 'Active', tone: 'active' };
  };

  const inviteLink = (token) => `${frontendBase}/admin/register?token=${token}`;

  return (
    <AdminShell user={user} setUser={setUser}>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <MailPlus className="w-5 h-5 text-blue-900" />
          <h2 className="text-xl font-bold text-blue-900">Invite a New Admin</h2>
        </div>

        {/* Create form */}
        <form onSubmit={onSubmit} className="mt-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-semibold text-blue-900">Email to invite</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="rounded-lg border border-blue-200 bg-white px-3 py-2"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-semibold text-blue-900">Expires in (minutes)</label>
            <input
              type="number"
              min={5}
              value={ttl}
              onChange={e => setTtl(e.target.value)}
              className="w-40 rounded-lg border border-blue-200 bg-white px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              disabled={loading || !email}
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300 transition"
            >
              {loading ? 'Creating…' : 'Create Invite'}
            </button>
          </div>
        </form>

        {/* Result card */}
        {result && (
          <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="grid gap-1 text-slate-800">
              <div><b>Invite for:</b> {result.email}</div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <b>Expires:</b>&nbsp;in {result.expires_in_minutes} minutes
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-1 font-semibold text-blue-900">Private signup link</div>
              <code className="block overflow-x-auto rounded-lg bg-slate-50 px-3 py-2 text-sm border border-blue-100">
                {link}
              </code>

              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => copy(link)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-blue-50">
                  Copy Link
                </button>
                <button onClick={() => copy(result.token)} className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-blue-50">
                  Copy Raw Token
                </button>
                <button onClick={openLink} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-900 hover:bg-blue-100">
                  <LinkIcon className="w-4 h-4" /> Open Link
                </button>
              </div>

              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-800">
                Invite created successfully.
              </div>
            </div>
          </div>
        )}

        {/* Existing invites */}
        <div className="mt-7 flex items-center gap-2">
          <h3 className="text-lg font-bold text-blue-900">Existing Invites</h3>
        </div>

        {iLoading && <p className="text-slate-600">Loading invites…</p>}
        {iError && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">{iError}</div>}
        {!iLoading && !invites.length && <p className="text-slate-600">No invites yet.</p>}

        {!!invites.length && (
          <div className="mt-2 rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-blue-50 border-b border-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Expires</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Created by</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {invites.map(it => {
                    const st = statusOf(it);
                    const tone = st.tone;
                    const chip =
                      tone === 'active'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : tone === 'expired'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-indigo-200 bg-indigo-50 text-indigo-800';
                    return (
                      <tr key={it.id} className="hover:bg-blue-50/40 transition">
                        <td className="px-4 py-3 text-sm text-slate-800">{it.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{new Date(it.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{it.expires_at ? new Date(it.expires_at).toLocaleString() : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${chip}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{it.created_by_username || it.created_by || '—'}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => copy(inviteLink(it.token))}
                              className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold hover:bg-blue-50"
                            >
                              Copy Link
                            </button>
                            <button
                              onClick={() => revoke(it.id)}
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                              disabled={!!it.used_at}
                              title={it.used_at ? 'Already used' : 'Revoke invite'}
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
