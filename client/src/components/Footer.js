// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Mail, ArrowUp } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer
      className="
        mt-16
        border-t border-slate-200 dark:border-slate-800
        bg-white/80 dark:bg-slate-900/80 backdrop-blur
        text-slate-800 dark:text-slate-200
      "
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-3 items-start">
        {/* Brand + tagline */}
        <div>
          <h4 className="text-lg font-semibold tracking-wide text-blue-900 dark:text-blue-200">
            JobTracker
          </h4>
          <p className="text-sm mt-1 text-slate-600 dark:text-slate-400">
            Helping you stay organized, motivated, and hired.
          </p>
        </div>

        {/* Links */}
        <nav aria-label="Footer" className="flex md:justify-center">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            <li>
              <Link
                to="/terms"
                className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Terms and Conditions
              </Link>
            </li>
            <li>
              <Link
                to="/privacy"
                className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Contact Us
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex md:justify-end items-center gap-3">
          <a
            href="mailto:hello@example.com"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Email"
          >
            <Mail className="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>

          <button
            onClick={toTop}
            className="ml-1 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Back to top"
            title="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 py-4">
        © {year} JobTracker. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
