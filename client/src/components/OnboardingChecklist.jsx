import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, X,
  Briefcase, FileText, Sparkles, Mail, Search, PartyPopper,
} from 'lucide-react';
import { applicationsApi } from '../api/applicationsApi.js';
import { resumesApi } from '../api/resumesApi.js';

const STORAGE_KEY = 'cp_onboarding_v1';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveState(patch) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...loadState(), ...patch }));
}

const STEPS = [
  {
    id: 'add_application',
    icon: Briefcase,
    iconBg: 'bg-indigo-100 text-indigo-600',
    title: 'Add your first application',
    desc: 'Track a job you applied to or plan to apply to.',
    cta: 'Go to Applications',
    to: '/applications',
  },
  {
    id: 'upload_resume',
    icon: FileText,
    iconBg: 'bg-violet-100 text-violet-600',
    title: 'Upload a resume',
    desc: 'Store your resume so AI can review it against job descriptions.',
    cta: 'Open Resume Vault',
    to: '/resumes',
  },
  {
    id: 'ai_review',
    icon: Sparkles,
    iconBg: 'bg-amber-100 text-amber-600',
    title: 'Try AI Resume Review',
    desc: 'Get an ATS score and improvement suggestions in seconds.',
    cta: 'Try AI Review',
    to: '/ai/review',
  },
  {
    id: 'cover_letter',
    icon: Mail,
    iconBg: 'bg-cyan-100 text-cyan-600',
    title: 'Generate a cover letter',
    desc: 'AI writes a tailored cover letter for any role in one click.',
    cta: 'Generate Cover Letter',
    to: '/ai/cover-letter',
  },
  {
    id: 'browse_jobs',
    icon: Search,
    iconBg: 'bg-emerald-100 text-emerald-600',
    title: 'Browse live job listings',
    desc: 'Search jobs from Adzuna, Remotive, and YC — all in one place.',
    cta: 'Browse Jobs',
    to: '/jobs',
  },
];

export default function OnboardingChecklist() {
  const [stored, setStored] = useState(loadState);
  const [celebrated, setCelebrated] = useState(false);

  const { data: applications } = useQuery({
    queryKey: ['applications', 'onboarding-check'],
    queryFn: () => applicationsApi.list({ page: 1, limit: 1 }),
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumesApi.list,
  });

  // Compute which steps are done
  const done = {
    add_application: (applications?.pagination?.total ?? applications?.items?.length ?? 0) > 0,
    upload_resume: (resumes?.length ?? 0) > 0,
    ai_review: !!stored.ai_review,
    cover_letter: !!stored.cover_letter,
    browse_jobs: !!stored.browse_jobs,
  };

  const completedCount = Object.values(done).filter(Boolean).length;

  // Auto-collapse once the user has any progress; new users (0 done) see it open
  const [collapsed, setCollapsed] = useState(() => {
    const s = loadState();
    return !!s.collapsed;
  });

  // Persist collapse state and auto-collapse when first step is done
  useEffect(() => {
    if (completedCount > 0 && !loadState().collapsedSetByUser) {
      setCollapsed(true);
      saveState({ collapsed: true });
    }
  }, [completedCount]);
  const allDone = completedCount === STEPS.length;

  // Celebrate once when all steps complete
  useEffect(() => {
    if (allDone && !celebrated && !stored.dismissed) {
      setCelebrated(true);
      const t = setTimeout(() => {
        saveState({ dismissed: true });
        setStored(loadState());
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [allDone, celebrated, stored.dismissed]);

  // Don't render if dismissed
  if (stored.dismissed) return null;

  const pct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {allDone ? (
            <PartyPopper className="h-5 w-5 text-indigo-600" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {completedCount}/{STEPS.length}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-900">
              {allDone ? 'You\'re all set! 🎉' : 'Getting started'}
            </p>
            <p className="text-xs text-slate-500">
              {allDone
                ? 'CareerPilot is ready to help you land your next role.'
                : `${STEPS.length - completedCount} step${STEPS.length - completedCount !== 1 ? 's' : ''} left`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              saveState({ collapsed: next, collapsedSetByUser: true });
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-100 hover:text-slate-600 transition"
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { saveState({ dismissed: true }); setStored(loadState()); }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-indigo-100">
        <div
          className="h-1 bg-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="divide-y divide-indigo-50">
          {STEPS.map((step) => {
            const isDone = done[step.id];
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                  isDone ? 'opacity-60' : 'hover:bg-indigo-50/60'
                }`}
              >
                {/* Step icon */}
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${step.iconBg} ${isDone ? 'opacity-70' : ''}`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold leading-tight ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {step.title}
                  </p>
                  {!isDone && (
                    <p className="mt-0.5 text-xs text-slate-500 leading-snug">{step.desc}</p>
                  )}
                </div>

                {/* CTA or checkmark */}
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-indigo-500" />
                ) : (
                  <Link
                    to={step.to}
                    onClick={() => {
                      // Mark localStorage-tracked steps when navigating to them
                      if (['ai_review', 'cover_letter', 'browse_jobs'].includes(step.id)) {
                        saveState({ [step.id]: true });
                        setStored(loadState());
                      }
                    }}
                    className="flex-shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm border border-indigo-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                  >
                    {step.cta}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
