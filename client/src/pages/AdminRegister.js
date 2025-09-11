// src/pages/AdminRegister.jsx
import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound } from 'lucide-react';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function AdminRegister() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [ok,       setOk]       = useState(false);

  const disabled = !token || !username || !password || password !== confirm;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${BASE}/auth/register-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Failed to register admin');
        setLoading(false);
        return;
      }

      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.user)        localStorage.setItem('user', JSON.stringify(data.user));
      setOk(true);
      setTimeout(() => navigate('/admin', { replace: true }), 600);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-blue-900" />
          <h2 className="text-xl font-bold text-blue-900">Invitation Required</h2>
        </div>
        <p className="text-slate-700">
          This page is only accessible via an admin invitation link.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-blue-900" />
        <h2 className="text-xl font-bold text-blue-900">Create Your Admin Account</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        You were invited to join as an admin. Set your username and password below.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm font-semibold text-blue-900">Username</label>
          <input
            className="rounded-lg border border-blue-200 bg-white px-3 py-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-semibold text-blue-900">Password</label>
          <input
            type="password"
            className="rounded-lg border border-blue-200 bg-white px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <small className="text-xs text-slate-600">
            At least 8 characters, including uppercase, lowercase, number, and symbol.
          </small>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-semibold text-blue-900">Confirm Password</label>
          <input
            type="password"
            className="rounded-lg border border-blue-200 bg-white px-3 py-2"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          {confirm && confirm !== password && (
            <small className="text-xs text-red-700">Passwords do not match.</small>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">
            {error}
          </div>
        )}
        {ok && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-800">
            Admin account created. Redirecting…
          </div>
        )}

        <button
          type="submit"
          disabled={disabled || loading}
          className="mt-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300 transition"
        >
          {loading ? 'Creating…' : 'Create Admin'}
        </button>
      </form>
    </div>
  );
}
