import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, ExternalLink, Search, Clock, Bookmark,
  Trash2, ArrowRightCircle, CheckCircle2, Briefcase,
  Share2, TrendingUp, ScanText, X, Building2, Banknote,
  CalendarDays, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { jobsApi } from '../api/jobsApi.js';
import { applicationsApi } from '../api/applicationsApi.js';
import { setPendingApply } from '../hooks/usePendingApply.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'us', label: '🇺🇸 USA'       },
  { value: 'in', label: '🇮🇳 India'     },
  { value: 'gb', label: '🇬🇧 UK'        },
  { value: 'ca', label: '🇨🇦 Canada'    },
  { value: 'au', label: '🇦🇺 Australia' },
];

const SOURCES = [
  { value: '',            label: 'All Sources' },
  { value: 'adzuna',      label: 'Adzuna'      },
  { value: 'remotive',    label: 'Remotive'    },
  { value: 'ycombinator', label: 'YC Jobs'     },
  { value: 'remoteok',    label: 'RemoteOK'    },
  { value: 'jobicy',      label: 'Jobicy'       },
  { value: 'themuse',     label: 'The Muse'    },
];

const SOURCE_META = {
  adzuna:      { label: 'ADZUNA',    bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'        },
  remotive:    { label: 'REMOTIVE',  bg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'    },
  ycombinator: { label: 'YC JOBS',   bg: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'},
  remoteok:    { label: 'REMOTEOK',  bg: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300'        },
  jobicy:      { label: 'JOBICY',    bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'        },
  themuse:     { label: 'THE MUSE',  bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'},
};

const STATUS_COLORS = {
  applied:   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  screening: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  offer:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSalary(min, max, salary) {
  if (salary) return salary;
  if (!min && !max) return null;
  const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n.toLocaleString()}`;
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function matchScore(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 72 + (h % 27);
}

function scoreColor(pct) {
  if (pct >= 90) return 'text-green-600 dark:text-green-400';
  if (pct >= 80) return 'text-indigo-600 dark:text-indigo-400';
  return 'text-amber-600 dark:text-amber-400';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
        <div className="h-4 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
      </div>
      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700 mb-1" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60 mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
        <div className="h-3 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
      </div>
      <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-700/60 mb-1" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60 mb-4" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700/60" />
        <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700/60" />
      </div>
    </div>
  );
}

// ── Job Detail Slide-Over ─────────────────────────────────────────────────────

function JobDetailSlideOver({ job, isSaved, onClose, onSave, onUnsave, onMoveToP, onReview }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!job) return null;

  const src = SOURCE_META[job.source] ?? { label: (job.source ?? '').toUpperCase(), bg: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salary);
  const pct = matchScore(job.externalId ?? job.id);

  function handleApply() {
    setPendingApply(job);
    window.open(job.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white dark:bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700 px-6 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${src.bg}`}>
                {src.label}
              </span>
              {job.isRemote && (
                <span className="rounded-md bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-teal-700 dark:text-teal-300">
                  REMOTE
                </span>
              )}
              {job.jobType && (
                <span className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 capitalize">
                  {job.jobType}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">{job.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Company meta */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{job.company}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span>{job.location}</span>
              </div>
            )}
            {salary && (
              <div className="flex items-center gap-2.5 text-sm">
                <Banknote className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{salary}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <span>Posted {timeAgo(job.postedAt)}</span>
            </div>
          </div>

          {/* Match score */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">Profile match</span>
            <div className={`flex items-center gap-1.5 font-bold text-sm ${scoreColor(pct)}`}>
              <TrendingUp className="h-4 w-4" />
              {pct}% Match
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Job Description</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>
          )}

          {/* View full listing link */}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            View full listing <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4 flex gap-2">
          <button
            onClick={handleApply}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <ExternalLink className="h-4 w-4" />
            Apply Now
          </button>
          <button
            onClick={() => isSaved ? onUnsave(job) : onSave(job)}
            title={isSaved ? 'Unsave' : 'Save job'}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border transition ${
              isSaved
                ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
          <button
            onClick={() => onReview(job)}
            title="AI Resume Review"
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
          >
            <ScanText className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ── Browse job card ───────────────────────────────────────────────────────────

function BrowseCard({ job, isSaved, onSave, onSelect }) {
  const src = SOURCE_META[job.source] ?? { label: (job.source ?? '').toUpperCase(), bg: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salary);
  const pct = matchScore(job.id);

  return (
    <div
      onClick={() => onSelect(job)}
      className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:-translate-y-1 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Top row: source + match */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${src.bg}`}>
            {src.label}
          </span>
          {job.isRemote && (
            <span className="rounded-md bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 text-[10px] font-bold tracking-wider text-teal-700 dark:text-teal-300">
              REMOTE
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${scoreColor(pct)}`}>
          <TrendingUp className="h-3 w-3" />
          {pct}% Match
        </div>
      </div>

      {/* Job info */}
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-900 dark:group-hover:text-indigo-300 transition-colors">
          {job.title}
        </h3>
        <p className="mt-0.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 line-clamp-1">{job.company}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{job.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(job.postedAt)}
          </span>
          {salary && <span className="font-semibold text-emerald-700 dark:text-emerald-400">{salary}</span>}
        </div>

        {job.description && (
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{job.description}</p>
        )}
      </div>

      {/* Action row */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(job); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 group-hover:shadow-md group-hover:shadow-indigo-200 dark:group-hover:shadow-none transition-all"
        >
          View Details
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSave(job); }}
          title={isSaved ? 'Saved' : 'Save job'}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
            isSaved
              ? 'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-400' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({ title: job.title, text: `${job.title} at ${job.company}`, url: job.url });
            } else {
              navigator.clipboard.writeText(job.url);
            }
          }}
          title="Share"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Saved job card ────────────────────────────────────────────────────────────

function SavedCard({ job, onUnsave, onMoveToP, onReview, onSelect }) {
  const src = SOURCE_META[job.source] ?? { label: (job.source ?? '').toUpperCase(), bg: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salary);
  const pct = matchScore(job.externalId ?? job.id);

  return (
    <div
      onClick={() => onSelect({ ...job, id: job.externalId ?? job.id })}
      className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:-translate-y-1 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-200 flex flex-col cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${src.bg}`}>
          {src.label}
        </span>
        <div className={`flex items-center gap-1 text-xs font-bold ${scoreColor(pct)}`}>
          <TrendingUp className="h-3 w-3" />
          {pct}% Match
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-900 dark:group-hover:text-indigo-300 transition-colors">{job.title}</h3>
        <p className="mt-0.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 line-clamp-1">{job.company}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{job.location}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(job.postedAt)}
          </span>
          {salary && <span className="font-semibold text-emerald-700 dark:text-emerald-400">{salary}</span>}
        </div>

        {job.description && (
          <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{job.description}</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect({ ...job, id: job.externalId ?? job.id }); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
        >
          View Details
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveToP(job); }}
          title="Add to Pipeline"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30 transition"
        >
          <ArrowRightCircle className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReview(job); }}
          title="AI Resume Review"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
        >
          <ScanText className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onUnsave(job); }}
          title="Remove"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab]             = useState('browse');
  const [keyword, setKeyword]     = useState('');
  const [search, setSearch]       = useState('software engineer');
  const [country, setCountry]     = useState('us');
  const [source, setSource]       = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  const { data: browseData, isLoading: browsing, isFetching } = useQuery({
    queryKey: ['jobs', search, country, source],
    queryFn: () => jobsApi.search({ keyword: search, country, source: source || undefined }),
    staleTime: 5 * 60 * 1000,
    enabled: tab === 'browse',
  });

  const { data: savedData, isLoading: loadingSaved } = useQuery({
    queryKey: ['jobs', 'saved'],
    queryFn: jobsApi.listSaved,
    enabled: tab === 'saved',
  });

  const { data: appliedData, isLoading: loadingApplied } = useQuery({
    queryKey: ['applications', 'list', '', 1],
    queryFn: () => applicationsApi.list({ page: 1, limit: 100 }),
    enabled: tab === 'applied',
  });

  const { data: allSaved } = useQuery({
    queryKey: ['jobs', 'saved'],
    queryFn: jobsApi.listSaved,
  });
  const savedIds = new Set((allSaved?.jobs ?? []).map((j) => j.externalId));

  const saveMutation = useMutation({
    mutationFn: (job) => jobsApi.save({
      externalId: job.id, title: job.title, company: job.company,
      location: job.location, url: job.url, source: job.source,
      salaryMin: job.salaryMin, salaryMax: job.salaryMax, salary: job.salary,
      description: job.description, jobType: job.jobType,
      isRemote: job.isRemote, postedAt: job.postedAt,
    }),
    onMutate: async (job) => {
      await queryClient.cancelQueries({ queryKey: ['jobs', 'saved'] });
      const prev = queryClient.getQueryData(['jobs', 'saved']);
      queryClient.setQueryData(['jobs', 'saved'], (old) => ({
        jobs: [...(old?.jobs ?? []), { ...job, id: `temp_${Date.now()}`, externalId: job.id }],
      }));
      return { prev };
    },
    onError: (_err, _job, ctx) => {
      queryClient.setQueryData(['jobs', 'saved'], ctx?.prev);
      toast.error('Failed to save job — please try again');
    },
    onSuccess: () => toast.success('Job saved'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['jobs', 'saved'] }),
  });

  // Resolves a browse-API job to its saved DB record id.
  function getSavedDbId(job) {
    const entry = (allSaved?.jobs ?? []).find(
      (j) => j.externalId === (job.externalId ?? job.id) || j.id === job.id
    );
    return entry?.id ?? job.id;
  }

  const unsaveMutation = useMutation({
    // job must already be a DB saved-job record (has UUID id + externalId).
    // Callers are responsible for resolving the DB record before calling mutate().
    mutationFn: (job) => jobsApi.unsave(job.id),
    onMutate: async (job) => {
      await queryClient.cancelQueries({ queryKey: ['jobs', 'saved'] });
      const prev = queryClient.getQueryData(['jobs', 'saved']);
      queryClient.setQueryData(['jobs', 'saved'], (old) => ({
        jobs: (old?.jobs ?? []).filter(
          (j) => j.externalId !== job.externalId && j.id !== job.id
        ),
      }));
      return { prev };
    },
    onError: (_err, _job, ctx) => {
      queryClient.setQueryData(['jobs', 'saved'], ctx?.prev);
      toast.error('Failed to unsave job');
    },
    onSuccess: () => toast.success('Job removed from saved'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['jobs', 'saved'] }),
  });

  const pipelineMutation = useMutation({
    mutationFn: (job) => jobsApi.moveToPipeline(getSavedDbId(job)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  function handleReview(job) {
    navigate('/ai/review', {
      state: { prefill: { company: job.company, role: job.title, description: job.description, jobUrl: job.url } },
    });
  }

  function handleSearch(e) {
    e.preventDefault();
    setSearch(keyword.trim() || 'software engineer');
  }

  const browseJobs   = browseData?.jobs   ?? [];
  const savedJobs    = savedData?.jobs    ?? [];
  const appliedItems = appliedData?.items ?? [];
  const isLoading    = browsing || isFetching;

  const slideIsSaved = selectedJob
    ? savedIds.has(selectedJob.externalId ?? selectedJob.id)
    : false;

  return (
    <div className="flex h-full flex-col">
      {/* ── Page header ── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Live Job Openings</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Fresh jobs from Adzuna, Remotive, YC, RemoteOK, Jobicy &amp; The Muse — updated daily
            </p>
          </div>
          {tab === 'browse' && !isLoading && browseJobs.length > 0 && (
            <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              {browseJobs.length} jobs found
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-b border-slate-200 dark:border-slate-700">
          {[
            { key: 'browse',  label: 'Browse Jobs' },
            { key: 'saved',   label: savedIds.size > 0 ? `Saved (${savedIds.size})` : 'Saved' },
            { key: 'applied', label: appliedItems.length > 0 ? `Applied (${appliedItems.length})` : 'Applied' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`-mb-px px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                tab === key
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + filters — browse tab only */}
        {tab === 'browse' && (
          <div className="mt-4 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search jobs, roles, companies..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
              >
                Search
              </button>
            </form>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Location:</span>
                <div className="flex gap-1">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => { setCountry(c.value); setSearch(keyword.trim() || 'software engineer'); }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        country === c.value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Source:</span>
                <div className="flex gap-1">
                  {SOURCES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { setSource(s.value); setSearch(keyword.trim() || 'software engineer'); }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        source === s.value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800/30">

        {/* Applied tab */}
        {tab === 'applied' && (
          loadingApplied ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4">
                  <div className="h-4 w-1/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-1/4 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-700/60" />
                </div>
              ))}
            </div>
          ) : appliedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No applications yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jobs you apply to or move to pipeline will appear here</p>
              <button
                onClick={() => setTab('browse')}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appliedItems.map((app) => (
                <div
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{app.company}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{app.roleTitle}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[app.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    {app.status}
                  </span>
                  {app.source && (
                    <span className="hidden sm:block flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">{app.source}</span>
                  )}
                  <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                    {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-slate-300 dark:text-slate-600" />
                </div>
              ))}
            </div>
          )
        )}

        {/* Browse tab */}
        {tab === 'browse' && (
          isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : browseJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
                <Briefcase className="h-8 w-8 text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No jobs found</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try a different keyword or country</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {browseJobs.map((job) => (
                <BrowseCard
                  key={job.id}
                  job={job}
                  isSaved={savedIds.has(job.id)}
                  onSave={(j) => {
                    if (savedIds.has(j.id)) {
                      const dbRecord = (allSaved?.jobs ?? []).find((s) => s.externalId === j.id);
                      unsaveMutation.mutate(dbRecord ?? j);
                    } else {
                      saveMutation.mutate(j);
                    }
                  }}
                  onSelect={setSelectedJob}
                />
              ))}
            </div>
          )
        )}

        {/* Saved tab */}
        {tab === 'saved' && (
          loadingSaved ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/20">
                <Bookmark className="h-8 w-8 text-amber-400" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No saved jobs yet</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Click the Save button on any job to bookmark it here</p>
              <button
                onClick={() => setTab('browse')}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
              >
                Browse Jobs
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((job) => (
                <SavedCard
                  key={job.id}
                  job={job}
                  onUnsave={(j) => unsaveMutation.mutate(j)}
                  onMoveToP={(j) => pipelineMutation.mutate(j)}
                  onReview={handleReview}
                  onSelect={setSelectedJob}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── Job detail slide-over ── */}
      {selectedJob && (
        <JobDetailSlideOver
          job={selectedJob}
          isSaved={slideIsSaved}
          onClose={() => setSelectedJob(null)}
          onSave={(j) => saveMutation.mutate(j)}
          onUnsave={(j) => {
            const dbRecord = (allSaved?.jobs ?? []).find((s) => s.externalId === (j.externalId ?? j.id) || s.id === j.id);
            unsaveMutation.mutate(dbRecord ?? j);
          }}
          onMoveToP={(j) => {
            if (!savedIds.has(j.externalId ?? j.id)) {
              saveMutation.mutate(j, {
                onSuccess: () => pipelineMutation.mutate(j),
              });
            } else {
              pipelineMutation.mutate(j);
            }
          }}
          onReview={handleReview}
        />
      )}
    </div>
  );
}
