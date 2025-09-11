// src/pages/EditJobPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../utils/axios';
import JobForm from '../components/JobForm';
import Sidebar from '../components/Sidebar';

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        // ✅ No manual Authorization header; interceptor handles it
        const res = await axios.get(`/jobs/${id}`);
        if (mounted) setJobData(res.data);
      } catch (e) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          (status === 404 ? 'Job not found.' :
           status === 401 || status === 403 ? 'Your session expired. Please log in again.' :
           'Failed to load job.');
        if (mounted) setErr(msg);
        if (status === 401 || status === 403) navigate('/auth');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, navigate]);

  const handleUpdate = async (formData) => {
    try {
      await axios.put(`/jobs/${id}`, formData); // ✅ interceptor adds token
      navigate('/dashboard');
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to update job.';
      alert(msg);
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
            <h1 className="m-0 text-2xl font-bold text-blue-900">Edit Job</h1>
            <p className="mt-1 text-sm text-slate-600">Update title, company, status, deadlines, and notes.</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/jobs"
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-900 hover:bg-blue-50 transition"
            >
              ← Back to Jobs
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-800 hover:bg-slate-50 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm max-w-2xl">
          {loading && <p className="text-slate-700">Loading…</p>}

          {!loading && err && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {err}
            </div>
          )}

          {!loading && !err && jobData && (
            <JobForm mode="edit" initialData={jobData} onSubmit={handleUpdate} />
          )}
        </div>
      </main>
    </div>
  );
}
