import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts';
import { BarChart2, ClipboardList, Activity, MessageSquare, TrendingUp } from 'lucide-react';
import { analyticsApi } from '../api/analyticsApi.js';
import { applicationsApi } from '../api/applicationsApi.js';

const STATUS_COLORS = {
  applied: '#6366f1',
  screening: '#f59e0b',
  interview: '#8b5cf6',
  offer: '#10b981',
  rejected: '#ef4444',
};

const STATUS_LABELS = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

function StatCard({ label, value, sub, subColor, Icon, iconBg, valueColor = 'text-slate-900 dark:text-slate-100', progress, barColor = 'bg-indigo-500' }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs font-semibold ${subColor ?? 'text-slate-400 dark:text-slate-500'}`}>{sub}</p>}
      <div className="mt-3 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, progress ?? 0)}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', 'user'],
    queryFn: analyticsApi.getUserAnalytics,
  });

  const { data: appsData } = useQuery({
    queryKey: ['applications', 'all-for-salary'],
    queryFn: () => applicationsApi.list({ limit: 200 }),
  });

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Analytics</h1>
        </div>
        <div className="flex flex-1 items-center justify-center text-slate-400">Loading…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Analytics</h1>
        </div>
        <div className="flex flex-1 items-center justify-center text-red-500">Failed to load analytics.</div>
      </div>
    );
  }

  const funnelData = Object.entries(data.byStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    count,
    status,
  }));

  const weeklyData = data.applicationsByWeek.map((w) => ({
    name: w.week,
    Applications: w.count,
  }));

  const sourcesData = data.topSources.map((s) => ({
    name: s.source,
    count: s.count,
  }));

  const isEmpty = data.totalApplications === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Analytics</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <BarChart2 className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-700">No data yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first job application to start seeing analytics.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Key stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total Applications"
                value={data.totalApplications}
                Icon={ClipboardList}
                iconBg="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                progress={Math.min(100, data.totalApplications * 5)}
                barColor="bg-indigo-500"
              />
              <StatCard
                label="In Progress"
                value={data.inProgress}
                sub="screening + interview"
                subColor="text-amber-500"
                Icon={Activity}
                iconBg="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                valueColor="text-amber-600 dark:text-amber-400"
                progress={data.totalApplications ? Math.round((data.inProgress / data.totalApplications) * 100) : 0}
                barColor="bg-amber-400"
              />
              <StatCard
                label="Interviews"
                value={data.interviews}
                sub={data.totalApplications ? `${Math.round((data.interviews / data.totalApplications) * 100)}% of total` : '—'}
                subColor="text-purple-500"
                Icon={MessageSquare}
                iconBg="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                valueColor="text-purple-600 dark:text-purple-400"
                progress={data.totalApplications ? Math.round((data.interviews / data.totalApplications) * 100) : 0}
                barColor="bg-purple-500"
              />
              <StatCard
                label="Response Rate"
                value={`${data.responseRate}%`}
                sub={data.responseRate >= 30 ? 'Above average 🚀' : 'Keep applying!'}
                subColor={data.responseRate >= 30 ? 'text-green-500' : 'text-slate-400'}
                Icon={TrendingUp}
                iconBg={data.responseRate >= 30 ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}
                valueColor={data.responseRate >= 30 ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-slate-100'}
                progress={data.responseRate}
                barColor={data.responseRate >= 30 ? 'bg-green-500' : 'bg-slate-400'}
              />
            </div>

            {/* Pipeline funnel */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Pipeline Funnel</h2>
              {funnelData.every((d) => d.count === 0) ? (
                <p className="py-8 text-center text-sm text-slate-400">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={funnelData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 13 }}
                    />
                    <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]}>
                      {funnelData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Applications over time */}
            {weeklyData.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Applications per Week (Last 12 Weeks)</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 13 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Applications"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#6366f1' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Top sources */}
              {sourcesData.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                  <h2 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Top Sources</h2>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      layout="vertical"
                      data={sourcesData}
                      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 13 }}
                      />
                      <Bar dataKey="count" name="Applications" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Resume performance */}
              {data.resumePerformance.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                  <h2 className="mb-4 font-semibold text-slate-900 dark:text-slate-100">Resume Performance</h2>
                  <div className="space-y-3">
                    {data.resumePerformance.map((r) => (
                      <div key={r.resumeId} className="flex items-center justify-between gap-4">
                        <p className="truncate text-sm text-slate-700 dark:text-slate-300" title={r.label}>{r.label}</p>
                        <div className="flex shrink-0 gap-4 text-xs text-slate-500">
                          <span>{r.applications} apps</span>
                          <span className="font-medium text-purple-600">{r.interviews} interviews</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Salary range chart */}
            {(() => {
              const apps = (appsData?.items ?? []).filter((a) => a.salaryMin || a.salaryMax);
              if (apps.length === 0) return null;
              const salaryData = apps
                .slice(0, 15)
                .map((a) => ({
                  name: `${a.roleTitle} @ ${a.company}`,
                  min: a.salaryMin ?? a.salaryMax,
                  max: a.salaryMax ?? a.salaryMin,
                  currency: a.salaryCurrency ?? 'USD',
                }))
                .sort((a, b) => b.max - a.max);
              return (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                  <h2 className="mb-1 font-semibold text-slate-900 dark:text-slate-100">Salary Ranges</h2>
                  <p className="mb-4 text-xs text-slate-400">{apps.length} applications with salary data</p>
                  <div className="space-y-3">
                    {salaryData.map((row) => {
                      const maxAll = salaryData[0].max || 1;
                      const minPct = Math.round((row.min / maxAll) * 100);
                      const maxPct = Math.round((row.max / maxAll) * 100);
                      return (
                        <div key={row.name}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="truncate max-w-[60%] font-medium text-slate-700 dark:text-slate-300">{row.name}</span>
                            <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-semibold">
                              {row.currency} {row.min.toLocaleString()}
                              {row.max !== row.min ? ` – ${row.max.toLocaleString()}` : ''}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                            <div
                              className="h-2 rounded-full bg-emerald-400 dark:bg-emerald-500"
                              style={{ marginLeft: `${minPct}%`, width: `${maxPct - minPct}%`, minWidth: '4px' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
