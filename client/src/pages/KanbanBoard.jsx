import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, X, Briefcase, CalendarDays, Award, TrendingUp,
  MapPin, FileText, StickyNote, Check, Bell, DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { applicationsApi } from '../api/applicationsApi.js';
import { analyticsApi } from '../api/analyticsApi.js';
import OnboardingChecklist from '../components/OnboardingChecklist.jsx';

// ── Gradient avatar ───────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-red-400 to-orange-500',
  'from-blue-400 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-green-400 to-emerald-600',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-600',
  'from-teal-400 to-cyan-600',
  'from-indigo-400 to-blue-600',
];

function avatarGradient(name) {
  return GRADIENTS[(name?.charCodeAt(0) ?? 0) % GRADIENTS.length];
}

function daysAgo(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return 'Applied today';
  if (days === 1) return 'Applied 1 day ago';
  return `Applied ${days} days ago`;
}

// ── Columns ───────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'applied',   label: 'Applied',   dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/20'     },
  { id: 'screening', label: 'Screening', dot: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/20'   },
  { id: 'interview', label: 'Interview', dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  { id: 'offer',     label: 'Offer',     dot: 'bg-green-500',  bg: 'bg-green-50 dark:bg-green-950/20'   },
  { id: 'rejected',  label: 'Rejected',  dot: 'bg-red-400',    bg: 'bg-red-50 dark:bg-red-950/20'       },
];

function groupByStatus(items) {
  const g = {};
  COLUMNS.forEach(({ id }) => (g[id] = []));
  items.forEach((a) => { if (g[a.status]) g[a.status].push(a); });
  return g;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg, trend, trendColor }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </div>
      </div>
      <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 leading-none">{value}</p>
      {trend && (
        <p className={`mt-2 text-xs font-semibold ${trendColor ?? 'text-slate-400'}`}>{trend}</p>
      )}
    </div>
  );
}

// ── Quick notes popover ───────────────────────────────────────────────────────

function QuickNotes({ app, onClose }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(app.notes ?? '');
  const mutation = useMutation({
    mutationFn: () => applicationsApi.update(app.id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Notes saved');
      onClose();
    },
  });
  return (
    <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <textarea
        autoFocus
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder="Add a note…"
        className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <div className="mt-2 flex justify-end gap-1.5">
        <button onClick={onClose} className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
        <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          <Check className="h-3 w-3" /> Save
        </button>
      </div>
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({ app, provided, snapshot }) {
  const navigate = useNavigate();
  const [showNotes, setShowNotes] = useState(false);
  const initials = (app.company ?? '').slice(0, 2).toUpperCase();
  const gradient = avatarGradient(app.company);

  // Follow-up pill
  let followUp = null;
  if (app.followUpDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(app.followUpDate); due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / 86400000);
    const label = diff < 0 ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Follow up today' : `Follow up in ${diff}d`;
    const cls = diff < 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : diff === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';
    followUp = (
      <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
        <Bell className="h-2.5 w-2.5" /> {label}
      </span>
    );
  }

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`relative bg-white dark:bg-slate-800 rounded-2xl border p-4 shadow-sm cursor-pointer select-none transition-all duration-150 ${
        snapshot.isDragging
          ? 'border-indigo-300 dark:border-indigo-600 shadow-xl ring-2 ring-indigo-200 dark:ring-indigo-700 rotate-1'
          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:shadow-md hover:-translate-y-0.5'
      }`}
      onClick={() => navigate(`/applications/${app.id}`)}
    >
      {/* Company avatar + title */}
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1">{app.roleTitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{app.company}</p>
        </div>
      </div>

      {/* Source chip */}
      {app.source && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span>{app.source}</span>
        </div>
      )}

      {/* Resume chip */}
      {app.resume && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400">
          <FileText className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{app.resume.label}</span>
        </div>
      )}

      {/* Salary chip */}
      {(app.salaryMin || app.salaryMax) && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <DollarSign className="h-3 w-3 flex-shrink-0" />
          <span>
            {app.salaryCurrency}{' '}
            {app.salaryMin ? Number(app.salaryMin).toLocaleString() : '?'}
            {app.salaryMax ? ` – ${Number(app.salaryMax).toLocaleString()}` : '+'}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">{daysAgo(app.appliedAt)}</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {followUp}
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotes((s) => !s); }}
            className="rounded-lg p-1 text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-500 transition-colors"
          >
            <StickyNote className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showNotes && <QuickNotes app={app} onClose={() => setShowNotes(false)} />}
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['applications', 'kanban'],
    queryFn: () => applicationsApi.list({ limit: 100 }),
    retry: 2,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'user'],
    queryFn: analyticsApi.getUserAnalytics,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => applicationsApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
    onError: () => toast.error('Failed to move card — please try again'),
  });

  function onDragEnd({ destination, source, draggableId }) {
    if (!destination || destination.droppableId === source.droppableId) return;
    statusMutation.mutate({ id: draggableId, status: destination.droppableId });
  }

  // Stats — derived from allItems immediately (no analytics wait), analytics fills in when ready
  const allItems = data?.items ?? [];
  const totalApps    = analytics?.totalApplications
    ?? data?.pagination?.total
    ?? allItems.length;
  const interviews   = analytics?.interviews
    ?? allItems.filter((a) => a.status === 'interview').length;
  const offers       = analytics?.offers
    ?? allItems.filter((a) => a.status === 'offer').length;
  const responseRate = analytics?.responseRate
    ?? (allItems.length
      ? Math.round(allItems.filter((a) => ['screening', 'interview', 'offer', 'rejected'].includes(a.status)).length / allItems.length * 100)
      : 0);

  // Week trend — only available from analytics
  const weeks = analytics?.applicationsByWeek ?? [];
  const lastWeekCount = weeks[weeks.length - 1]?.count ?? 0;
  const prevWeekCount = weeks[weeks.length - 2]?.count ?? 0;
  const weekDiff = lastWeekCount - prevWeekCount;

  // Filtered items
  const q = search.trim().toLowerCase();
  const items = q
    ? allItems.filter((a) =>
        a.company.toLowerCase().includes(q) ||
        a.roleTitle.toLowerCase().includes(q) ||
        (a.source ?? '').toLowerCase().includes(q)
      )
    : allItems;
  const groups = groupByStatus(items);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5">
          <div className="h-7 w-36 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="p-8 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-500">Could not load your applications — the server may be waking up.</p>
        <button
          onClick={() => refetch()}
          className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Track every application from applied to offer. Drag cards to update their stage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies or roles…"
                className="w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* New application */}
            <Link
              to="/applications"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              New application
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards + onboarding — pinned, never scroll horizontally */}
      <div className="flex-shrink-0 px-8 pt-6 pb-4 space-y-6">

        {/* ── Onboarding checklist (auto-hides when dismissed or completed) ── */}
        <OnboardingChecklist />

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total applications"
            value={totalApps}
            icon={Briefcase}
            iconBg="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
            trend={weekDiff > 0 ? `+${weekDiff} this week` : weekDiff < 0 ? `${weekDiff} this week` : 'No change this week'}
            trendColor={weekDiff > 0 ? 'text-green-500' : weekDiff < 0 ? 'text-red-500' : 'text-slate-400'}
          />
          <StatCard
            label="Active interviews"
            value={interviews}
            icon={CalendarDays}
            iconBg="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
            trend={interviews > 0 ? `${Math.round((interviews / Math.max(totalApps, 1)) * 100)}% of applications` : 'None yet'}
            trendColor={interviews > 0 ? 'text-purple-500' : 'text-slate-400'}
          />
          <StatCard
            label="Offers"
            value={offers}
            icon={Award}
            iconBg="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
            trend={offers > 0 ? 'Congratulations! 🎉' : 'Keep applying'}
            trendColor={offers > 0 ? 'text-green-500' : 'text-slate-400'}
          />
          <StatCard
            label="Response rate"
            value={`${responseRate}%`}
            icon={TrendingUp}
            iconBg="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
            trend={responseRate >= 30 ? 'Above average 🚀' : responseRate >= 10 ? 'Keep it up' : 'Send more apps'}
            trendColor={responseRate >= 30 ? 'text-green-500' : responseRate >= 10 ? 'text-amber-500' : 'text-red-500'}
          />
        </div>

        {/* Search result notice */}
        {search.trim() && (
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{items.length}</span> of {allItems.length} applications matching "{search}"
          </p>
        )}
      </div>

      {/* ── Kanban — its own scroll zone so stat cards stay pinned ── */}
      <div className="flex-1 overflow-auto px-8 pb-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map(({ id, label, dot, bg }) => (
              <div key={id} className="w-72 flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`h-2 w-2 rounded-full ${dot} flex-shrink-0`} />
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">{label}</span>
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {groups[id].length}
                  </span>
                </div>

                {/* Droppable zone */}
                <Droppable droppableId={id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-28 rounded-2xl p-2.5 space-y-3 transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-700'
                          : bg
                      }`}
                    >
                      {groups[id].map((app, index) => (
                        <Draggable key={app.id} draggableId={app.id} index={index}>
                          {(provided, snapshot) => (
                            <KanbanCard app={app} provided={provided} snapshot={snapshot} />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Empty column hint */}
                      {groups[id].length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-xs text-slate-400 dark:text-slate-600">Drop cards here</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
