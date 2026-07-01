import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MessageSquare,
  Target,
  Bookmark,
  Sparkles,
  Eye,
  EyeOff,
  X,
  Zap,
  BrainCircuit,
} from 'lucide-react';
import { resumesApi } from '../api/resumesApi.js';
import { aiApi } from '../api/aiApi.js';

const CATEGORY_META = {
  behavioral:    { label: 'Behavioral',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'       },
  technical:     { label: 'Technical',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  role_specific: { label: 'Role-Specific', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
  situational:   { label: 'Situational',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'   },
};

// ── Feature cards shown in empty state ────────────────────────────────────────

function FeatureCards() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
          <Target className="h-4.5 w-4.5 text-blue-500" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Targeted Analysis</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          We extract the core competencies required for the specific company culture.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
          <Bookmark className="h-4.5 w-4.5 text-red-400" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Behavioral Prep</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Questions tailored to your experience level and the role's seniority.
        </p>
      </div>
    </div>
  );
}

// ── Expandable question card ──────────────────────────────────────────────────

function QuestionCard({ q, index }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = CATEGORY_META[q.category] ?? { label: q.category, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };

  function copyQ() {
    navigator.clipboard.writeText(`Q: ${q.question}\n\nIdeal Answer Guidance:\n${q.idealAnswer}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
      >
        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
              {meta.label}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{q.question}</p>
        </div>
        <span className="flex-shrink-0 text-slate-400 mt-0.5">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Ideal Answer Guidance</p>
            <button
              onClick={copyQ}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{q.idealAnswer}</p>
        </div>
      )}
    </div>
  );
}

// ── Results section ───────────────────────────────────────────────────────────

function Results({ questions }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const categories = ['behavioral', 'technical', 'role_specific', 'situational'];
  const grouped = categories.reduce((acc, cat) => {
    const qs = questions.filter((q) => q.category === cat);
    if (qs.length) acc[cat] = qs;
    return acc;
  }, {});

  function copyAll() {
    const text = questions
      .map((q, i) => `${i + 1}. [${q.category}] ${q.question}\n→ ${q.idealAnswer}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{questions.length} questions generated</p>
        </div>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
        >
          {copiedAll ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copiedAll ? 'Copied!' : 'Copy all Q&A'}
        </button>
      </div>

      {Object.entries(grouped).map(([cat, qs]) => {
        const meta = CATEGORY_META[cat] ?? { label: cat };
        return (
          <div key={cat}>
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{meta.label}</h3>
            <div className="space-y-3">
              {qs.map((q) => (
                <QuestionCard key={q.question} q={q} index={questions.indexOf(q)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-6 w-6 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
              <div className="h-4 w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AIInterviewPrepPage() {
  const location = useLocation();
  const prefill = location.state?.prefill ?? {};

  const [roleTitle, setRoleTitle]           = useState(prefill.role ?? '');
  const [companyName, setCompanyName]       = useState(prefill.company ?? '');
  const [jobDescription, setJobDescription] = useState(prefill.description ?? '');
  const [resumeId, setResumeId]             = useState('');
  const [result, setResult]                 = useState(null);
  const [showJd, setShowJd]                 = useState(true);

  const { data: resumeData } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumesApi.list,
  });
  const resumes = resumeData?.resumes ?? resumeData ?? [];

  const mutation = useMutation({
    mutationFn: aiApi.generateInterviewPrep,
    onSuccess: (data) => setResult(data),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!roleTitle.trim() || !companyName.trim() || !jobDescription.trim()) return;
    setResult(null);
    mutation.mutate({
      roleTitle: roleTitle.trim(),
      companyName: companyName.trim(),
      jobDescription: jobDescription.trim(),
      resumeId: resumeId || undefined,
    });
  }

  const isReady = roleTitle.trim() && companyName.trim() && jobDescription.trim().length >= 50;
  const errorMsg = mutation.isError
    ? (mutation.error?.response?.data?.error ?? 'Something went wrong. Please try again.')
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* ── Top header ── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Interview Prep</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">AI-generated questions tailored to your target role</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">AI Powered</span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex">

        {/* Left: Interview Context */}
        <div className="w-[420px] flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col">
          {/* Panel header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Interview Context</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Define the role to generate specific questions</p>
          </div>

          {/* Prefill banner */}
          {prefill.role && (
            <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2.5">
              <MessageSquare className="h-4 w-4 flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
              <p className="text-xs text-indigo-800 dark:text-indigo-300">
                Prepping for <strong>{prefill.role}</strong> at <strong>{prefill.company}</strong>
              </p>
            </div>
          )}

          {/* Form — scrollable middle */}
          <form id="interview-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Role Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Role Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                required
                placeholder="e.g. Senior Software Engineer"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                placeholder="e.g. Google"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Description <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={showJd ? jobDescription : ''}
                  onChange={(e) => setJobDescription(e.target.value)}
                  readOnly={!showJd}
                  rows={8}
                  placeholder={showJd ? 'Paste the job description here (min 50 characters)...' : '● ● ● hidden ● ● ●'}
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 pr-16 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
                {/* Icon row */}
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowJd((s) => !s)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showJd ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  {jobDescription && (
                    <button
                      type="button"
                      onClick={() => setJobDescription('')}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className={`mt-1.5 text-xs ${jobDescription.length < 50 && jobDescription.length > 0 ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                {jobDescription.length} / 10,000 characters
              </p>
            </div>

            {/* Resume selector */}
            {resumes.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Resume <span className="font-normal text-slate-400 dark:text-slate-500">(optional — personalizes questions)</span>
                </label>
                <select
                  value={resumeId}
                  onChange={(e) => setResumeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                >
                  <option value="">No resume</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}{r.version ? ` (v${r.version})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {errorMsg && (
              <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
            )}
          </form>

          {/* Generate button — pinned footer */}
          <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-700 px-6 py-4">
            <button
              type="submit"
              form="interview-form"
              disabled={!isReady || mutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
            >
              <Sparkles className="h-4 w-4" />
              {mutation.isPending ? 'Generating…' : 'Generate Interview Questions'}
            </button>
          </div>
        </div>

        {/* Right: Practice Questions */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-800/50">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4 flex-shrink-0">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Practice Questions</h2>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">AI Powered</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {mutation.isPending ? (
              <LoadingSkeleton />
            ) : result ? (
              <Results questions={result.questions} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center py-16 px-8">
                {/* Icon */}
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Your questions will appear here</p>
                <p className="mt-2 max-w-xs text-sm text-slate-400 dark:text-slate-500 leading-relaxed">
                  Fill in the role, company, and job description on the left, then click{' '}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Generate</span> to start your mock interview.
                </p>
                <FeatureCards />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
