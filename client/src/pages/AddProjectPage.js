// src/pages/AddProjectPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';
import Sidebar from '../components/Sidebar';

export default function AddProjectPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    link: '',
    tech_stack: ''
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    // basic URL check if provided
    if (form.link) {
      try { new URL(form.link); } catch {
        setErr('Project link must be a valid URL (or leave it empty).');
        return;
      }
    }

    try {
      setBusy(true);
      await axios.post('/projects', form);
      navigate('/dashboard');
    } catch (error) {
      setErr(error?.response?.data?.message || 'Failed to save project.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="m-0 text-2xl font-bold text-blue-900">Add Portfolio Project</h1>
            <p className="mt-1 text-sm text-slate-600">
              Showcase your work—add a project with a description, link, and tech stack.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-900 hover:bg-blue-50 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm max-w-2xl">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-blue-900">Project Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g., Job Tracker Web App"
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-blue-900">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="A short summary of what the project does, your role, and impact…"
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 resize-vertical"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-blue-900">
                Project Link <span className="font-normal text-slate-500">(optional)</span>
              </label>
              <input
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="https://…"
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-blue-900">
                Tech Stack <span className="font-normal text-slate-500">(comma-separated)</span>
              </label>
              <input
                name="tech_stack"
                value={form.tech_stack}
                onChange={handleChange}
                placeholder="React, Node.js, Tailwind, PostgreSQL"
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400"
              />
            </div>

            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {err}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className={`rounded-lg px-4 py-2 font-semibold text-white transition ${
                  busy ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {busy ? 'Saving…' : 'Save Project'}
              </button>

              <Link
                to="/dashboard"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50 transition"
              >
                Cancel
              </Link>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Tip: Use a concise title, a results-focused description, and list only the key technologies.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
