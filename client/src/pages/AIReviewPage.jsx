import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Zap, Briefcase, ExternalLink, MessageSquare, Lightbulb,
  ChevronRight, AlertTriangle, MessageCircle, Clock,
  Code2, Pen, Cloud, FileText, BarChart2,
} from 'lucide-react';
import { resumesApi } from '../api/resumesApi.js';
import { aiApi } from '../api/aiApi.js';
import { useAuth } from '../hooks/useAuth.js';

// ── Local history ─────────────────────────────────────────────────────────────

const HISTORY_KEY = 'cp_ai_reviews_v1';
const PLAN_CREDITS = { free: 3, pro: 20, premium: Infinity };

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); } catch { return []; }
}
function pushHistory(entry) {
  const h = [entry, ...getHistory()].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
  return h;
}
function creditsUsedThisMonth(history) {
  const now = new Date();
  return history.filter((h) => {
    const d = new Date(h.timestamp);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function RoleIcon({ label }) {
  const l = label.toLowerCase();
  let Icon = FileText;
  if (/engineer|developer|frontend|backend|full.?stack|software/.test(l)) Icon = Code2;
  else if (/design|ux|ui/.test(l)) Icon = Pen;
  else if (/manager|product|pm\b/.test(l)) Icon = Briefcase;
  else if (/data|analyst|analytics/.test(l)) Icon = BarChart2;
  else if (/devops|cloud|infra|sre/.test(l)) Icon = Cloud;
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
      <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
    </div>
  );
}

// ── ATS score ring ────────────────────────────────────────────────────────────

function ScoreRing({ score }) {
  const r = 44, cx = 52, cy = 52, sw = 9;
  const circ = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, score / 100)) * circ;
  const color = score >= 75 ? '#4f46e5' : score >= 50 ? '#f59e0b' : '#ef4444';
  const badge = score >= 80 ? { label: 'OPTIMAL', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' }
    : score >= 60 ? { label: 'GOOD', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' }
    : { label: 'NEEDS WORK', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' };
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={104} height={104} viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth={sw} />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'none' }}>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{score}%</span>
        </div>
      </div>
      <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
        {badge.label}
      </span>
    </div>
  );
}

// ── Right-column panels ───────────────────────────────────────────────────────

function StatCards({ lastScore, creditsLeft, plan }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* ATS Match */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">ATS Match</p>
        {lastScore != null
          ? <ScoreRing score={lastScore} />
          : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-slate-200 dark:border-slate-600">
              <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
            </div>
          )}
      </div>

      {/* Credits */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="flex w-full items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Credits</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
            <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div>
          <p className="text-5xl font-bold text-slate-900 dark:text-slate-100">{creditsLeft === Infinity ? '∞' : creditsLeft}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Remaining this month</p>
        </div>
        {plan === 'free' ? (
          <Link to="/billing" className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Upgrade for more <ChevronRight className="h-3 w-3" />
          </Link>
        ) : (
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 capitalize">{plan} plan</p>
        )}
      </div>
    </div>
  );
}

function RecentReviews({ history }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Recent Reviews</h3>
        {history.length > 0 && (
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-default">View all</span>
        )}
      </div>
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Clock className="h-8 w-8 text-slate-200 dark:text-slate-600 mb-2" />
          <p className="text-sm text-slate-400 dark:text-slate-500">No reviews yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {history.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
              <RoleIcon label={item.resumeLabel} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.resumeLabel}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {item.context ? `${item.context} • ` : ''}{timeAgo(item.timestamp)}
                </p>
              </div>
              <span className={`text-sm font-bold ${
                item.score >= 75 ? 'text-green-600' : item.score >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {item.score}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MissingKeywords({ keywords }) {
  if (!keywords?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" style={{ width: 18, height: 18 }} />
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Missing Keywords</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <span key={kw} className="rounded-full border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400">
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionFeedback({ feedback }) {
  if (!feedback || Object.keys(feedback).length === 0) return null;
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" style={{ width: 18, height: 18 }} />
        <h3 className="font-bold text-slate-900 dark:text-slate-100">Section Feedback</h3>
      </div>
      <div className="space-y-3">
        {Object.entries(feedback).map(([section, text]) => (
          <div key={section}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{section}</span>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopSuggestions({ suggestions }) {
  if (!suggestions?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3">Top Suggestions</h3>
      <ol className="space-y-2.5">
        {suggestions.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}

function AIInsights({ suggestion }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <Lightbulb className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">AI INSIGHTS</span>
        </div>
        <p className="text-sm leading-relaxed text-white/90 mb-3">{suggestion}</p>
        <div className="border-t border-white/20 pt-3">
          <p className="text-[10px] text-white/50">Contextual tip based on your last review</p>
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-white/10" />
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-indigo-500/20" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIReviewPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefill = state?.prefill ?? null;

  const [resumeId, setResumeId] = useState('');
  const [jobDescription, setJobDescription] = useState(prefill?.description ?? '');
  const [history, setHistory] = useState(() => getHistory());

  const lastScore = history[0]?.score ?? null;

  const { data: resumes = [], isLoading: loadingResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumesApi.list,
  });

  const { data: usage, refetch: refetchUsage } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: aiApi.getUsage,
    staleTime: 0,
  });

  const plan = usage?.plan ?? user?.plan ?? 'free';
  const maxCredits = usage?.limit === null ? Infinity : (usage?.limit ?? PLAN_CREDITS[plan] ?? 3);
  const creditsLeft = maxCredits === Infinity
    ? Infinity
    : Math.max(0, maxCredits - (usage?.used ?? creditsUsedThisMonth(history)));

  const reviewMutation = useMutation({
    mutationFn: () => aiApi.reviewResume({ resumeId, jobDescription }),
    onSuccess: (data) => {
      const selectedResume = resumes.find((r) => r.id === resumeId);
      const context = jobDescription.split('\n')[0]?.trim().slice(0, 35) || '';
      const entry = {
        id: Date.now(),
        resumeLabel: selectedResume?.label ?? 'Resume',
        context,
        score: data.overallScore,
        atsCompatibility: data.atsCompatibility,
        timestamp: new Date().toISOString(),
      };
      setHistory(pushHistory(entry));
      refetchUsage();
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    reviewMutation.mutate();
  }

  const result = reviewMutation.data;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5 flex items-start justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Resume Review</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Optimize your application with precision. Our AI analyzes your resume against industry-standard ATS algorithms.
          </p>
        </div>
        {prefill && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 flex-shrink-0">
            <Briefcase className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <div>
              <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">{prefill.role} — {prefill.company}</p>
              <button
                onClick={() => navigate('/ai/interview-prep', { state: { prefill } })}
                className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <MessageSquare className="h-3 w-3" /> Prep for interview instead
              </button>
            </div>
            {prefill.jobUrl && (
              <a href={prefill.jobUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300">
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-8 py-6 bg-slate-50 dark:bg-slate-800/30">
        <div className="grid grid-cols-5 gap-6 items-start">

          {/* ── Left: Analysis Input (sticky) ── */}
          <div className="col-span-5 lg:col-span-3 sticky top-0">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
              {/* Card header */}
              <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700 px-6 py-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                  <BarChart2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Analysis Input</h2>
              </div>

              <div className="space-y-5 p-6">
                {/* Resume picker */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Resume</label>
                  {loadingResumes ? (
                    <div className="h-11 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
                  ) : resumes.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                      No resumes found.{' '}
                      <Link to="/resumes" className="font-bold underline">Upload one →</Link>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={resumeId}
                        onChange={(e) => setResumeId(e.target.value)}
                        required
                        className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 pr-10 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                      >
                        <option value="">— choose a resume —</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}{r.version ? ` (${r.version})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Job description */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Job Description</label>
                  <textarea
                    rows={10}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                    minLength={50}
                    placeholder="Paste the target job description here for a tailored match analysis..."
                    className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                  />
                  {jobDescription.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{jobDescription.length} chars — minimum 50</p>
                  )}
                </div>

                {/* Analyze button */}
                <button
                  type="submit"
                  disabled={!resumeId || jobDescription.length < 50 || reviewMutation.isPending}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-indigo-700 py-3.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99] shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  <Zap className="h-4 w-4" />
                  {reviewMutation.isPending ? 'Analyzing your resume…' : 'Analyze Resume'}
                </button>

                {reviewMutation.isError && (
                  <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">
                    {reviewMutation.error?.response?.data?.error ?? 'Something went wrong. Please try again.'}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* ── Right: Results + Stats ── */}
          <div className="col-span-5 lg:col-span-2 space-y-4">
            <StatCards lastScore={result ? result.overallScore : lastScore} creditsLeft={creditsLeft} plan={plan} />

            {result && (
              <>
                <MissingKeywords keywords={result.missingKeywords} />
                <SectionFeedback feedback={result.sectionFeedback} />
                <TopSuggestions suggestions={result.topSuggestions} />
              </>
            )}

            <RecentReviews history={history} />

            {result?.topSuggestions?.[0] && (
              <AIInsights suggestion={result.topSuggestions[0]} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
