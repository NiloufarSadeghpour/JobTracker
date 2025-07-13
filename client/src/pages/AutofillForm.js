import { useEffect, useState } from 'react';
import axios from '../utils/axios';

export default function AutofillForm() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    coverLetter: '',
    resumeLink: ''
  });

  useEffect(() => {
    axios.get('/profile')
      .then(res => {
        const user = res.data;
        setProfile(user);
        setForm({
          name: user.name,
          email: user.email,
          resumeLink: user.resume_path ? `http://localhost:5000${user.resume_path}` : '',
          coverLetter: ''
        });
      })
      .catch(err => console.error('Failed to load profile', err));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    alert('Form submitted (simulated)');
    console.log(form);
  };

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2>Simulated Job Application Form</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required /><br />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required /><br />
        <textarea name="coverLetter" value={form.coverLetter} onChange={handleChange} placeholder="Cover Letter" rows="4" /><br />
        {form.resumeLink && (
          <p>
            Resume: <a href={form.resumeLink} target="_blank" rel="noreferrer">Download</a>
          </p>
        )}
        <button type="submit">Submit Application (Mock)</button>
      </form>
    </div>
  );
}
