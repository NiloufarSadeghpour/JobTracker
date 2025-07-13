import { useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

export default function AddJobPage() {
  const [form, setForm] = useState({ company: '', position: '', status: 'Applied', dateApplied: '' });
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/jobs', form);
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '2rem' }}>
      <h2>Add a New Job</h2>
      <form onSubmit={handleSubmit}>
        <input name="company" placeholder="Company" value={form.company} onChange={handleChange} required /><br />
        <input name="position" placeholder="Position" value={form.position} onChange={handleChange} required /><br />
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Applied</option>
          <option>Interview</option>
          <option>Offer</option>
          <option>Rejected</option>
        </select><br />
        <input type="date" name="dateApplied" value={form.dateApplied} onChange={handleChange} /><br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
