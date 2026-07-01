import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/common/Button.jsx';
import { X, Briefcase, FileText, Sparkles, DollarSign, Calendar, Clock } from 'lucide-react';

const PLAN_OPTIONS = ['', 'free', 'pro', 'premium'];

const PLAN_COLORS = {
  free:    'bg-slate-100 text-slate-600',
  pro:     'bg-indigo-100 text-indigo-700',
  premium: 'bg-amber-100 text-amber-700',
};

function Badge({ children, color }) {
  const colors = {
    green:  'bg-green-100 text-green-700',
    red:    'bg-red-100 text-red-700',
    slate:  'bg-slate-100 text-slate-600',
    indigo: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[color] ?? colors.slate}`}>
      {children}
    </span>
  );
}

function StatTile({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function UserDetailPanel({ userId, onClose, onBan, onPlanChange, onDelete, banPending, planPending }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user-detail', userId],
    queryFn: () => adminApi.getUserDetail(userId),
    enabled: !!userId,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">User detail</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">Loading…</div>
        ) : user ? (
          <div className="p-5 space-y-5">
            {/* Identity */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
                {user.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_COLORS[user.subscription?.plan ?? 'free']}`}>
                    {user.subscription?.plan ?? 'free'}
                  </span>
                  <Badge color={user.isActive ? 'green' : 'red'}>
                    {user.isActive ? 'Active' : 'Banned'}
                  </Badge>
                  {user.role === 'admin' && <Badge color="indigo">Admin</Badge>}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Joined</p>
                  <p className="font-medium text-slate-700">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Last active</p>
                  <p className="font-medium text-slate-700">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Stats</p>
              <div className="grid grid-cols-2 gap-2">
                <StatTile icon={Briefcase} label="Applications" value={user.applicationCount ?? 0} />
                <StatTile icon={FileText} label="Resumes" value={user.resumeCount ?? 0} />
                <StatTile icon={Sparkles} label="AI calls (month)" value={user.aiThisMonth?.calls ?? 0} />
                <StatTile icon={DollarSign} label="AI cost (month)" value={`$${user.aiThisMonth?.costUsd ?? '0.0000'}`} />
              </div>
            </div>

            {/* Actions */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</p>
              <div className="space-y-3">
                {/* Plan change */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <span className="text-sm text-slate-700">Change plan</span>
                  <select
                    value={user.subscription?.plan ?? 'free'}
                    onChange={(e) => onPlanChange(user.id, e.target.value)}
                    disabled={planPending}
                    className="rounded border border-slate-200 px-2 py-1 text-xs capitalize focus:outline-none focus:border-indigo-400 disabled:opacity-50"
                  >
                    {['free', 'pro', 'premium'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Ban/unban */}
                <button
                  onClick={() => onBan(user.id)}
                  disabled={banPending}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${
                    user.isActive
                      ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {user.isActive ? 'Ban this user' : 'Unban this user'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => onDelete(user)}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition"
                >
                  Delete account permanently
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="p-5 text-sm text-slate-400">User not found.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [planFilter, setPlanFilter]   = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [confirmDelete, setConfirmDelete]   = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, planFilter],
    queryFn: () => adminApi.listUsers({ page, limit: 20, search, plan: planFilter }),
    keepPreviousData: true,
  });

  const banMutation = useMutation({
    mutationFn: (id) => adminApi.banUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail'] });
    },
  });

  const planMutation = useMutation({
    mutationFn: ({ id, plan }) => adminApi.changeUserPlan(id, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user-detail'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      setConfirmDelete(null);
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">User Management</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search name or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          <select
            value={planFilter}
            onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All plans</option>
            {PLAN_OPTIONS.filter(Boolean).map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading…</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Name / Email', 'Plan', 'Apps', 'Signed up', 'Last active', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.items?.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className="cursor-pointer hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {user.role === 'admin' && <Badge color="indigo">admin</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PLAN_COLORS[user.plan]}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.applicationCount}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={user.isActive ? 'green' : 'red'}>
                          {user.isActive ? 'Active' : 'Banned'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {data?.items?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>
                  {data.pagination.total} users · page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</Button>
                  <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page === data.pagination.totalPages}>Next →</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User detail slide-over */}
      {selectedUserId && (
        <UserDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onBan={(id) => banMutation.mutate(id)}
          onPlanChange={(id, plan) => planMutation.mutate({ id, plan })}
          onDelete={(user) => setConfirmDelete(user)}
          banPending={banMutation.isPending}
          planPending={planMutation.isPending}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900">Delete user?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will permanently delete <strong>{confirmDelete.name}</strong> and all their data. This cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="danger"
                isLoading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
              >
                Delete permanently
              </Button>
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
