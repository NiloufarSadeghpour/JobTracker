import { useState, useEffect } from 'react';
import './JobForm.css';

export default function JobForm({ mode, onSubmit, initialData = {} }) {
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
      try { new URL(form.job_link); } catch { e.job_link = 'Enter a valid URL'; }
    }

    // Optional: prevent past deadlines
    if (form.deadline) {
      const d = new Date(form.deadline);
      if (Number.isNaN(d.getTime())) e.deadline = 'Invalid date';
      // if (d < new Date().setHours(0,0,0,0)) e.deadline = 'Deadline cannot be in the past';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // normalize optional fields: trim + empty -> null
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
      status: form.status,          // assume enum handled by backend
      deadline: clean(form.deadline),
      tags: clean(form.tags),
      notes: clean(form.notes),
    };

    onSubmit(payload);
  };

  return (
    <form className="job-form" onSubmit={handleSubmit} noValidate>
      <input
        name="title"
        placeholder="Title"
        value={form.title}
        onChange={handleChange}
        required
        aria-invalid={!!errors.title}
      />
      {errors.title && <small className="field-error">{errors.title}</small>}

      <input
        name="company"
        placeholder="Company"
        value={form.company}
        onChange={handleChange}
        required
        aria-invalid={!!errors.company}
      />
      {errors.company && <small className="field-error">{errors.company}</small>}

      <input
        name="location"
        placeholder="Location"
        value={form.location}
        onChange={handleChange}
      />

      <input
        type="url"
        name="job_link"
        placeholder="Job Link"
        value={form.job_link}
        onChange={handleChange}
        aria-invalid={!!errors.job_link}
      />
      {errors.job_link && <small className="field-error">{errors.job_link}</small>}

      <select name="status" value={form.status} onChange={handleChange}>
        <option>Wishlist</option>
        <option>Applied</option>
        <option>Interview</option>
        <option>Offer</option>
        <option>Rejected</option>
      </select>

      <input
        type="date"
        name="deadline"
        value={form.deadline || ''}
        onChange={handleChange}
        aria-invalid={!!errors.deadline}
      />
      {errors.deadline && <small className="field-error">{errors.deadline}</small>}

      <input
        name="tags"
        placeholder="Tags (comma separated)"
        value={form.tags}
        onChange={handleChange}
      />

      <textarea
        name="notes"
        placeholder="Notes"
        value={form.notes}
        onChange={handleChange}
        rows={4}
      />

      <button className="job-submit-btn" type="submit">
        {mode === 'edit' ? 'Update Job' : 'Add Job'}
      </button>
    </form>
  );
}
