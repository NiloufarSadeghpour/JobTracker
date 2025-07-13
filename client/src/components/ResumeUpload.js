import { useState } from 'react';
import axios from '../utils/axios';

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await axios.post('/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumeUrl(res.data.path);
    } catch (err) {
      alert('Upload failed.');
      console.error(err);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Upload Resume (PDF)</h3>
      <form onSubmit={handleUpload}>
        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files[0])} required />
        <button type="submit">Upload</button>
      </form>
      {resumeUrl && (
        <p><a href={resumeUrl} target="_blank" rel="noreferrer">Download Resume</a></p>
      )}
    </div>
  );
}
