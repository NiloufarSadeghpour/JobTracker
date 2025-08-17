import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios, { tokenStore } from './utils/axios';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import JobListPage from './pages/JobListPage';
import AddJobPage from './pages/AddJobPage';
import EditJobPage from './pages/EditJobPage';
import AddProjectPage from './pages/AddProjectPage';
import AutofillForm from './pages/AutofillForm';
import PortfolioForm from './pages/PortfolioForm';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null); // 👈 track logged-in user

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.post('/auth/refresh');
        tokenStore.set(data.accessToken);
        setUser(data.user); // 👈 keep user in state
      } catch {
        tokenStore.clear();
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      {/* pass user + setUser to Navbar */}
      <Navbar user={user} setUser={setUser} />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/auth" element={<AuthPage setUser={setUser} />} />

        {/* Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}><Dashboard /></ProtectedRoute>
        } />
        <Route path="/jobs" element={
          <ProtectedRoute user={user}><JobListPage /></ProtectedRoute>
        } />
        <Route path="/add-job" element={
          <ProtectedRoute user={user}><AddJobPage /></ProtectedRoute>
        } />
        <Route path="/edit-job/:id" element={
          <ProtectedRoute user={user}><EditJobPage /></ProtectedRoute>
        } />
        <Route path="/add-project" element={
          <ProtectedRoute user={user}><AddProjectPage /></ProtectedRoute>
        } />
        <Route path="/autofill" element={
          <ProtectedRoute user={user}><AutofillForm /></ProtectedRoute>
        } />
        <Route path="/portfolio-builder" element={
          <ProtectedRoute user={user}><PortfolioForm /></ProtectedRoute>
        } />
      </Routes>

      <Footer />
    </Router>
  );
}
