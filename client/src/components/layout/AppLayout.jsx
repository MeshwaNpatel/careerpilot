import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Sparkles,
  Mail,
  Video,
  BarChart2,
  Users,
  Briefcase,
  Bell,
  X,
  ExternalLink,
  CreditCard,
  Settings,
  LogOut,
  UserCircle,
  PenLine,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { notificationsApi } from '../../api/notificationsApi.js';
import { useDarkMode } from '../../hooks/useDarkMode.js';
import { usePendingApply } from '../../hooks/usePendingApply.js';
import PendingApplyModal from '../PendingApplyModal.jsx';

const NAV_ITEMS = [
  { to: '/dashboard',         label: 'Pipeline',       Icon: LayoutDashboard },
  { to: '/applications',      label: 'Applications',   Icon: ClipboardList   },
  { to: '/jobs',              label: 'Jobs',           Icon: Briefcase       },
  { to: '/contacts',          label: 'Contacts',       Icon: Users           },
  { to: '/resumes',           label: 'Resume Vault',   Icon: FileText        },
  { to: '/resume-builder',    label: 'Resume Builder', Icon: PenLine         },
  { to: '/ai/review',         label: 'AI Review',      Icon: Sparkles        },
  { to: '/ai/cover-letter',   label: 'Cover Letter',   Icon: Mail            },
  { to: '/ai/interview-prep', label: 'Interview Prep', Icon: Video           },
  { to: '/analytics',         label: 'Analytics',      Icon: BarChart2       },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</span>
            {count > 0 && (
              <button onClick={() => markAllMutation.mutate()} className="text-xs font-medium text-indigo-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                  className={`w-full border-b border-slate-50 dark:border-slate-700 px-4 py-3 text-left last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    !n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />}
                    <div className={!n.isRead ? '' : 'pl-4'}>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2">
            <NavLink to="/notifications" onClick={() => setOpen(false)} className="text-xs text-indigo-600 hover:underline">
              View all notifications →
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, toggleDark] = useDarkMode();
  const [pendingJob, setPendingJob] = usePendingApply();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <span className="text-lg font-bold text-indigo-600">CareerPilot</span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="rounded-full p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition"
              aria-label="Toggle dark mode"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationBell />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-4">
          <NavLink to="/profile" className="mb-2 flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.plan} plan</p>
            </div>
          </NavLink>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink to="/profile" className="flex items-center gap-2 rounded px-1 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
              <UserCircle className="h-3.5 w-3.5" /> Profile
            </NavLink>
            <NavLink to="/billing" className="flex items-center gap-2 rounded px-1 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
              <CreditCard className="h-3.5 w-3.5" /> Billing
            </NavLink>
            <NavLink to="/settings" className="flex items-center gap-2 rounded px-1 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
              <Settings className="h-3.5 w-3.5" /> Settings
            </NavLink>
            <button onClick={handleLogout} className="flex items-center gap-2 rounded px-1 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
            {user?.role === 'admin' && (
              <NavLink to="/admin/dashboard" className="flex items-center gap-2 rounded px-1 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                <ExternalLink className="h-3.5 w-3.5" /> Admin Panel
              </NavLink>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-auto bg-slate-50 dark:bg-slate-950">
        <Outlet />
      </main>

      {pendingJob && (
        <PendingApplyModal
          job={pendingJob}
          onClose={() => setPendingJob(null)}
        />
      )}
    </div>
  );
}
