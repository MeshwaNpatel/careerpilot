import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/authApi.js';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get('token') ?? '';

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState(null);

  const mismatch = confirm.length > 0 && password !== confirm;
  const weak     = password.length > 0 && password.length < 8;

  async function handleSubmit(e) {
    e.preventDefault();
    if (mismatch || weak) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err.response?.data?.error ?? 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
          <h1 className="text-lg font-bold text-slate-900">Invalid link</h1>
          <p className="mt-2 text-sm text-slate-500">This reset link is missing a token. Please request a new one.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            Request new link →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-7 w-7 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Password updated!</h1>
            <p className="mt-2 text-sm text-slate-500">Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <Lock className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="mb-1 text-2xl font-bold text-slate-900">Set new password</h1>
            <p className="mb-6 text-sm text-slate-500">Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 ${
                      weak ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {weak && <p className="mt-1 text-xs text-red-500">Password must be at least 8 characters.</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-100 ${
                    mismatch ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-indigo-500'
                  }`}
                />
                {mismatch && <p className="mt-1 text-xs text-red-500">Passwords don't match.</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mismatch || weak || !password || !confirm}
                className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {loading ? 'Saving…' : 'Reset password'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Remember it?{' '}
              <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
