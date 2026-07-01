import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Mail, Shield, Calendar, Briefcase, FileText, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '../api/usersApi.js';

const PLAN_COLORS = {
  free:    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  pro:     'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300',
  premium: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
};

function Avatar({ name, avatarUrl, uploading, onFileChange }) {
  const fileRef = useRef(null);
  const initials = (name ?? '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative inline-block">
      <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-700 shadow-lg">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-3xl font-bold text-white">
            {initials || '?'}
          </div>
        )}
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition disabled:opacity-50"
        title="Change photo"
      >
        {uploading
          ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          : <Camera className="h-4 w-4" />}
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])} />
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [initialised, setInitialised] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.getProfile,
  });

  if (profile && !initialised) {
    setName(profile.name);
    setAvatarUrl(profile.avatarUrl ?? null);
    setInitialised(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => usersApi.updateProfile({ name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile updated'); },
    onError: () => toast.error('Failed to save profile'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => usersApi.uploadAvatar(file),
    onSuccess: (data) => { setAvatarUrl(data.avatarUrl); queryClient.invalidateQueries({ queryKey: ['profile'] }); toast.success('Photo updated'); },
    onError: () => toast.error('Failed to upload — max 2MB, JPEG/PNG/WebP only'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => usersApi.changePassword({ currentPassword: currentPwd, newPassword: newPwd }),
    onSuccess: () => { setCurrentPwd(''); setNewPwd(''); setConfirmPwd(''); toast.success('Password changed successfully'); },
    onError: (err) => toast.error(err?.response?.data?.error ?? 'Failed to change password'),
  });

  function handlePasswordSubmit(e) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { toast.error('New passwords do not match'); return; }
    if (newPwd.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    passwordMutation.mutate();
  }

  const isDirty = profile && name.trim() !== profile.name;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage your personal information and photo</p>
      </div>

      <div className="mx-auto w-full max-w-2xl p-6 space-y-6">

        {/* Avatar + name */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <Avatar name={name || profile?.name} avatarUrl={avatarUrl} uploading={avatarMutation.isPending}
              onFileChange={(file) => avatarMutation.mutate(file)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1">Display Name</p>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Click the camera icon to change your photo (JPEG/PNG/WebP, max 2MB)</p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending || !name.trim()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Account Information</h2>
          <div className="space-y-4">
            {[
              { Icon: Mail, label: 'Email address', value: profile?.email },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                  <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                <Shield className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Plan</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PLAN_COLORS[profile?.plan ?? 'free']}`}>
                    {profile?.plan ?? 'free'}
                  </span>
                  {profile?.plan === 'free' && <a href="/billing" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Upgrade →</a>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
                <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500">Member since</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <PasswordField label="Current Password" value={currentPwd} onChange={setCurrentPwd} placeholder="Enter current password" />
            <PasswordField label="New Password" value={newPwd} onChange={setNewPwd} placeholder="At least 8 characters" />
            <PasswordField label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Repeat new password" />
            <div className="flex justify-end">
              <button type="submit"
                disabled={!currentPwd || !newPwd || !confirmPwd || passwordMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                <Lock className="h-4 w-4" />
                {passwordMutation.isPending ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { Icon: Briefcase, value: profile?.totalApplications ?? 0, label: 'Applications tracked', color: 'text-indigo-600' },
            { Icon: FileText,  value: profile?.totalResumes ?? 0,      label: 'Resumes uploaded',    color: 'text-indigo-600' },
          ].map(({ Icon, value, label, color }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
