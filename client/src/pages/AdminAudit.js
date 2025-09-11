// src/pages/AdminAudit.jsx
import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import AdminShell from '../components/AdminShell';

export default function AdminAudit({ user, setUser }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState('');
  useEffect(() => { (async () => {
    try { const { data } = await axios.get('/admin/audit'); setRows(data.items||[]); }
    catch (e) { setErr(e?.response?.data?.message || 'Failed to load audit log'); }
    finally { setLoading(false); }
  })(); }, []);
  return (
    <AdminShell user={user} setUser={setUser}>
      <h2 className="text-xl font-bold text-blue-900">Audit Log</h2>
      {loading && <p>Loading…</p>}
      {err && <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg mb-3">{err}</div>}
      {!!rows.length && (
        <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-50 border-b border-blue-100">
                <tr>
                  <th className="text-left px-4 py-3 text-blue-900 text-sm font-semibold">Time</th>
                  <th className="text-left px-4 py-3 text-blue-900 text-sm font-semibold">Actor</th>
                  <th className="text-left px-4 py-3 text-blue-900 text-sm font-semibold">Action</th>
                  <th className="text-left px-4 py-3 text-blue-900 text-sm font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-sm">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{r.actor}</td>
                    <td className="px-4 py-3 text-sm">{r.action}</td>
                    <td className="px-4 py-3 text-sm">{r.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && !err && !rows.length && <p className="text-slate-600">No audit events yet.</p>}
    </AdminShell>
  );
}
