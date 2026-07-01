import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, X, Building2, MapPin, Banknote, ExternalLink } from 'lucide-react';
import { applicationsApi } from '../api/applicationsApi.js';
import { clearPendingApply } from '../hooks/usePendingApply.js';
import { localDateString } from '../utils/date.js';
import { toast } from 'sonner';

function fmt(n) {
  if (!n) return null;
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n.toLocaleString()}`;
}

function salary(min, max) {
  const a = fmt(min), b = fmt(max);
  if (a && b && a !== b) return `${a} – ${b}`;
  return a || b || null;
}

const SOURCE_LABEL = {
  adzuna:      'Adzuna',
  remotive:    'Remotive',
  ycombinator: 'Y Combinator',
};

export default function PendingApplyModal({ job, onClose }) {
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => applicationsApi.create({
      company:   job.company,
      roleTitle: job.title,
      jobUrl:    job.url,
      source:    SOURCE_LABEL[job.source] ?? job.source ?? '',
      status:    'applied',
      appliedAt: localDateString(),
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      salaryCurrency: job.salaryCurrency ?? 'USD',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setDone(true);
      clearPendingApply();
      setTimeout(onClose, 1800);
    },
    onError: () => {
      toast.error('Could not save application — try adding it manually.');
      clearPendingApply();
      onClose();
    },
  });

  function handleNo() {
    clearPendingApply();
    onClose();
  }

  const sal = salary(job.salaryMin, job.salaryMax);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleNo} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-6 z-50 mx-auto w-full max-w-md px-4">
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">

          {done ? (
            /* Success state */
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">Application saved!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {job.title} at {job.company} is now in your pipeline.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-700 px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-1">
                    Did you apply?
                  </p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {job.title}
                  </h3>
                </div>
                <button
                  onClick={handleNo}
                  className="flex-shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Job details */}
              <div className="px-5 py-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span className="font-medium">{job.company}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    {job.location}
                  </div>
                )}
                {sal && (
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <Banknote className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    {sal}
                  </div>
                )}
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> View listing
                </a>
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 px-5 py-4">
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm shadow-indigo-200 dark:shadow-none"
                >
                  {createMutation.isPending ? 'Saving…' : '✓ Yes, I applied!'}
                </button>
                <button
                  onClick={handleNo}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  Not yet
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
