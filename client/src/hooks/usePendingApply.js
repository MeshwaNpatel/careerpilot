import { useState, useEffect } from 'react';

const KEY = 'cp_pending_apply';

export function setPendingApply(job) {
  localStorage.setItem(KEY, JSON.stringify({
    title:    job.title,
    company:  job.company,
    url:      job.url,
    source:   job.source,
    location: job.location ?? '',
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    salaryCurrency: 'USD',
    savedAt:  Date.now(),
  }));
}

export function clearPendingApply() {
  localStorage.removeItem(KEY);
}

export function usePendingApply() {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    function checkPending() {
      if (document.visibilityState !== 'visible') return;
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return;
        const job = JSON.parse(raw);
        // Only prompt if they were gone for at least 5 seconds
        if (Date.now() - job.savedAt < 5000) return;
        setPending(job);
      } catch {
        clearPendingApply();
      }
    }

    document.addEventListener('visibilitychange', checkPending);
    return () => document.removeEventListener('visibilitychange', checkPending);
  }, []);

  return [pending, setPending];
}
