// src/pages/Dashboard.js
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import JobBoard from '../components/JobBoard';
import ProjectBoard from '../components/ProjectBoard';
import ResumeUpload from '../components/ResumeUpload';
import FavoritesBoard from '../components/FavoritesBoard';
import PortfolioBoard from '../components/PortfolioBoard';
import { tokenStore } from '../utils/axios';
import AnalyticsSummary from "../components/AnalyticsSummary"
import AICoverLetter from "../components/AICoverLetter";

export default function DashboardPage() {
  useEffect(() => {
    // Prime interceptor token from localStorage on hard refresh
    const t = localStorage.getItem('token');
    if (t) tokenStore.set(t);
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-120px)] bg-[#f5f9ff]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
          <Link
            to="/jobs"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            View full list →
          </Link>
        </div>

        {/* (Optional) quick stats */}
        <AnalyticsSummary />

        {/* Jobs */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-blue-900">Your Job Applications</h2>
            <Link
              to="/add-job"
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition"
            >
              + Add Job
            </Link>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <JobBoard />
          </div>
        </section>

        {/* Portfolios */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-blue-900">Your Portfolios</h2>
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <PortfolioBoard />
          </div>
        </section>

        {/* Projects */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-blue-900">Projects</h2>
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <ProjectBoard />
          </div>
        </section>

        {/* Resume */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-blue-900">Resume</h2>
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <ResumeUpload />
          </div>
        </section>

        <section className="space-y-2">
  <h2 className="text-lg font-bold text-blue-900">AI Tools</h2>
  <AICoverLetter />
</section>

        {/* Favorites */}
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-blue-900">Favorites</h2>
          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
            <FavoritesBoard />
          </div>
        </section>
      </main>
    </div>
  );
}
