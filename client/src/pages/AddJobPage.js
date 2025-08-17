import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';           // ✅ use configured instance
import JobForm from '../components/JobForm';
import Sidebar from '../components/Sidebar';

export default function AddJobPage() {
  const navigate = useNavigate();

  const handleAdd = async (formData) => {
    try {
      // ✅ No localStorage token. Interceptor adds Authorization from tokenStore.
      //await axios.post('/jobs', formData);
      //navigate('/dashboard');
      const res = await axios.post('/jobs', formData);
      console.log('Add job response:', res.status, res.data);   // should be 201 + created job
      alert('Job created successfully');                         // visible proof
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 401 ? 'Your session expired. Please log in again.' : 'Failed to add job.');
      alert(msg);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        // ✅ Correct route for auth page
        navigate('/auth');
      }

      console.error('Failed to add job', err);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem' }}>
        <h2>Add a New Job</h2>
        <JobForm mode="add" onSubmit={handleAdd} />
      </main>
    </div>
  );
}
