// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-900">JobTracker</Link>
      <div className="space-x-4">
        {token && (
          <>
            <Link to="/dashboard" className="text-gray-700 hover:text-blue-700">Dashboard</Link>
            <Link to="/jobs" className="text-gray-700 hover:text-blue-700">Jobs</Link>
            <Link to="/portfolio" className="text-gray-700 hover:text-blue-700">Portfolio</Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
            >
              Logout
            </button>
          </>
        )}
        {!token && (
          <Link to="/auth" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded">
            Register / Log In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
