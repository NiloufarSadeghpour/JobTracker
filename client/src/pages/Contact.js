// src/pages/Contact.js
import React, { useState } from 'react';
import axios from '../utils/axios'; 

const initial = { name: '', email: '', subject: '', message: '', company: '' }; // company = honeypot

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ sending: false, ok: false, msg: '' });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.message || form.message.trim().length < 10) e.message = 'Message must be at least 10 characters.';
    if (form.company) e.company = 'Bad input.'; // honeypot
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setStatus({ sending: true, ok: false, msg: '' });
      const { data } = await axios.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        company: form.company, // honeypot
      });
      setStatus({ sending: false, ok: true, msg: data?.message || 'Thanks! We received your message.' });
      setForm(initial);
      setErrors({});
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        'Something went wrong. Please try again later.';
      setStatus({ sending: false, ok: false, msg });
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="max-w-3xl mx-auto px-6 md:px-8 lg:px-10 py-12">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Contact Us</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            We usually reply within 1–2 business days.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 md:p-8"
        >
          {/* Name */}
          <div className="mb-5">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className={`mt-1 w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2`}
              value={form.name}
              onChange={onChange}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-err' : undefined}
              placeholder="Ada Lovelace"
            />
            {errors.name && <p id="name-err" className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`mt-1 w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2`}
              value={form.email}
              onChange={onChange}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-err' : undefined}
              placeholder="you@example.com"
            />
            {errors.email && <p id="email-err" className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Subject */}
          <div className="mb-5">
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Subject <span className="text-slate-400">(optional)</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2"
              value={form.subject}
              onChange={onChange}
              placeholder="How can we help?"
            />
          </div>

          {/* Message */}
          <div className="mb-5">
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              className={`mt-1 w-full rounded-md border ${errors.message ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                         bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2`}
              value={form.message}
              onChange={onChange}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'message-err' : undefined}
              placeholder="Tell us a bit about your issue or request…"
            />
            {errors.message && <p id="message-err" className="mt-1 text-xs text-red-500">{errors.message}</p>}
          </div>

          {/* Honeypot (hidden from humans) */}
          <div className="hidden">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" value={form.company} onChange={onChange} />
          </div>

          {/* Status */}
          {status.msg && (
            <div
              className={`mb-4 text-sm px-3 py-2 rounded-md ${
                status.ok ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {status.msg}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={status.sending}
              className={`inline-flex items-center justify-center rounded-md px-4 py-2 font-semibold
                          text-white ${status.sending ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}
                          disabled:opacity-60`}
            >
              {status.sending ? 'Sending…' : 'Send message'}
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Or email us directly at{' '}
              <a
                href="mailto:support@jobtracker.com"
                className="text-blue-700 dark:text-blue-300 underline underline-offset-2"
              >
                support@jobtracker.com
              </a>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
