// src/components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white shadow-inner text-center text-gray-500 text-sm p-4 mt-10">
      © {new Date().getFullYear()} JobTracker. All rights reserved.
    </footer>
  );
};

export default Footer;
