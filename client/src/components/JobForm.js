// src/components/JobForm.js
import { useState, useEffect } from 'react';

const STATUSES = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function JobForm({ mode = 'create', onSubmit, initialData = {} }) {
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    job_link: '',
    status: 'Wishlist',
    deadline: '',
    tags: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm(prev => ({ ...prev, ...initialData }));
    }
  }, [mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.company.trim()) e.company = 'Company is required';

    if (form.job_link) {
      try { new URL(form.job_link); } catch { e.job_link = 'Enter a valid URL (e.g. https://...)'; }
    }

    if (form.deadline) {
      const d = new Date(form.deadline);
      if (Number.isNaN(d.getTime())) e.deadline = 'Invalid date';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const clean = (v) => {
      if (v === null || v === undefined) return null;
      const t = String(v).trim();
      return t === '' ? null : t;
    };

    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      location: clean(form.location),
      job_link: clean(form.job_link),
      status: form.status,
      deadline: clean(form.deadline),
      tags: clean(form.tags),
      notes: clean(form.notes),
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      {/* Title + Company */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-blue-900">Title *</label>
          <input
            name="title"
            placeholder="e.g. Frontend Developer"
            value={form.title}
            onChange={handleChange}
            aria-invalid={!!errors.title}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.title ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'}`}
            required
          />
          {errors.title && <small className="text-red-700">{errors.title}</small>}
        </div>

        <div>
          <label className="text-sm font-semibold text-blue-900">Company *</label>
          <input
            name="company"
            placeholder="e.g. OpenAI"
            value={form.company}
            onChange={handleChange}
            aria-invalid={!!errors.company}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.company ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'}`}
            required
          />
          {errors.company && <small className="text-red-700">{errors.company}</small>}
        </div>
      </div>

      {/* Location + Link */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-blue-900">Location</label>
          <input
            name="location"
            placeholder="Remote / London / Berlin..."
            value={form.location}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-blue-900">Job Link</label>
          <input
            type="url"
            name="job_link"
            placeholder="https://company.com/jobs/123"
            value={form.job_link}
            onChange={handleChange}
            aria-invalid={!!errors.job_link}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.job_link ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'}`}
          />
          {errors.job_link && <small className="text-red-700">{errors.job_link}</small>}
        </div>
      </div>

      {/* Status + Deadline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-semibold text-blue-900">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2"
          >
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-blue-900">Deadline</label>
          <input
            type="date"
            name="deadline"
            value={form.deadline || ''}
            onChange={handleChange}
            aria-invalid={!!errors.deadline}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${errors.deadline ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white'}`}
          />
          {errors.deadline && <small className="text-red-700">{errors.deadline}</small>}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-semibold text-blue-900">Tags</label>
        <input
          name="tags"
          placeholder="comma separated (e.g. remote, frontend)"
          value={form.tags}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="text-sm font-semibold text-blue-900">Notes</label>
        <textarea
          name="notes"
          placeholder="Add any details or reminders…"
          value={form.notes}
          onChange={handleChange}
          rows={4}
          className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 resize-y"
        />
      </div>

      <div className="pt-1">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 transition"
        >
          {mode === 'edit' ? 'Update Job' : 'Add Job'}
        </button>
      </div>
    </form>
  );
}
