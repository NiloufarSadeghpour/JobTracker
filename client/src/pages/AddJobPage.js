// src/pages/AddJobPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import JobForm from '../components/JobForm';
import Sidebar from '../components/Sidebar';

export default function AddJobPage() {
  const navigate = useNavigate();

  const handleAdd = async (formData) => {
    try {
      const res = await axios.post('/jobs', formData);
      console.log('Add job response:', res.status, res.data);
      alert('Job created successfully');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? 'Your session expired. Please log in again.'
          : 'Failed to add job.');
      alert(msg);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        navigate('/auth');
      }
      console.error('Failed to add job', err);
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
            <h1 className="text-2xl font-bold text-blue-900 m-0">Add a New Job</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create a job entry to track applications, deadlines, and notes.
            </p>
          </div>
          <Link
            to="/jobs"
            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 font-semibold text-blue-900 hover:bg-blue-50 transition"
          >
            ← Back to Jobs
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <JobForm mode="add" onSubmit={handleAdd} />
        </div>
      </main>
    </div>
  );
}
