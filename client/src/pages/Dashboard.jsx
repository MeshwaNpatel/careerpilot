import { useAuth } from '../hooks/useAuth.js';
import Button from '../components/common/Button.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <span className="text-lg font-bold text-slate-900">CareerPilot</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            {user?.name} <span className="text-slate-400">· {user?.plan} plan</span>
          </span>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {user?.name}!</h1>
        <p className="mt-2 text-slate-600">
          The Kanban pipeline board, applications, resumes, AI tools, and analytics will live here
          in upcoming phases.
        </p>
      </main>
    </div>
  );
}
