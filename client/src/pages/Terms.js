// src/pages/Terms.js
import React from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  const updated = 'July 19, 2025';

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'changes',    title: '2. Changes to Terms' },
    { id: 'use',        title: '3. Use of Service' },
    { id: 'ip',         title: '4. Intellectual Property' },
    { id: 'contact',    title: '5. Contact' },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-10 py-12">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Terms &amp; Conditions
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Last updated:{' '}
            <time dateTime="2025-07-19">{updated}</time>
          </p>
        </header>

        {/* Table of contents */}
        <nav
          aria-label="Table of contents"
          className="mb-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur px-4 py-3"
        >
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-6 md:p-8">
            {/* 1. Acceptance */}
            <section id="acceptance" className="mb-8 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                1. Acceptance of Terms
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                By accessing and using JobTracker, you accept and agree to be bound by these Terms.
                If you do not agree to abide by them, please do not use the service.
              </p>
            </section>

            {/* 2. Changes */}
            <section id="changes" className="mb-8 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                2. Changes to Terms
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                We may modify or replace these Terms at any time. Updates will be effective when
                posted. Your continued use of the service after changes constitutes acceptance of
                the updated Terms.
              </p>
            </section>

            {/* 3. Use of Service */}
            <section id="use" className="mb-8 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                3. Use of Service
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                You agree to use the platform only for lawful purposes. You are responsible for
                maintaining the confidentiality of your account and for all activities that occur
                under your account.
              </p>
            </section>

            {/* 4. Intellectual Property */}
            <section id="ip" className="mb-8 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                4. Intellectual Property
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                All content, branding, and design elements of JobTracker are owned by the platform
                or its licensors and may not be used without prior written permission.
              </p>
            </section>

            {/* 5. Contact */}
            <section id="contact" className="mb-2 scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                5. Contact
              </h2>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Questions about these Terms? Email us at{' '}
                <a
                  href="mailto:support@jobtracker.com"
                  className="text-blue-700 dark:text-blue-300 underline underline-offset-2 hover:opacity-90"
                >
                  support@jobtracker.com
                </a>{' '}
                or you can contact us directly{' '}
                <Link
                to='/contact'
                className='text-blue-700 dark:text-blue-300 underline underline-offset-2 hover:opacity-90'
                >
                  here
                </Link>
              </p>
            </section>
          </div>

          {/* Footer strip of the article */}
          <div className="px-6 md:px-8 py-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} JobTracker • These Terms govern your use of the site and services.
            <Link to="/privacy" className="ml-2 text-blue-700 dark:text-blue-300 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
};

export default Terms;
