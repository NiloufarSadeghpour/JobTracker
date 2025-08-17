import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tokenStore } from '../utils/axios';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    tokenStore.clear();        // clear in-memory token
    setUser(null);             // clear React state
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-900">JobTracker</Link>
      <div className="space-x-4">
        {user ? (
          <>
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-700">Dashboard</Link>
            <Link to="/jobs" className="text-gray-700 hover:text-blue-700">Jobs</Link>
            <Link to="/portfolio-builder" className="text-gray-700 hover:text-blue-700">Portfolio</Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/auth" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded">
            Register / Log In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
