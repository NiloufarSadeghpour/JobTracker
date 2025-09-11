import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import axios, { tokenStore } from '../utils/axios';

export default function AdminShell({ user, setUser, children }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    try { await axios.post('/auth/logout'); } catch {}
    tokenStore.clear();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser?.(null);
    navigate('/auth', { replace: true });
  };

  const onSwitchUser = () => navigate('/dashboard');

  return (
    <div className="flex min-h-[calc(100vh-120px)] bg-[#f5f9ff]">
      <AdminSidebar onLogout={onLogout} onSwitchUser={onSwitchUser} />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="text-sm text-slate-600 mb-3">
          Signed in as <b className="text-blue-900">{user?.name || user?.username || user?.email}</b> ({user?.role})
        </div>
        {children}
      </main>
    </div>
  );
}
