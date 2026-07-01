import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { subscriptionsApi } from '../api/adminApi.js';
import Button from '../components/common/Button.jsx';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '/ forever',
    features: ['25 applications', '2 resume uploads', '3 AI reviews/month', '3 cover letters/month', 'Follow-up reminders'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$9',
    period: '/ month',
    features: ['Unlimited applications', '10 resume uploads', '20 AI reviews/month', '20 cover letters/month', 'Full analytics', 'Priority support'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$19',
    period: '/ month',
    features: ['Everything in Pro', 'Unlimited resumes', 'Unlimited AI usage', 'Analytics export', '24/7 Dedicated Support'],
    highlight: true,
  },
];

const STATUS_LABELS = {
  active:    { label: 'Active',    color: 'text-green-700 bg-green-50 border border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800' },
  past_due:  { label: 'Past Due',  color: 'text-red-700 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800'           },
  cancelled: { label: 'Cancelled', color: 'text-slate-500 bg-slate-100 border border-slate-200 dark:text-slate-400 dark:bg-slate-700 dark:border-slate-600'  },
};

export default function BillingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success   = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionsApi.getMy,
  });

  const portalMutation = useMutation({
    mutationFn: subscriptionsApi.createPortal,
    onSuccess: ({ portalUrl }) => { window.location.href = portalUrl; },
  });

  const currentPlan     = sub?.plan ?? 'free';
  const status          = sub?.status ?? 'active';
  const statusInfo      = STATUS_LABELS[status] ?? STATUS_LABELS.active;
  const hasStripeCustomer = !!sub?.stripeCustomerId;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Billing</h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage your subscription and upgrade your career capabilities with AI.</p>
      </div>

      <div className="flex-1 overflow-auto p-8 bg-slate-50 dark:bg-slate-800/30">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* Alerts */}
          {success && (
            <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-800 dark:text-green-300">
              Your subscription has been activated. Welcome to {currentPlan === 'pro' ? 'Pro' : 'Premium'}!
            </div>
          )}
          {cancelled && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
              Checkout was cancelled. Your current plan is unchanged.
            </div>
          )}

          {/* Current plan summary */}
          {!isLoading && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Current Plan</p>
                  <p className="mt-1 text-2xl font-bold capitalize text-slate-900 dark:text-slate-100">{currentPlan}</p>
                  {sub?.currentPeriodEnd && (
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  {currentPlan !== 'free' && hasStripeCustomer && (
                    <Button
                      variant="secondary"
                      isLoading={portalMutation.isPending}
                      onClick={() => portalMutation.mutate()}
                    >
                      Manage billing
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plan cards */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
                  <div className="h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700 mb-2" />
                  <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700 mb-5" />
                  <div className="space-y-2.5 mb-6">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                    ))}
                  </div>
                  <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === currentPlan;
              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-xl border p-6 shadow-sm transition-shadow ${
                    plan.highlight
                      ? 'border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 shadow-indigo-100 dark:shadow-none'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  {/* Most Popular badge */}
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-indigo-600 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan name + price */}
                  <div className="mb-5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{plan.price}</span>
                      <span className="text-sm text-slate-400 dark:text-slate-500">{plan.period}</span>
                    </p>
                  </div>

                  {/* Feature list */}
                  <ul className="mb-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                          <Check className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  {isCurrent ? (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2.5 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                      Current plan
                    </div>
                  ) : plan.key === 'free' ? (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 py-2.5 text-center text-sm text-slate-400 dark:text-slate-500">
                      Downgrade via billing portal
                    </div>
                  ) : plan.highlight ? (
                    <button
                      onClick={() => navigate(`/billing/checkout?plan=${plan.key}`)}
                      className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Upgrade to {plan.name}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/billing/checkout?plan=${plan.key}`)}
                      className="w-full rounded-lg border border-indigo-300 dark:border-indigo-700 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      Upgrade to {plan.name}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Enterprise link */}
          {!isLoading && (
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Have a larger team or specific enterprise needs?{' '}
              <a href="mailto:hello@careerpilot.ai" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Contact our sales team
              </a>
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
