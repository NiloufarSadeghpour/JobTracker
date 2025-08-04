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

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({ ...form, ...initialData });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required /><br />
      <input name="company" placeholder="Company" value={form.company} onChange={handleChange} required /><br />
      <input name="location" placeholder="Location" value={form.location} onChange={handleChange} /><br />
      <input name="job_link" placeholder="Job Link" value={form.job_link} onChange={handleChange} /><br />
      <select name="status" value={form.status} onChange={handleChange}>
        <option>Wishlist</option>
        <option>Applied</option>
        <option>Interview</option>
        <option>Offer</option>
        <option>Rejected</option>
      </select><br />
      <input type="date" name="deadline" value={form.deadline} onChange={handleChange} /><br />
      <input name="tags" placeholder="Tags (comma separated)" value={form.tags} onChange={handleChange} /><br />
      <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} /><br />
      <button type="submit">{mode === 'edit' ? 'Update Job' : 'Add Job'}</button>
    </form>
  );
}
