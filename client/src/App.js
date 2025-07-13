import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AddJobPage from './pages/AddJobPage';
import AddProjectPage from './pages/AddProjectPage';
import AutofillForm from './pages/AutofillForm';


const isLoggedIn = !!localStorage.getItem('token');


function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to ="/dashboard" />} />
        <Route path="/add-job" element={isLoggedIn ? <AddJobPage /> : <Navigate to="/dashboard" />} />
        <Route path="/add-project" element={isLoggedIn ? <AddProjectPage /> : <Navigate to="/dashboard" />} />
        <Route path="/autofill" element={isLoggedIn ? <AutofillForm /> : <Navigate to="/dashboard" />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
