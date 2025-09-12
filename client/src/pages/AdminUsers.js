// src/pages/AdminUsers.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { tokenStore } from '../utils/axios';
import AdminShell from '../components/AdminShell';
import AdminNotesPanel from '../components/AdminNotesPanel';

export default function AdminUsers({ user, setUser }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(10);

  const [q, setQ]           = useState('');
  const [role, setRole]     = useState('');
  const [active, setActive] = useState('');
  const [sort, setSort]     = useState('created_at');
  const [order, setOrder]   = useState('desc');
  const [notesFor, setNotesFor] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState('');

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username:'', email:'', password:'', role:'user', is_active:1 });

  const [pwEdit, setPwEdit] = useState({}); 

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);
  const navigate = useNavigate();

  async function fetchUsers(retried = false) {
    setLoading(true); setErr('');
    try {
      const { data } = await axios.get('/admin/users', {
        params: {
          q: q || undefined,
          role: role || undefined,
          is_active: active !== '' ? active : undefined,
          page, limit, sort, order
        }
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      const status = e?.response?.status;
      const payload = e?.response?.data;
      if (!retried && status === 401) {
        try {
          const r = await axios.post('/auth/refresh');
          if (r?.data?.accessToken) {
            tokenStore.set(r.data.accessToken);
            setUser?.(r.data.user);
            return fetchUsers(true);
          }
        } catch {}
      }
      setErr(
        (payload?.message || e.message || 'Failed to load users') +
        (payload?.path ? ` @ ${payload.path}` : '')
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(false); /* eslint-disable-next-line */ }, [page, limit, role, active, sort, order]);

  const onSearch = (e) => { e?.preventDefault?.(); setPage(1); fetchUsers(false); };

  const resetCreateForm = () => setForm({ username:'', email:'', password:'', role:'user', is_active:1 });

  async function createUser() {
    if (!form.username || !form.email || !form.password) return;
    try {
      const { data } = await axios.post('/admin/users', form);
      setCreating(false);
      resetCreateForm();
      setItems(prev => [data, ...prev]);
      setTotal(t => t + 1);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to create user');
    }
  }

  async function updateUser(id, patch) {
    try {
      const { data } = await axios.patch(`/admin/users/${id}`, patch);
      setItems(prev => prev.map(u => (u.id === id ? data : u)));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to update user');
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Delete this user and all their data?')) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      setItems(prev => prev.filter(u => u.id !== id));
      setTotal(t => Math.max(0, t - 1));
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to delete user');
    }
  }

  const applyPassword = async (id) => {
    const newPass = pwEdit[id];
    if (!newPass) return;
    try {
      await updateUser(id, { password: newPass });
      setPwEdit(prev => { const c = { ...prev }; delete c[id]; return c; });
    } catch (_) {}
  };

  const impersonate = async (id) => {
    if (!window.confirm('Switch to this user session? (You will leave admin view)')) return;
    try {
      const { data } = await axios.post('/admin/impersonate', { user_id: id });
      if (data?.accessToken) {
        tokenStore.set(data.accessToken);
        setUser?.(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard', { replace: true });
      } else {
        alert('Failed to impersonate user');
      }
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Failed to impersonate user');
    }
  };

  const toggleSort = (col) => {
    if (sort === col) setOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setOrder('asc'); }
  };

  return (
    <AdminShell user={user} setUser={setUser}>
      <h2 className="text-xl font-bold text-blue-900">Manage Users</h2>

      {/* Filters / Actions */}
      <form onSubmit={onSearch} className="mt-3 mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search name or email"
          className="px-3 py-2 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
        <select
          value={role}
          onChange={e=>setRole(e.target.value)}
          className="px-3 py-2 rounded-lg border border-blue-200 bg-white"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={active}
          onChange={e=>setActive(e.target.value)}
          className="px-3 py-2 rounded-lg border border-blue-200 bg-white"
        >
          <option value="">All statuses</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>

        <button type="submit" className="px-3 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
          Search
        </button>

        <div className="flex-1" />
        <button
          type="button"
          onClick={()=>setCreating(v=>!v)}
          className="px-3 py-2 rounded-lg font-semibold border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 transition"
        >
          {creating ? 'Close' : 'Add User'}
        </button>
      </form>

      {/* Create Card */}
      {creating && (
        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm mb-4">
          <h3 className="text-blue-900 font-bold mb-3">Create User</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            <label className="text-sm text-blue-900 font-medium flex flex-col gap-1">
              Username
              <input
                className="px-3 py-2 rounded-lg border border-blue-200 bg-white"
                value={form.username}
                onChange={e=>setForm({...form, username:e.target.value})}
              />
            </label>
            <label className="text-sm text-blue-900 font-medium flex flex-col gap-1">
              Email
              <input
                type="email"
                className="px-3 py-2 rounded-lg border border-blue-200 bg-white"
                value={form.email}
                onChange={e=>setForm({...form, email:e.target.value})}
              />
            </label>
            <label className="text-sm text-blue-900 font-medium flex flex-col gap-1">
              Password
              <input
                type="password"
                className="px-3 py-2 rounded-lg border border-blue-200 bg-white"
                value={form.password}
                onChange={e=>setForm({...form, password:e.target.value})}
              />
            </label>
            <label className="text-sm text-blue-900 font-medium flex flex-col gap-1">
              Role
              <select
                className="px-3 py-2 rounded-lg border border-blue-200 bg-white"
                value={form.role}
                onChange={e=>setForm({...form, role:e.target.value})}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="text-sm text-blue-900 font-medium flex flex-col gap-1">
              Active
              <select
                className="px-3 py-2 rounded-lg border border-blue-200 bg-white"
                value={String(form.is_active)}
                onChange={e=>setForm({...form, is_active:Number(e.target.value)})}
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </label>
          </div>
          <button
            onClick={createUser}
            className="mt-3 px-3 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Create
          </button>
        </div>
      )}

      {/* Alerts */}
      {err && <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg mb-3">{err}</div>}
      {loading && <p className="text-slate-600">Loading…</p>}
      {!loading && !err && !items.length && <p className="text-slate-600">No users found.</p>}

      {/* Table */}
      {!!items.length && (
        <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-blue-50 border-b border-blue-100">
                <tr>
                  <Th label="ID" col="id" sort={sort} order={order} onSort={toggleSort} />
                  <Th label="Username" col="username" sort={sort} order={order} onSort={toggleSort} />
                  <Th label="Email" col="email" sort={sort} order={order} onSort={toggleSort} />
                  <Th label="Role" col="role" sort={sort} order={order} onSort={toggleSort} />
                  <Th label="Active" col="is_active" sort={sort} order={order} onSort={toggleSort} />
                  <Th label="Created" col="created_at" sort={sort} order={order} onSort={toggleSort} />
                  <th className="text-left px-4 py-3 text-blue-900 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {items.map(u => (
                  <React.Fragment key={u.id}>
                    <tr className="hover:bg-blue-50/40 transition">
                      <td className="px-4 py-3 text-sm text-slate-700">{u.id}</td>
                      <td className="px-4 py-3 text-sm text-blue-900 font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e)=>updateUser(u.id, { role: e.target.value })}
                          className="px-2 py-1 rounded-md border border-blue-200 bg-white text-sm"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={String(u.is_active)}
                          onChange={(e)=>updateUser(u.id, { is_active: Number(e.target.value) })}
                          className="px-2 py-1 rounded-md border border-blue-200 bg-white text-sm"
                        >
                          <option value="1">yes</option>
                          <option value="0">no</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(u.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={()=>impersonate(u.id)} className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 font-semibold text-xs">
                            Impersonate
                          </button>

                          {pwEdit[u.id] === undefined ? (
                            <button onClick={()=>setPwEdit({ ...pwEdit, [u.id]: '' })} className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 font-semibold text-xs">
                              Set Password
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <input
                                type="password"
                                value={pwEdit[u.id]}
                                onChange={e=>setPwEdit({ ...pwEdit, [u.id]: e.target.value })}
                                placeholder="New password"
                                className="px-2 py-1 rounded-md border border-blue-200 bg-white text-sm w-40"
                              />
                              <button onClick={()=>applyPassword(u.id)} className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 font-semibold text-xs">
                                Save
                              </button>
                              <button onClick={()=>{ const c={...pwEdit}; delete c[u.id]; setPwEdit(c); }} className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 font-semibold text-xs">
                                Cancel
                              </button>
                            </span>
                          )}

                          <button onClick={()=>deleteUser(u.id)} className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs">
                            Delete
                          </button>

                          <button onClick={()=>setNotesFor({ type:'user', id: u.id })} className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 font-semibold text-xs">
                            Notes
                          </button>
                        </div>
                      </td>
                    </tr>

                    {notesFor?.type === 'user' && notesFor?.id === u.id && (
                      <tr className="bg-blue-50/40">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                            <AdminNotesPanel
                              entityType="user"
                              entityId={u.id}
                              onClose={()=>setNotesFor(null)}
                              user={user}
                              setUser={setUser}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          disabled={page<=1}
          onClick={()=>setPage(p=>p-1)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:bg-slate-300 font-semibold text-sm"
        >
          Prev
        </button>
        <span className="text-slate-600">Page {page} / {totalPages}</span>
        <button
          disabled={page>=totalPages}
          onClick={()=>setPage(p=>p+1)}
          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:bg-slate-300 font-semibold text-sm"
        >
          Next
        </button>

        <span className="ml-2 text-slate-700">per page:</span>
        <select
          value={limit}
          onChange={e=>{ setLimit(Number(e.target.value)); setPage(1); }}
          className="px-2 py-1.5 rounded-lg border border-blue-200 bg-white"
        >
          {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </AdminShell>
  );
}

function Th({ label, col, sort, order, onSort }) {
  const is = sort === col;
  return (
    <th
      onClick={()=>onSort(col)}
      title="Sort"
      className="text-left px-4 py-3 text-blue-900 text-sm font-semibold select-none cursor-pointer"
    >
      {label} {is ? (order === 'asc' ? '▲' : '▼') : ''}
    </th>
  );
}
