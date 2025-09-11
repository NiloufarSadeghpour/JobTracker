// src/components/AdminSidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt, FaUsers, FaChartBar, FaClipboardList,
  FaServer, FaEnvelopeOpenText, FaUserPlus, FaSignOutAlt, FaExchangeAlt, FaFileExport
} from 'react-icons/fa';
import Logo from './Logo';

export default function AdminSidebar({ onLogout, onSwitchUser }) {
  const link = ({ isActive }) =>
    `block px-3 py-2 rounded-md font-semibold transition
     ${isActive ? 'bg-white text-[#4a90e2]' : 'text-white hover:bg-[#5aa0f0]'}`;

  return (
    <aside className="w-[220px] bg-[#4a90e2] text-white p-5">
      <div className="flex items-center gap-2 mb-5">
        <Logo size={22} color="#ffffff" />
        <h2 className="m-0 text-white font-bold text-lg">Admin</h2>
      </div>

      <nav className="grid gap-2">
        <NavLink to="/admin" end className={link}>
          <span className="inline-flex items-center gap-2"><FaTachometerAlt/> Dashboard</span>
        </NavLink>

        <NavLink to="/admin/analytics" className={link}>
          <span className="inline-flex items-center gap-2"><FaChartBar/> Analytics</span>
        </NavLink>

        <NavLink to="/admin/users" className={link}>
          <span className="inline-flex items-center gap-2"><FaUsers/> Manage Users</span>
        </NavLink>

        <NavLink to="/admin/audit" className={link}>
          <span className="inline-flex items-center gap-2"><FaClipboardList/> Audit Log</span>
        </NavLink>

        <NavLink to="/admin/system" className={link}>
          <span className="inline-flex items-center gap-2"><FaServer/> System Health</span>
        </NavLink>

        <NavLink to="/admin/messages" className={link}>
          <span className="inline-flex items-center gap-2"><FaEnvelopeOpenText/> Messages</span>
        </NavLink>

        <NavLink to="/admin/invite" className={link}>
          <span className="inline-flex items-center gap-2"><FaUserPlus/> Invite Admin</span>
        </NavLink>

        <NavLink to="/admin/exports" className={link}>
          <span className="inline-flex items-center gap-2"><FaFileExport/> Exports</span>
        </NavLink>
      </nav>

      <div className="grid gap-2 mt-4">
        <button
          onClick={onSwitchUser}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-[#4a90e2] hover:bg-blue-50 transition"
        >
          <FaExchangeAlt/> Switch to User View
        </button>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-[#ffeded] text-[#a50000] hover:bg-[#ffdede] transition"
        >
          <FaSignOutAlt/> Log out
        </button>
      </div>
    </aside>
  );
}
