import { useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

export default function AddProjectPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    link: '',
    tech_stack: ''
  });

  const navigate = useNavigate();
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/projects', form);
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2>Add Portfolio Project</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Project Title" value={form.title} onChange={handleChange} required /><br />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required /><br />
        <input name="link" placeholder="Project Link (optional)" value={form.link} onChange={handleChange} /><br />
        <input name="tech_stack" placeholder="Tech Stack (e.g. React, Node.js)" value={form.tech_stack} onChange={handleChange} /><br />
        <button type="submit">Save Project</button>
      </form>
    </div>
  );
}
