// src/pages/AdminPortfolios.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios, { tokenStore } from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import AdminNotesPanel from '../components/AdminNotesPanel';
import AdminAccessBlock from '../components/AdminAccessBlock';

export default function AdminPortfolios({ user, setUser }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(20);

  // filters
  const [q, setQ]                 = useState('');
  const [userId, setUserId]       = useState('');
  const [isPublic, setIsPublic]   = useState(''); // '', '1', '0'
  const [dateFrom, setFrom]       = useState('');
  const [dateTo, setTo]           = useState('');
  const [sort, setSort]           = useState('created_at');
  const [order, setOrder]         = useState('desc');

  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState('');

  const [editing, setEditing]     = useState({}); // { [id]: true }
  const [form, setForm]           = useState({}); // { [id]: { title, slug, summary, is_public } }
  const [notesFor, setNotesFor]   = useState(null); // { type:'portfolio', id }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const navigate = useNavigate();

  function setEditField(id, key, val) {
    setForm(prev => ({ ...prev, [id]: { ...prev[id], [key]: val } }));
  }

  function startEdit(p) {
    setEditing(prev => ({ ...prev, [p.id]: true }));
    setForm(prev => ({
      ...prev,
      [p.id]: {
        title:   p.title   || '',
        slug:    p.slug    || '',       // adjust if your API uses different field
        summary: p.summary || '',       // optional field; remove if not present
        is_public: Number(p.is_public) ? 1 : 0,
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
      const { data } = await axios.patch(`/admin/portfolios/${id}`, payload);
      setItems(prev => prev.map(p => p.id === id ? data : p));
      cancelEdit(id);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to save portfolio');
    }
  }

  async function togglePublic(id, current) {
    try {
      const { data } = await axios.patch(`/admin/portfolios/${id}`, { is_public: current ? 0 : 1 });
      setItems(prev => prev.map(p => p.id === id ? data : p));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to update visibility');
    }
  }

  async function deletePortfolio(id) {
    if (!window.confirm('Delete this portfolio?')) return;
    try {
      await axios.delete(`/admin/portfolios/${id}`);
      setItems(prev => prev.filter(p => p.id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to delete portfolio');
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

  function openPublicLink(p) {
    const url = p.public_url || (p.slug ? `/p/${p.slug}` : '');
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function fetchPortfolios(retried = false) {
    setLoading(true); setErr('');
    try {
      const { data } = await axios.get('/admin/portfolios', {
        params: {
          q: q || undefined,
          user_id: userId || undefined,
          is_public: isPublic !== '' ? isPublic : undefined,
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
            return fetchPortfolios(true);
          }
        } catch {}
      }
      setErr(e?.response?.data?.message || e.message || 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPortfolios(false); /* eslint-disable-next-line */ }, [page, limit, isPublic, userId, sort, order]);
  const onSearch = (e) => { e?.preventDefault?.(); setPage(1); fetchPortfolios(false); };

  const toggleSort = (col) => {
    if (sort === col) setOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setOrder('asc'); }
  };

return (
  <AdminShell user={user} setUser={setUser}>
    <h2 className="text-xl font-bold text-blue-900">Access Restricted</h2>
    <AdminAccessBlock
      title="Jobs & Portfolios are user-only"
      note="For security and privacy, admins can only see aggregate analytics. Use the Analytics, Audit Log, and System Health sections."
    />
  </AdminShell>
);
}

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
