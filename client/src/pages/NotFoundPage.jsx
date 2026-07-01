import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
        <FileQuestion className="h-10 w-10 text-indigo-400" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900">404</h1>
      <p className="mt-2 text-lg font-medium text-slate-600">Page not found</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
