import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Sun, Moon, Monitor, KeyRound, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '../api/notificationsApi.js';
import { forgotPassword } from '../api/authApi.js';
import { useDarkMode } from '../hooks/useDarkMode.js';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [prefs, setPrefs] = useState({ emailNotifications: true, followUpReminders: true });
  const [saved, setSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [dark, toggleDark] = useDarkMode();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: usersApi.getSettings,
  });

  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setPrefs({
        emailNotifications: settings.emailNotifications,
        followUpReminders: settings.followUpReminders,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data) => usersApi.updateSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  function handleSave(e) {
    e.preventDefault();
    updateMutation.mutate({ name: name.trim(), ...prefs });
  }

  async function handlePasswordReset() {
    if (!settings?.email) return;
    setResetLoading(true);
    try {
      await forgotPassword(settings.email);
      setResetSent(true);
      toast.success('Password reset email sent — check your inbox');
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  }

  if (isLoading) {
    return <div className="py-32 text-center text-slate-400">Loading…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-xl space-y-6">
          {/* Profile */}
          <form onSubmit={handleSave} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="mt-4 flex items-center gap-3">
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" /> Saved
                </span>
              )}
            </div>
            {updateMutation.isError && (
              <p className="mt-2 text-sm text-red-600">
                {updateMutation.error?.response?.data?.error ?? 'Something went wrong'}
              </p>
            )}
          </form>

          {/* Notification Preferences */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">In-app notifications are always on.</p>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <Toggle
                checked={prefs.followUpReminders}
                onChange={(v) => {
                  setPrefs((p) => ({ ...p, followUpReminders: v }));
                  updateMutation.mutate({ followUpReminders: v });
                }}
                label="Follow-up reminders"
                description="Get notified when it's time to follow up on an application"
              />
              <Toggle
                checked={prefs.emailNotifications}
                onChange={(v) => {
                  setPrefs((p) => ({ ...p, emailNotifications: v }));
                  updateMutation.mutate({ emailNotifications: v });
                }}
                label="Email notifications"
                description="Receive reminder emails in addition to in-app notifications"
              />
            </div>
          </div>

          {/* Appearance */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Choose how CareerPilot looks for you.</p>
            <div className="flex gap-3">
              {[
                { label: 'Light', Icon: Sun,     value: false },
                { label: 'Dark',  Icon: Moon,    value: true  },
              ].map(({ label, Icon, value }) => (
                <button
                  key={label}
                  onClick={() => { if (dark !== value) toggleDark(); }}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 py-4 transition-all ${
                    dark === value
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Password & Security */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Password &amp; Security</h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              We'll send a password reset link to <span className="font-medium text-slate-700 dark:text-slate-300">{settings?.email}</span>.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePasswordReset}
                disabled={resetLoading || resetSent}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {resetSent ? 'Email sent!' : resetLoading ? 'Sending…' : 'Send password reset email'}
              </button>
              {resetSent && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" /> Check your inbox
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
