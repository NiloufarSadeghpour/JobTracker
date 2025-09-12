// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios, { tokenStore } from '../utils/axios';
import { Link } from 'react-router-dom';
import AdminShell from '../components/AdminShell';

export default function AdminDashboard({ user, setUser }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchStats(retried = false) {
    try {
      const res = await axios.get('/admin/stats');
      setData(res.data);
      setErr('');
    } catch (e) {
      const status = e?.response?.status;
      if (!retried && status === 401) {
        // try one silent refresh then retry
        try {
          const r = await axios.post('/auth/refresh');
          if (r?.data?.accessToken) {
            tokenStore.set(r.data.accessToken);
            setUser?.(r.data.user);
            return fetchStats(true);
          }
        } catch {}
      }
      setErr(e?.response?.data?.message || e.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(false); /* eslint-disable-next-line */ }, []);

  const retry = () => {
    setLoading(true);
    fetchStats(false);
  };

  return (
    <AdminShell user={user} setUser={setUser}>

      {loading && <p style={{ marginTop: 8 }}>Loading…</p>}

      {err && (
        <div style={errBox}>
          {err} <button onClick={retry} style={retryBtn}>Retry</button>
        </div>
      )}

      {data && !err && !loading && <DashboardBody data={data} />}
    </AdminShell>
  );
}

function DashboardBody({ data }) {
  const users = data?.users ?? {};
  const jobs  = data?.jobs ?? {};
  const portfolios = data?.portfolios ?? {};
  const audits = data?.audits ?? [];
  
  const totalJobs =
    (Number(jobs.wishlist)||0) +
    (Number(jobs.applied)||0) +
    (Number(jobs.interview)||0) +
    (Number(jobs.offer)||0) +
    (Number(jobs.rejected)||0);

  const bars = [
    { label: 'Wishlist',  val: Number(jobs.wishlist)||0 },
    { label: 'Applied',   val: Number(jobs.applied)||0 },
    { label: 'Interview', val: Number(jobs.interview)||0 },
    { label: 'Offer',     val: Number(jobs.offer)||0 },
    { label: 'Rejected',  val: Number(jobs.rejected)||0 },
  ];

  return (
    <div style={wrap}>
      <h2 className="text-xl font-bold text-blue-900 mb-3">Admin Dashboard</h2>

      <section style={grid}>
        <Card title="Total Users" value={users.users_total}>
          <Link to="/admin/users" style={cardLink}>Manage users →</Link>
        </Card>
        <Card title="Admins" value={users.admins} />
        <Card title="Active Users" value={users.active_users} />
        <Card title="Portfolios" value={portfolios.portfolios_total}>
        </Card>
        <Card title="Public Portfolios" value={portfolios.public_portfolios} />
        <Card title="Jobs (aggregate)" value={totalJobs}>
          <Link to="/admin/analytics" style={cardLink}>Open analytics →</Link>
        </Card>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3 className="text-lg font-bold text-blue-900 mb-2">Job Pipeline</h3>
        {bars.map(b => {
          const pct = totalJobs ? Math.round((b.val / totalJobs) * 100) : 0;
          return (
            <div key={b.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span className="text-blue-900 font-medium">{b.label}</span>
                <span className="text-slate-600">{b.val} ({pct}%)</span>
              </div>
              <div style={barTrack}>
                <div style={{ ...barFill, width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <Panel title="Recent Users">
          <ul style={list}>
            {(data?.recent?.users || []).map(u => (
              <li key={u.id} style={li}>
                <div className="text-blue-900"><b>{u.username}</b> <span className="opacity-60">({u.email})</span></div>
                <small className="opacity-60">{new Date(u.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recent Admin Activity">
          <ul style={list}>
            {(audits || []).map(a => (
              <li key={a.id} style={li}>
                <div className="text-blue-900"><b>{a.action}</b> <span className="opacity-60">by {a.actor}</span></div>
                <small className="opacity-60">{new Date(a.created_at).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <div className="text-xs text-slate-500 mt-2">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

function Card({ title, value, children }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, color: '#1a3a7c', opacity: 0.8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1e40af' }}>{Number(value) || 0}</div>
      {children}
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={panel}>
      <div className="text-blue-900 font-bold mb-2">{title}</div>
      {children}
    </div>
  );
}

const wrap   = { maxWidth: 1200, margin: '0 auto', padding: '8px 24px 32px' };
const grid   = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' };

const card   = {
  padding: 16,
  border: '1px solid #dbe7ff',
  borderRadius: 16,
  background: '#ffffff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  display: 'grid',
  gap: 6
};

const panel = {
  border: '1px solid #dbe7ff',
  borderRadius: 16,
  background: '#ffffff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  padding: 16
};

const cardLink = { fontSize: 12, textDecoration: 'none', color: '#3b82f6', fontWeight: 600 };

const barTrack = { height: 10, background: '#e6efff', borderRadius: 999, overflow: 'hidden' };
const barFill  = { height: 10, background: 'linear-gradient(90deg,#4a90e2,#72aaff)' };

const list   = { listStyle: 'none', padding: 0, margin: 0 };
const li     = { padding: '8px 0', borderBottom: '1px solid #f3f6ff', display:'flex', alignItems:'center', justifyContent:'space-between' };

const errBox = { background:'#ffe9e9', border:'1px solid #ffb3b3', padding:10, borderRadius:8, marginTop:10, color:'#900', display:'inline-flex', gap:8, alignItems:'center' };
const retryBtn = { padding:'6px 10px', border:'1px solid #ccc', borderRadius:8, background:'#fff' };