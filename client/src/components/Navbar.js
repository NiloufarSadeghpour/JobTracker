// src/components/Navbar.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios, { tokenStore } from '../utils/axios';
import { Bell, User as UserIcon, Moon, Sun } from 'lucide-react';
import Logo from './Logo';

const NavItem = ({ to, children, pathname }) => {
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-md text-[15px] font-medium transition-colors
      ${active
        ? 'text-blue-800 bg-blue-50 dark:text-blue-200 dark:bg-slate-800'
        : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:text-blue-300 dark:hover:bg-slate-800/80'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  );
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState('system');
  const applyTheme = (t) => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = t === 'dark' || (t === 'system' && prefersDark);
    root.classList.toggle('dark', dark);
  };
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'system';
    setTheme(saved);
    applyTheme(saved);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if ((localStorage.getItem('theme') || 'system') === 'system') applyTheme('system'); };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  const cycle = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next); localStorage.setItem('theme', next); applyTheme(next);
  };
  const label = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark';
  return (
    <button
      onClick={cycle}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm
                 text-gray-700 hover:text-blue-700 hover:bg-gray-50
                 dark:text-slate-200 dark:hover:text-blue-300 dark:hover:bg-slate-800/80"
      title={`Theme: ${label} (click to change)`}
      aria-label={`Theme: ${label}`}
    >
      <Sun className="w-5 h-5 hidden dark:inline" />
      <Moon className="w-5 h-5 inline dark:hidden" />
    </button>
  );
};

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    tokenStore.clear();
    setUser(null);
    navigate('/');
  };

  const [adminUnread, setAdminUnread] = useState(0);
  const [adminShowPopup, setAdminShowPopup] = useState(false);
  const [latestSender, setLatestSender] = useState('');

  const fetchAdminUnread = useCallback(async (retried = false) => {
    if (document.hidden) return;
    if (!user || user.role !== 'admin') return;
    try {
      const { data } = await axios.get('/admin/announcements', { params: { include_expired: 0 } });
      const count = data?.unread || 0;
      setAdminUnread(count);

      const items = data?.items || [];
      const firstUnread = items.find(a => !a.is_read);
      const candidate = firstUnread || items[0];
      setLatestSender(candidate?.created_by_username || 'Admin');

      if (count > 0) setAdminShowPopup(true);
    } catch (e) {
      const s = e?.response?.status;
      if (!retried && s === 401) {
        try {
          const r = await axios.post('/auth/refresh');
          if (r?.data?.accessToken) {
            tokenStore.set(r.data.accessToken);
            setUser?.(r.data.user);
            return fetchAdminUnread(true);
          }
        } catch {}
      }
    }
  }, [setUser, user]);

  const [userUnread, setUserUnread] = useState(0);
  const [userOpen, setUserOpen] = useState(false);
  const [userItems, setUserItems] = useState([]);

  const fetchUserNotifications = useCallback(async () => {
    if (document.hidden) return;
    if (!user || user.role === 'admin') return; // only for normal users
    try {
      const [{ data: c }, { data: l }] = await Promise.all([
        axios.get('/notifications/unread-count'),
        axios.get('/notifications', { params: { page: 1, limit: 5 } }),
      ]);
      setUserUnread(c?.unread || 0);
      setUserItems(Array.isArray(l?.items) ? l.items : []);
    } catch {}
  }, [user]);

  const markUserRead = async (id) => {
    try {
      await axios.post(`/notifications/${id}/read`);
      setUserItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUserUnread(n => Math.max(0, n - 1));
    } catch {}
  };

  useEffect(() => {
    fetchAdminUnread(false);
    fetchUserNotifications();
    const id = setInterval(() => { fetchAdminUnread(); fetchUserNotifications(); }, 30000);
    const onFocus = () => { fetchAdminUnread(false); fetchUserNotifications(); };
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [fetchAdminUnread, fetchUserNotifications]);

  useEffect(() => {
    fetchAdminUnread(false);
    fetchUserNotifications();
  }, [pathname, fetchAdminUnread, fetchUserNotifications]);

  const adminHasNew = adminUnread > 0;
  const userHasNew = userUnread > 0;

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md
                    border-slate-200 dark:bg-slate-900/80 dark:border-slate-800">
      <div className="max-w-10xl mx-auto px-10">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <Logo size={32} color="#1e40af" />
            <span className="text-xl font-bold text-blue-900 dark:text-blue-200">JobTracker</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Nav links + the right bell for each role */}
                {user.role === 'admin' ? (
                  <>
                    <NavItem to="/admin" pathname={pathname}>Dashboard</NavItem>
                    <NavItem to="/admin/users" pathname={pathname}>Users</NavItem>

                    <div className="relative">
                      <Link
                        to="/admin/messages"
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-blue-700
                                   dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-blue-300"
                        aria-label={adminHasNew ? `${adminUnread} new announcements` : 'Announcements'}
                      >
                        <Bell
                          className={`w-6 h-6 ${adminHasNew ? 'text-red-500 motion-safe:animate-pulse' : ''}`}
                          aria-hidden="true"
                        />
                      </Link>
                      {adminHasNew && (
                        <span
                          className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-[4px]
                                     flex items-center justify-center rounded-full leading-none"
                          aria-live="polite"
                        >
                          {adminUnread > 9 ? '9+' : adminUnread}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <NavItem to="/dashboard" pathname={pathname}>Dashboard</NavItem>
                    <NavItem to="/jobs" pathname={pathname}>Jobs</NavItem>
                    <NavItem to="/portfolio-builder" pathname={pathname}>Portfolio</NavItem>

                    <div className="relative">
                      <button
                        onClick={() => setUserOpen(o => !o)}
                        className="relative p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-blue-700
                                   dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-blue-300"
                        aria-label={userHasNew ? `${userUnread} new notifications` : 'Notifications'}
                      >
                        <Bell className={`w-6 h-6 ${userHasNew ? 'text-red-500 motion-safe:animate-pulse' : ''}`} />
                        {userHasNew && (
                          <span
                            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] min-w-[16px] h-4 px-[4px]
                                       flex items-center justify-center rounded-full leading-none"
                          >
                            {userUnread > 9 ? '9+' : userUnread}
                          </span>
                        )}
                      </button>

                      {/* User popover */}
                      {userOpen && (
                        <div
                          className="absolute right-0 mt-2 w-80 rounded-lg border border-blue-200 dark:border-slate-700
                                     bg-white dark:bg-slate-900 shadow-lg z-50"
                          role="dialog"
                          aria-modal="true"
                        >
                          <div className="px-3 py-2 border-b border-blue-100 dark:border-slate-800
                                          font-semibold text-blue-900 dark:text-blue-200">
                            Notifications
                          </div>

                          <div className="max-h-80 overflow-auto">
                            {userItems.length === 0 ? (
                              <div className="px-3 py-4 text-sm text-gray-600 dark:text-slate-300">No notifications yet.</div>
                            ) : (
                              userItems.map(n => (
                                <div
                                  key={n.id}
                                  className={`px-3 py-2 border-b border-blue-50 dark:border-slate-800
                                              ${n.is_read ? '' : 'bg-blue-50/60 dark:bg-slate-800/60'}`}
                                >
                                  <div className="text-blue-900 dark:text-blue-200 font-medium">{n.title}</div>
                                  {n.body && <div className="text-sm text-gray-700 dark:text-slate-300">{n.body}</div>}
                                  <div className="flex items-center gap-2 mt-1">
                                    {n.link && (
                                      <button
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                        onClick={() => { setUserOpen(false); navigate(n.link); }}
                                      >
                                        Open
                                      </button>
                                    )}
                                    {!n.is_read && (
                                      <button
                                        className="text-xs font-semibold text-gray-600 dark:text-slate-300 hover:underline"
                                        onClick={() => markUserRead(n.id)}
                                      >
                                        Mark read
                                      </button>
                                    )}
                                    <span className="ml-auto text-[11px] text-gray-500 dark:text-slate-400">
                                      {new Date(n.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          <button
                            onClick={() => { setUserOpen(false); navigate('/notifications'); }}
                            className="w-full text-center px-3 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300
                                       hover:bg-blue-50 dark:hover:bg-slate-800"
                          >
                            See all notifications →
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Greeting */}
                <div className="ml-2 hidden sm:flex items-center gap-2 text-gray-700 dark:text-slate-200">
                  <UserIcon className="w-5 h-5" aria-hidden="true" />
                  <span>Hey, {user.name}</span>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="ml-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-[15px]"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-[15px]"
              >
                Register / Log In
              </Link>
            )}

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {user?.role === 'admin' && adminShowPopup && adminHasNew && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute top-16 right-6 bg-white dark:bg-slate-900
                     border border-blue-200 dark:border-slate-700 shadow-lg rounded-lg p-4 w-80 z-50 animate-fade-in"
        >
          <p className="text-gray-800 dark:text-slate-100 font-semibold mb-1">New Announcement</p>
          <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
            There has been a new announcement from <span className="font-bold">{latestSender}</span>.
          </p>
          <div className="flex justify-end gap-2">
            <Link
              to="/admin/messages"
              onClick={() => setAdminShowPopup(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Show me
            </Link>
            <button
              onClick={() => setAdminShowPopup(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm
                         dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
