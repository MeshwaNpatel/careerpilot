import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Users, TrendingUp, Cpu, FileText, Briefcase, DollarSign, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';

const PLAN_COLORS = { free: '#94a3b8', pro: '#818cf8', premium: '#4f46e5' };
const FEATURE_COLORS = { resume_review: '#4f46e5', cover_letter: '#06b6d4', interview_questions: '#10b981' };
const FEATURE_LABELS = { resume_review: 'Resume Review', cover_letter: 'Cover Letter', interview_questions: 'Interview Prep' };

function StatCard({ label, value, sub, Icon, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    slate:  'bg-slate-100 text-slate-500',
    cyan:   'bg-cyan-50 text-cyan-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-indigo-600">{payload[0].value} signups</p>
    </div>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: adminApi.getAnalytics,
    refetchInterval: 5 * 60 * 1000,
  });

  async function handleRefresh() {
    const fresh = await adminApi.getAnalytics({ refresh: true });
    queryClient.setQueryData(['admin', 'analytics'], fresh);
  }

  if (isLoading) return <div className="py-32 text-center text-slate-400">Loading…</div>;
  if (isError) return <div className="py-32 text-center text-red-500">Failed to load analytics.</div>;

  const totalPlanUsers = Object.values(data.planDistribution).reduce((a, b) => a + b, 0) || 1;

  const planPieData = Object.entries(data.planDistribution)
    .filter(([, count]) => count > 0)
    .map(([plan, count]) => ({ name: plan.charAt(0).toUpperCase() + plan.slice(1), value: count, plan }));

  const featurePieData = Object.entries(data.aiThisMonth.featureBreakdown ?? {})
    .map(([feature, count]) => ({
      name: FEATURE_LABELS[feature] ?? feature,
      value: count,
      feature,
    }));

  const signupChartData = (data.signupTrend ?? []).map((row) => ({
    date: new Date(row.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    count: row.count,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Overview</h1>
          <p className="text-sm text-slate-400 mt-0.5">Live metrics — cached up to 1 hour</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Row 1 — 6 stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Total users"
            value={data.totalUsers.toLocaleString()}
            sub={`+${data.newLast7Days} this week`}
            Icon={Users}
            color="indigo"
          />
          <StatCard
            label="Monthly active"
            value={data.monthlyActiveUsers.toLocaleString()}
            sub="active last 30 days"
            Icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Est. MRR"
            value={`$${data.estimatedMrr?.toLocaleString() ?? 0}`}
            sub="Pro × $9 + Premium × $19"
            Icon={DollarSign}
            color="amber"
          />
          <StatCard
            label="Applications"
            value={(data.totalApplications ?? 0).toLocaleString()}
            sub="across all users"
            Icon={Briefcase}
            color="purple"
          />
          <StatCard
            label="Resumes"
            value={(data.totalResumes ?? 0).toLocaleString()}
            sub="uploaded total"
            Icon={FileText}
            color="cyan"
          />
          <StatCard
            label="AI calls / mo"
            value={data.aiThisMonth.calls.toLocaleString()}
            sub={`$${data.aiThisMonth.costUsd} cost`}
            Icon={Cpu}
            color="slate"
          />
        </div>

        {/* Row 2 — Signup trend chart + Plan distribution */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Signup trend — Recharts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 font-semibold text-slate-900">Signups — Last 30 Days</h2>
            <p className="mb-4 text-xs text-slate-400">{data.newLast30Days} total new users</p>
            {signupChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={signupChartData} barCategoryGap="30%">
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor(signupChartData.length / 6)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={24}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-44 items-center justify-center text-sm text-slate-400">No signups in last 30 days</div>
            )}
          </div>

          {/* Plan distribution */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 font-semibold text-slate-900">Plan Distribution</h2>
            <p className="mb-4 text-xs text-slate-400">{totalPlanUsers} total subscribers</p>
            <div className="flex items-center gap-6">
              <PieChart width={160} height={160}>
                <Pie
                  data={planPieData}
                  cx={75}
                  cy={75}
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {planPieData.map((entry) => (
                    <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} users`, n]} />
              </PieChart>
              <div className="flex-1 space-y-3">
                {Object.entries(data.planDistribution).map(([plan, count]) => {
                  const pct = Math.round((count / totalPlanUsers) * 100);
                  return (
                    <div key={plan}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium capitalize text-slate-700">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ background: PLAN_COLORS[plan] ?? '#cbd5e1' }} />
                          {plan}
                        </span>
                        <span className="text-slate-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${pct}%`, background: PLAN_COLORS[plan] ?? '#cbd5e1' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3 — AI feature breakdown */}
        {featurePieData.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 font-semibold text-slate-900">AI Feature Usage — This Month</h2>
            <p className="mb-4 text-xs text-slate-400">{data.aiThisMonth.calls} total AI calls</p>
            <div className="flex items-center gap-8">
              <PieChart width={160} height={160}>
                <Pie
                  data={featurePieData}
                  cx={75}
                  cy={75}
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {featurePieData.map((entry) => (
                    <Cell key={entry.feature} fill={FEATURE_COLORS[entry.feature] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} calls`, n]} />
              </PieChart>
              <div className="flex flex-wrap gap-4">
                {featurePieData.map((entry) => (
                  <div key={entry.feature} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                      style={{ background: FEATURE_COLORS[entry.feature] ?? '#94a3b8' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{entry.name}</p>
                      <p className="text-xs text-slate-400">{entry.value} calls</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {featurePieData.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            No AI calls recorded this month yet.
          </div>
        )}

      </div>
    </div>
  );
}
