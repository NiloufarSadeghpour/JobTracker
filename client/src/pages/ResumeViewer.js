// src/pages/ResumeViewer.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios, { tokenStore } from '../utils/axios';

export default function ResumeViewer() {
  const { id } = useParams();
  const [resume, setResume] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      setLoading(true);
      setErr('');
      const t = localStorage.getItem('token');
      if (t && tokenStore?.set) tokenStore.set(t);

      try {
        const { data } = await axios.get(`/resumes/${id}`, {
          headers: tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {},
        });
        if (ok) setResume(data);
      } catch (e) {
        console.error('Resume load failed', e);
        if (ok) setErr(e?.response?.data?.message || 'Resume not found');
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, [id]);

  if (loading) return <div className="container">Loading…</div>;

  return (
    <main className="container">
      <div className="job-tracker-container">
        <div className="job-tracker-header">
          <h2 className="brand-accent">{resume?.name || 'Resume'}</h2>
          <Link to="/dashboard" className="add-job-btn">Back</Link>
        </div>

        {err && (
          <div className="rounded-lg" style={{ border:'1px solid #fecaca', background:'#fee2e2', color:'#991b1b', padding:12 }}>
            {err}
          </div>
        )}

        {!err && resume?.fileUrl ? (
          <embed
            src={`${resume.fileUrl}#view=FitH`}
            type="application/pdf"
            style={{ width: '100%', height: '85vh', border: '1px solid var(--border)', borderRadius: 12 }}
          />
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No PDF available.</p>
        )}
      </div>
    </main>
  );
}
