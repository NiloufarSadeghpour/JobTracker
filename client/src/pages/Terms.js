// src/pages/Terms.js
import React from 'react';

const Terms = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6 md:px-20 lg:px-40 text-gray-800">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Terms & Conditions</h1>
      
      <p className="mb-4 text-sm text-gray-600">
        Last updated: July 19, 2025
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">1. Acceptance of Terms</h2>
        <p className="text-gray-700 leading-relaxed">
          By accessing and using JobTracker, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">2. Changes to Terms</h2>
        <p className="text-gray-700 leading-relaxed">
          We reserve the right to modify or replace these Terms at any time. Your continued use of the service after changes constitutes your acceptance of the new Terms.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">3. Use of Service</h2>
        <p className="text-gray-700 leading-relaxed">
          You agree to use the platform only for lawful purposes. You are responsible for maintaining the confidentiality of your account and any activities under your account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">4. Intellectual Property</h2>
        <p className="text-gray-700 leading-relaxed">
          All content, branding, and design elements of JobTracker are owned by the platform and may not be reused without permission.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">5. Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          If you have any questions about these Terms, please contact us at <a href="mailto:support@jobtracker.com" className="text-blue-600 underline">support@jobtracker.com</a>.
        </p>
      </section>
    </div>
  );
};

export default Terms;
