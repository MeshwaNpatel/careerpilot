import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart2, Users, Sparkles, ArrowLeft, LogOut, Bell, Flag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Overview',    Icon: BarChart2 },
  { to: '/admin/users',     label: 'Users',       Icon: Users     },
  { to: '/admin/ai-usage',  label: 'AI Usage',    Icon: Sparkles  },
  { to: '/admin/broadcast', label: 'Broadcast',   Icon: Bell      },
  { to: '/admin/flags',     label: 'Feature Flags', Icon: Flag    },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <span className="text-lg font-bold text-indigo-600">CareerPilot</span>
          <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700">
            Admin
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <NavLink
              to="/dashboard"
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              User panel
            </NavLink>
          </div>
        </nav>

        <div className="border-t border-slate-200 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
          <p className="text-xs font-medium text-red-500">Administrator</p>
          <button
            onClick={handleLogout}
            className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
