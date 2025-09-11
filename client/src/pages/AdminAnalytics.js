// src/pages/AdminAnalytics.jsx
import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import AdminShell from '../components/AdminShell';

export default function AdminAnalytics({ user, setUser }) {
  const [data, setData] = useState(null); const [err, setErr] = useState(''); const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get('/admin/analytics'); setData(data); }
      catch (e) { setErr(e?.response?.data?.message || 'Failed to load analytics'); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <AdminShell user={user} setUser={setUser}>
      <h2 className="text-xl font-bold text-blue-900">Analytics</h2>
      {loading && <p>Loading…</p>}
      {err && <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg mb-3">{err}</div>}
      {data && (
        <div className="grid gap-3 md:grid-cols-3">
          <Metric title="Signups (30d)" value={data.signups_30d}/>
          <Metric title="DAU" value={data.dau}/>
          <Metric title="Public Portfolios" value={data.public_portfolios}/>
          {/* add small charts later */}
        </div>
      )}
    </AdminShell>
  );
}
function Metric({ title, value }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-4">
      <div className="text-sm text-blue-900/80">{title}</div>
      <div className="text-2xl font-bold text-blue-900">{Number(value)||0}</div>
    </div>
  );
}
