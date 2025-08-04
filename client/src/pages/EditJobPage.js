import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import JobForm from '../components/JobForm';

export default function EditJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setJobData(res.data);
      } catch (err) {
        console.error('Failed to load job', err);
        alert('Job not found or unauthorized.');
        navigate('/dashboard');
      }
    };
    fetchJob();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/jobs/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to update job', err);
      alert('Failed to update job.');
    }
  };

  if (!jobData) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '2rem' }}>
      <h2>Edit Job</h2>
      <JobForm mode="edit" initialData={jobData} onSubmit={handleUpdate} />
    </div>
  );
}
