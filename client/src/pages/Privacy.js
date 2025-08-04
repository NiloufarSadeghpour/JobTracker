// src/pages/Privacy.js
import React from 'react';

const Privacy = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6 md:px-20 lg:px-40 text-gray-800">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Privacy Policy</h1>
      
      <p className="mb-4 text-sm text-gray-600">
        Last updated: July 19, 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">1. Introduction</h2>
        <p className="text-gray-700 leading-relaxed">
          Your privacy is important to us. This Privacy Policy outlines how JobTracker collects, uses, and protects your personal information.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">2. Information We Collect</h2>
        <p className="text-gray-700 leading-relaxed">
          We collect information you provide directly, such as your name, email address, resume files, and job application data. We may also collect usage data to improve the platform.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">3. How We Use Your Information</h2>
        <p className="text-gray-700 leading-relaxed">
          Your information is used to provide and improve the JobTracker service, personalize your experience, and send relevant updates or notifications.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">4. Data Protection</h2>
        <p className="text-gray-700 leading-relaxed">
          We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">5. Third-Party Services</h2>
        <p className="text-gray-700 leading-relaxed">
          We may use third-party tools (like analytics or payment providers) that may collect information in accordance with their own policies.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">6. Contact Us</h2>
        <p className="text-gray-700 leading-relaxed">
          For any privacy-related inquiries, reach out to <a href="mailto:privacy@jobtracker.com" className="text-blue-600 underline">privacy@jobtracker.com</a>.
        </p>
      </section>
    </div>
  );
};

export default Privacy;
