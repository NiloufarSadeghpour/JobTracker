import Sidebar from '../components/Sidebar';
import JobBoard from '../components/JobBoard';
import ProjectBoard from '../components/ProjectBoard';
import ResumeUpload from '../components/ResumeUpload';
import FavoritesBoard from '../components/FavoritesBoard';

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <h1>Dashboard</h1>
        <h2>Your Job Applications</h2>
        <JobBoard />
        <h2 style={{ marginTop: '2rem' }}>Your Portfolio Projects</h2>
        <ProjectBoard />
        <h2 style={{ marginTop: '2rem' }}>Resume</h2>
        <ResumeUpload />
        <h2 style={{ marginTop: '2rem' }}>Favorites</h2>
        <FavoritesBoard /> 
      </main>
    </div>
  );
}
