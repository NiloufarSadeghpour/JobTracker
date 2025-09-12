// src/pages/AdminJobs.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios, { tokenStore } from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import AdminNotesPanel from '../components/AdminNotesPanel';
import AdminAccessBlock from '../components/AdminAccessBlock';

const STATUSES = ['Wishlist','Applied','Interview','Offer','Rejected'];

export default function AdminJobs({ user, setUser }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(20);

  const [q, setQ]             = useState('');
  const [status, setStatus]   = useState('');
  const [userId, setUserId]   = useState('');
  const [dateFrom, setFrom]   = useState('');
  const [dateTo, setTo]       = useState('');
  const [sort, setSort]       = useState('created_at');
  const [order, setOrder]     = useState('desc');

  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  const [editing, setEditing] = useState({}); 
  const [form, setForm]       = useState({}); 
  const [notesFor, setNotesFor] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const navigate = useNavigate();

  function setEditField(id, key, val) {
    setForm(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
  }

  function startEdit(job) {
    setEditing(prev => ({ ...prev, [job.id]: true }));
    setForm(prev => ({
      ...prev,
      [job.id]: {
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        job_link: job.job_link || '',
        status: job.status || 'Wishlist',
        tags: job.tags || '',
        deadline: job.deadline ? job.deadline.slice(0,10) : '',
        date_applied: job.date_applied ? job.date_applied.slice(0,10) : '',
        notes: job.notes || '',
      }
    }));
  }

  function cancelEdit(id) {
    setEditing(prev => { const c = { ...prev }; delete c[id]; return c; });
    setForm(prev => { const c = { ...prev }; delete c[id]; return c; });
  }

  async function saveEdit(id) {
    try {
      const payload = form[id];
      const { data } = await axios.patch(`/admin/jobs/${id}`, payload);
      setItems(prev => prev.map(j => j.id === id ? data : j));
      cancelEdit(id);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to save job');
    }
  }

  async function quickStatus(id, newStatus) {
    try {
      const { data } = await axios.patch(`/admin/jobs/${id}`, { status: newStatus });
      setItems(prev => prev.map(j => j.id === id ? data : j));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to update status');
    }
  }

  async function deleteJob(id) {
    if (!window.confirm('Delete this job?')) return;
    try {
      await axios.delete(`/admin/jobs/${id}`);
      setItems(prev => prev.filter(j => j.id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to delete job');
    }
  }

  async function impersonate(uid) {
    if (!window.confirm('Switch to this user session?')) return;
    try {
      const { data } = await axios.post('/admin/impersonate', { user_id: uid });
      if (data?.accessToken) {
        tokenStore.set(data.accessToken);
        setUser?.(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard', { replace: true });
      }
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to impersonate');
    }
  }

  async function fetchJobs(retried = false) {
    setLoading(true); setErr('');
    try {
      const { data } = await axios.get('/admin/jobs', {
        params: {
          q: q || undefined,
          status: status || undefined,
          user_id: userId || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          page, limit, sort, order
        }
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      const s = e?.response?.status;
      if (!retried && s === 401) {
        try {
          const r = await axios.post('/auth/refresh');
          if (r?.data?.accessToken) {
            tokenStore.set(r.data.accessToken);
            setUser?.(r.data.user);
            return fetchJobs(true);
          }
        } catch {}
      }
      setErr(e?.response?.data?.message || e.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchJobs(false); /* eslint-disable-next-line */ }, [page, limit, status, userId, sort, order]);
  const onSearch = (e) => { e?.preventDefault?.(); setPage(1); fetchJobs(false); };

  const toggleSort = (col) => {
    if (sort === col) setOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setOrder('asc'); }
  };

  const openLink = (url) => { if (url) window.open(url, '_blank', 'noopener,noreferrer'); };

return (
  <AdminShell user={user} setUser={setUser}>
    <h2 className="text-xl font-bold text-blue-900">Access Restricted</h2>
    <AdminAccessBlock
      title="Jobs & Portfolios are user-only"
      note="For security and privacy, admins can only see aggregate analytics. Use the Analytics, Audit Log, and System Health sections."
    />
  </AdminShell>
);

function Th({ label, col, sort, order, onSort }) {
  const is = sort === col;
  return (
    <th
      onClick={()=>onSort(col)}
      title="Sort"
      className="text-left px-4 py-3 text-blue-900 text-sm font-semibold select-none cursor-pointer whitespace-nowrap"
    >
      {label} {is ? (order === 'asc' ? '▲' : '▼') : ''}
    </th>
  );
}
}
