import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import JobForm from '../components/JobForm';
import Sidebar from '../components/Sidebar';

export default function AddJobPage() {
  const navigate = useNavigate();

  const handleAdd = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/jobs', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to add job', err);
      alert('Failed to add job.');
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
