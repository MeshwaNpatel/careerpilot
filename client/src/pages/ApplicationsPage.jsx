import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus, Download, Link, ClipboardList, AlertTriangle, Archive, CheckSquare, Square, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { applicationsApi } from '../api/applicationsApi.js';
import { analyticsApi } from '../api/analyticsApi.js';
import { parseDate, formatDate } from '../utils/date.js';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Modal from '../components/common/Modal.jsx';

const STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected'];

const STATUS_STYLES = {
  applied:   'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
  screening: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  interview: 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
  offer:     'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  rejected:  'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
};

const STATUS_LABELS = {
  applied:   'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer:     'Offer Received',
  rejected:  'Rejected',
};

const formSchema = z.object({
  company:        z.string().trim().min(1, 'Required').max(255),
  roleTitle:      z.string().trim().min(1, 'Required').max(255),
  status:         z.enum(STATUSES).default('applied'),
  appliedAt:      z.string().min(1, 'Required'),
  jobUrl:         z.string().trim().max(500).optional().or(z.literal('')),
  source:         z.string().trim().max(100).optional().or(z.literal('')),
  notes:          z.string().optional().or(z.literal('')),
  salaryMin:      z.coerce.number().int().nonnegative().optional().or(z.literal('')),
  salaryMax:      z.coerce.number().int().nonnegative().optional().or(z.literal('')),
  salaryCurrency: z.string().length(3).default('USD'),
});

function ApplicationForm({ defaultValues, onSubmit, isLoading, existingApps = [] }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? { status: 'applied', appliedAt: new Date().toISOString().slice(0, 10) },
  });

  const watchedCompany = watch('company', '');
  const watchedRole = watch('roleTitle', '');

  const duplicates = (watchedCompany.trim().length > 1 && watchedRole.trim().length > 1)
    ? existingApps.filter((a) =>
        a.company.toLowerCase() === watchedCompany.trim().toLowerCase() &&
        a.roleTitle.toLowerCase() === watchedRole.trim().toLowerCase()
      )
    : [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {duplicates.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Possible duplicate — </span>
            {duplicates.map((a, i) => (
              <span key={a.id}>
                {i > 0 && ', '}
                you applied to this role on {formatDate(a.appliedAt, { month: 'short', day: 'numeric', year: 'numeric' })} ({a.status})
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Company *" error={errors.company?.message} {...register('company')} />
        <Input label="Role Title *" error={errors.roleTitle?.message} {...register('roleTitle')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Status" {...register('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </Select>
        <Input label="Applied Date *" type="date" error={errors.appliedAt?.message} {...register('appliedAt')} />
      </div>
      <Input label="Job URL" error={errors.jobUrl?.message} {...register('jobUrl')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Source (e.g. LinkedIn)" error={errors.source?.message} {...register('source')} />
      </div>
      {/* Salary */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Salary Range (optional)</label>
        <div className="flex items-center gap-2">
          <select
            {...register('salaryCurrency')}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <Input placeholder="Min (e.g. 80000)" type="number" {...register('salaryMin')} />
          <span className="text-slate-400">–</span>
          <Input placeholder="Max (e.g. 120000)" type="number" {...register('salaryMax')} />
        </div>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</span>
        <textarea
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
          {...register('notes')}
        />
      </label>
      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Save Changes' : 'Add Application'}
        </Button>
      </div>
    </form>
  );
}

function StatCard({ label, value, sub, subColor, progress, progressColor }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {sub && <span className={`text-xs font-bold ${subColor ?? 'text-slate-400'}`}>{sub}</span>}
      </div>
      <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
      <div className="mt-3 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${progressColor ?? 'bg-indigo-500'}`} style={{ width: `${Math.min(100, progress ?? 0)}%` }} />
      </div>
    </div>
  );
}

function CompanyAvatar({ name }) {
  return (
    <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm border border-indigo-100 dark:border-indigo-800">
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('appliedAt');
  const [order, setOrder] = useState('desc');
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const LIMIT = 10;

  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim();
      setSearch(trimmed);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleSort(field) {
    if (sortBy === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(1);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await applicationsApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'careerpilot-applications.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['applications', 'list', statusFilter, page, search, sortBy, order],
    queryFn: () => applicationsApi.list({
      page,
      limit: LIMIT,
      ...(statusFilter && { status: statusFilter }),
      ...(search && { search }),
      sortBy,
      order,
    }),
  });

  // Fetch all apps for duplicate detection (only when modal is open)
  const { data: allAppsData } = useQuery({
    queryKey: ['applications', 'all-for-dedup'],
    queryFn: () => applicationsApi.list({ limit: 200 }),
    enabled: showModal,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'user'],
    queryFn: analyticsApi.getUserAnalytics,
  });

  const createMutation = useMutation({
    mutationFn: (values) => {
      const { jobUrl, source, notes, ...rest } = values;
      return applicationsApi.create({ ...rest, ...(jobUrl && { jobUrl }), ...(source && { source }), ...(notes && { notes }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowModal(false);
      toast.success('Application added');
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Failed to add application'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => applicationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application deleted');
    },
    onError: () => toast.error('Failed to delete application'),
  });

  const [bulkLoading, setBulkLoading] = useState(false);

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} application${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => applicationsApi.remove(id)));
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(`Deleted ${selected.size} application${selected.size > 1 ? 's' : ''}`);
      setSelected(new Set());
    } catch {
      toast.error('Some deletions failed — please try again');
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkArchive() {
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => applicationsApi.update(id, { isArchived: true })));
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(`Archived ${selected.size} application${selected.size > 1 ? 's' : ''}`);
      setSelected(new Set());
    } catch {
      toast.error('Some archives failed — please try again');
    } finally {
      setBulkLoading(false);
    }
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (items.every((a) => selected.has(a.id))) {
      setSelected((prev) => { const next = new Set(prev); items.forEach((a) => next.delete(a.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); items.forEach((a) => next.add(a.id)); return next; });
    }
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;

  // Stats derived from analytics API
  const byStatus    = analytics?.byStatus ?? {};
  const interviews  = byStatus.interview ?? 0;
  const offers      = byStatus.offer ?? 0;
  const responseRate = analytics?.responseRate ?? 0;
  const totalApps   = analytics?.total ?? total;

  // Numbered pagination helpers
  function getPages(current, totalPages) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3) pages.push('…');
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i);
    if (current < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  const totalPages = pagination?.totalPages ?? 1;
  const pageNumbers = getPages(page, totalPages);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Applications</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Track and manage your job applications across the entire hiring lifecycle.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Application
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6 space-y-5">

        {/* ── Stats Bento ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Applications"
            value={totalApps}
            sub={totalApps > 0 ? 'Active' : ''}
            subColor="text-indigo-500"
            progress={Math.min(100, totalApps * 2)}
            progressColor="bg-indigo-500"
          />
          <StatCard
            label="Interviews"
            value={interviews}
            sub={interviews > 0 ? `${Math.round((interviews / Math.max(totalApps, 1)) * 100)}%` : '—'}
            subColor="text-purple-500"
            progress={Math.round((interviews / Math.max(totalApps, 1)) * 100)}
            progressColor="bg-purple-500"
          />
          <StatCard
            label="Offers"
            value={offers}
            sub={offers > 0 ? 'Received' : '—'}
            subColor="text-green-500"
            progress={Math.round((offers / Math.max(totalApps, 1)) * 100)}
            progressColor="bg-green-500"
          />
          <StatCard
            label="Response Rate"
            value={`${responseRate}%`}
            sub={responseRate >= 30 ? 'High' : responseRate >= 10 ? 'Avg' : '—'}
            subColor={responseRate >= 30 ? 'text-green-500' : 'text-slate-400'}
            progress={responseRate}
            progressColor={responseRate >= 30 ? 'bg-green-500' : 'bg-indigo-500'}
          />
        </div>

        {/* ── Filter Tabs + Search ── */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max">
            {['', ...STATUSES].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); setSelected(new Set()); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === s
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {s ? STATUS_LABELS[s] : 'All'}
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search company or role…"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-1/5 animate-pulse rounded bg-slate-100 dark:bg-slate-600" />
                </div>
                <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
              <ClipboardList className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {search ? 'No results found' : 'No applications yet'}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              {search
                ? `No applications match "${search}". Try a different search term.`
                : 'Start tracking your job search by adding your first application.'}
            </p>
            {!search && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" /> Add Application
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60">
                    <th className="w-10 px-4 py-3">
                      <button onClick={toggleSelectAll} className="text-slate-400 hover:text-indigo-500 transition-colors">
                        {items.length > 0 && items.every((a) => selected.has(a.id))
                          ? <CheckSquare className="h-4 w-4 text-indigo-500" />
                          : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    {[
                      { label: 'Company & Role', field: 'company' },
                      { label: 'Status', field: null },
                      { label: 'Source', field: null },
                      { label: 'Applied', field: 'appliedAt' },
                      { label: 'Resume', field: null },
                      { label: '', field: null },
                    ].map(({ label, field }) =>
                      field ? (
                        <th
                          key={label}
                          onClick={() => handleSort(field)}
                          className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 cursor-pointer select-none hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            {label}
                            {sortBy === field ? (
                              order === 'asc'
                                ? <ChevronUp className="h-3.5 w-3.5 text-indigo-500" />
                                : <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 opacity-30" />
                            )}
                          </div>
                        </th>
                      ) : (
                        <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((app) => (
                    <tr
                      key={app.id}
                      className={`group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        app.status === 'rejected' ? 'opacity-60' : ''
                      } ${selected.has(app.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(app.id); }}
                          className="text-slate-300 dark:text-slate-600 hover:text-indigo-500 transition-colors"
                        >
                          {selected.has(app.id)
                            ? <CheckSquare className="h-4 w-4 text-indigo-500" />
                            : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      {/* Company & Role */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CompanyAvatar name={app.company} />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{app.company}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{app.roleTitle}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_STYLES[app.status]}`}>
                          {STATUS_LABELS[app.status]}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        {app.source || '—'}
                      </td>

                      {/* Applied date */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(app.appliedAt, { month: 'short', day: 'numeric' })}
                        </p>
                        {app.followUpDate && (() => {
                          const today = new Date(); today.setHours(12,0,0,0);
                          const due = parseDate(app.followUpDate);
                          const diff = Math.round((due - today) / 86400000);
                          return (
                            <p className={`text-xs font-semibold mt-0.5 ${diff < 0 ? 'text-red-500' : diff === 0 ? 'text-amber-500' : 'text-indigo-500'}`}>
                              Follow-up: {diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Today' : formatDate(app.followUpDate, { month: 'short', day: 'numeric' })}
                            </p>
                          );
                        })()}
                      </td>

                      {/* Resume */}
                      <td className="px-4 py-3">
                        {app.resume ? (
                          <div className="flex items-center gap-1.5 text-indigo-500 text-xs">
                            <Link className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[120px]">{app.resume.label}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this application?')) deleteMutation.mutate(app.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400">
                    Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} applications
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {pageNumbers.map((p, i) =>
                        p === '…' ? (
                          <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                              page === p
                                ? 'bg-indigo-600 text-white'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 shadow-2xl shadow-slate-900/20 dark:shadow-slate-900/60">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {selected.size} selected
          </span>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={handleBulkArchive}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            <Archive className="h-4 w-4" /> Archive
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Add Application Modal ── */}
      {showModal && (
        <Modal title="Add Application" onClose={() => setShowModal(false)}>
          <ApplicationForm
            onSubmit={(values) => createMutation.mutate(values)}
            isLoading={createMutation.isPending}
            existingApps={allAppsData?.items ?? []}
          />
          {createMutation.isError && (
            <p className="mt-2 text-center text-sm text-red-600">
              {createMutation.error?.response?.data?.error ?? 'Something went wrong'}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
