// src/pages/AdminExports.jsx
import { useState } from 'react';
import axios from '../utils/axios';
import AdminShell from '../components/AdminShell';

export default function AdminExports({ user, setUser }) {
  const [busy, setBusy] = useState(false);
  const doExport = async (kind) => {
    try {
      setBusy(true);
      const res = await axios.get(`/admin/exports/${kind}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `${kind}-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e?.response?.data?.message || 'Export failed');
    } finally { setBusy(false); }
  };
  return (
    <AdminShell user={user} setUser={setUser}>
      <h2 className="text-xl font-bold text-blue-900">Exports</h2>
      <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-4 flex gap-8 flex-wrap">
        <button disabled={busy} onClick={()=>doExport('users-aggregate')}
          className="px-3 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300">
          Export Users (non-PII)
        </button>
        <button disabled={busy} onClick={()=>doExport('pipeline-aggregate')}
          className="px-3 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300">
          Export Job Pipeline (aggregate)
        </button>
        <button disabled={busy} onClick={()=>doExport('portfolios-aggregate')}
          className="px-3 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300">
          Export Portfolios (aggregate)
        </button>
      </div>
    </AdminShell>
  );
}
