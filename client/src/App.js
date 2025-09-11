import './themeBoot.js';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios, { tokenStore } from './utils/axios';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import Home from './pages/Home';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import JobListPage from './pages/JobListPage';
import AddJobPage from './pages/AddJobPage';
import EditJobPage from './pages/EditJobPage';
import PortfolioViewer from './pages/PortfolioViewer';
import ResumeViewer from './pages/ResumeViewer';
import AddProjectPage from './pages/AddProjectPage';
import AutofillForm from './pages/AutofillForm';
import Contact from './pages/Contact.js';
import NotificationsPage from './pages/Notifications';

import AdminRegister from './pages/AdminRegister';   // public (invite link)
import AdminDashboard from './pages/AdminDashboard';
import AdminInvite from './pages/AdminInvite';
import AdminUsers from './pages/AdminUsers';
import AdminJobs from './pages/AdminJobs';
import AdminPortfolios from './pages/AdminPortfolios';
import AdminMessages from './pages/AdminMessages';
import AdminSystem from './pages/AdminSystem.js';
import AdminAnalytics from './pages/AdminAnalytics.js';
import AdminAudit from './pages/AdminAudit.js';
import AdminExports from './pages/AdminExports.js';

import Forbidden from './pages/Forbidden';
import PortfolioPage from './pages/PortfolioPage';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.post('/auth/refresh');
        tokenStore.set(data.accessToken);
        setUser(data.user);
      } catch {
        tokenStore.clear();
        setUser(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  if (!authChecked) return <div>Loading...</div>;

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path='/contact' element={<Contact />} />
        <Route path="/auth" element={<AuthPage setUser={setUser} />} />

        {/* Public but invite-only via ?token= */}
        <Route path="/admin/register" element={<AdminRegister setUser={setUser} />} />

        {/* Admin-only */}
        <Route
          path="/admin"
          element={<AdminRoute user={user}><AdminDashboard user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/invite"
          element={<AdminRoute user={user}><AdminInvite user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/users"
          element={<AdminRoute user={user}><AdminUsers user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/jobs"
          element={<AdminRoute user={user}><AdminJobs user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/portfolios"
          element={<AdminRoute user={user}><AdminPortfolios user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/messages"
          element={<AdminRoute user={user}><AdminMessages user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/analytics"
          element={<AdminRoute user={user}><AdminAnalytics user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/audit"
          element={<AdminRoute user={user}><AdminAudit user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/system"
          element={<AdminRoute user={user}><AdminSystem user={user} setUser={setUser} /></AdminRoute>}
        />
        <Route
          path="/admin/exports"
          element={<AdminRoute user={user}><AdminExports user={user} setUser={setUser} /></AdminRoute>}
        />

        {/* User-protected */}
        <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
        <Route path="/jobs" element={<ProtectedRoute user={user}><JobListPage /></ProtectedRoute>} />
        <Route path="/add-job" element={<ProtectedRoute user={user}><AddJobPage /></ProtectedRoute>} />
        <Route path="/edit-job/:id" element={<ProtectedRoute user={user}><EditJobPage /></ProtectedRoute>} />
        <Route path="/add-project" element={<ProtectedRoute user={user}><AddProjectPage /></ProtectedRoute>} />
        <Route path="/portfolio/:id" element={<ProtectedRoute user={user}><PortfolioViewer /></ProtectedRoute>} />
        <Route path="/resume/:id" element={<ProtectedRoute user={user}><ResumeViewer /></ProtectedRoute>} />
        <Route path="/autofill" element={<ProtectedRoute user={user}><AutofillForm /></ProtectedRoute>} />
        <Route path="/portfolio-builder" element={<ProtectedRoute user={user}><PortfolioPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute user={user}><NotificationsPage /></ProtectedRoute>} />

        <Route path="/403" element={<Forbidden />} />
      </Routes>

      <Footer />
    </Router>
  );
}
