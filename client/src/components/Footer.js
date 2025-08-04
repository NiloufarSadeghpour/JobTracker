// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-blue-50 text-blue-900 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <h4 className="text-lg font-semibold tracking-wide">JobTracker</h4>
          <p className="text-sm mt-1 text-blue-700">
            Helping you stay organized, motivated, and hired.
          </p>
        </div>

        <div className="flex gap-6 text-sm font-medium">
          <Link to="/terms" className="hover:text-blue-600 transition">Terms and Conditions</Link>
          <Link to="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-blue-600 transition">Contact Us</Link>
        </div>
      </div>

      <div className="text-center text-xs text-blue-700 bg-blue-100 py-3 border-t border-blue-200">
        © {new Date().getFullYear()} JobTracker. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
