import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/common/Button.jsx';

const FEATURE_LABELS = {
  resume_review: 'Resume Review',
  cover_letter: 'Cover Letter',
  interview_questions: 'Interview Prep',
};

const FEATURE_COLORS = {
  resume_review: '#4f46e5',
  cover_letter: '#06b6d4',
  interview_questions: '#10b981',
};

const FEATURE_BADGE = {
  resume_review: 'bg-indigo-50 text-indigo-700',
  cover_letter: 'bg-cyan-50 text-cyan-700',
  interview_questions: 'bg-emerald-50 text-emerald-700',
};

export default function AdminAIUsage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-usage', page],
    queryFn: () => adminApi.getAiUsage({ page, limit: 50 }),
    keepPreviousData: true,
  });

  // Build feature breakdown from the first-page items (all time)
  const featureBreakdown = useMemo(() => {
    if (!data?.items) return [];
    const counts = {};
    for (const req of data.items) {
      counts[req.feature] = (counts[req.feature] ?? 0) + 1;
    }
    return Object.entries(counts).map(([feature, count]) => ({
      feature,
      name: FEATURE_LABELS[feature] ?? feature,
      count,
    }));
  }, [data?.items]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">AI Usage & Cost</h1>
        <p className="text-sm text-slate-400 mt-0.5">Groq API — llama-3.3-70b-versatile</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-5">

        {/* Summary cards */}
        {data?.thisMonth && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Calls this month</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{data.thisMonth.calls.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Tokens this month</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{(data.thisMonth.tokensUsed ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Cost this month</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">${data.thisMonth.costUsd}</p>
              <p className="text-xs text-slate-400 mt-0.5">Groq free tier — $0</p>
            </div>
          </div>
        )}

        {/* Feature breakdown chart */}
        {featureBreakdown.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 font-semibold text-slate-900">Feature Breakdown (current page)</h2>
            <p className="mb-4 text-xs text-slate-400">Calls per AI feature in this result set</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={featureBreakdown} layout="vertical" barCategoryGap="30%">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={110} />
                <Tooltip formatter={(v) => [`${v} calls`]} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {featureBreakdown.map((entry) => (
                    <Cell key={entry.feature} fill={FEATURE_COLORS[entry.feature] ?? '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Request log */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading…</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['User', 'Feature', 'Tokens', 'Cost', 'Date'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.items?.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{req.user?.name ?? '—'}</p>
                        <p className="text-xs text-slate-500">{req.user?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${FEATURE_BADGE[req.feature] ?? 'bg-slate-100 text-slate-600'}`}>
                          {FEATURE_LABELS[req.feature] ?? req.feature}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {req.tokensUsed?.toLocaleString() ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {req.costUsd ? `$${Number(req.costUsd).toFixed(4)}` : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {data?.items?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                        No AI requests yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  {data.pagination.total} total · page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                    ← Prev
                  </Button>
                  <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page === data.pagination.totalPages}>
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
