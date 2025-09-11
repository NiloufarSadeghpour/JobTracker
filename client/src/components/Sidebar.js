// src/components/Sidebar.js
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListChecks, PlusCircle, Wand2, FolderKanban, Bell, LogOut } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const linkBase =
    'flex items-center gap-2 rounded-xl px-3 py-2 font-semibold transition';
  const linkActive = 'bg-blue-600 text-white shadow-sm';
  const linkIdle = 'text-blue-900 hover:bg-blue-50';

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 border-r border-blue-100 bg-white/90 backdrop-blur">
      <div className="px-4 pt-4 pb-3">
        <div className="text-2xl font-extrabold text-blue-900 tracking-tight">JobTracker</div>
        <div className="mt-1 text-xs text-slate-600">Your search HQ</div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        <NavLink to="/dashboard" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>

        <NavLink to="/jobs" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
          <ListChecks className="w-4 h-4" />
          All Jobs
        </NavLink>

        <NavLink to="/add-job" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
          <PlusCircle className="w-4 h-4" />
          Add Job
        </NavLink>

        <NavLink to="/autofill" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
          <Wand2 className="w-4 h-4" />
          Autofill Form
        </NavLink>

        <NavLink to="/portfolio-builder" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
          <FolderKanban className="w-4 h-4" />
          Portfolio Manager
        </NavLink>

        <NavLink to="/notifications" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
          <Bell className="w-4 h-4" />
          Notifications
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition mt-4"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </nav>
    </aside>
  );
}