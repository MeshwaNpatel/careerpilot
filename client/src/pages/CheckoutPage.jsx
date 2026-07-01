import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ArrowLeft, Shield, Zap, Star, CreditCard, Lock } from 'lucide-react';
import { subscriptionsApi } from '../api/adminApi.js';

const PLAN_DETAILS = {
  pro: {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'Perfect for active job seekers who want to stand out.',
    color: 'indigo',
    icon: Zap,
    features: [
      'Unlimited applications',
      '10 resume uploads',
      '20 AI reviews/month',
      '20 cover letters/month',
      'Full analytics',
      'Priority support',
    ],
    highlights: ['Cancel anytime', 'Instant access', 'No hidden fees'],
  },
  premium: {
    name: 'Premium',
    price: '$19',
    period: 'per month',
    description: 'Everything you need to land your dream job, unlimited.',
    color: 'violet',
    icon: Star,
    features: [
      'Everything in Pro',
      'Unlimited resumes',
      'Unlimited AI usage',
      'Analytics export',
      '24/7 Dedicated Support',
    ],
    highlights: ['Most popular choice', 'Cancel anytime', 'Priority onboarding'],
  },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan');
  const plan = PLAN_DETAILS[planKey];

  const checkoutMutation = useMutation({
    mutationFn: () => subscriptionsApi.createCheckout(planKey),
    onSuccess: ({ checkoutUrl }) => {
      window.location.href = checkoutUrl;
    },
  });

  if (!plan) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Invalid plan selected.</p>
        <button onClick={() => navigate('/billing')} className="text-sm font-semibold text-indigo-600 hover:underline">
          Back to Billing
        </button>
      </div>
    );
  }

  const PlanIcon = plan.icon;
  const isViolet = plan.color === 'violet';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-5 flex-shrink-0">
        <button
          onClick={() => navigate('/billing')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Billing
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto bg-slate-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Upgrade to {plan.name}</h1>
            <p className="mt-2 text-slate-500">{plan.description}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">

            {/* Left: Plan summary */}
            <div className="lg:col-span-3 space-y-4">
              {/* Plan card */}
              <div className={`rounded-2xl border-2 bg-white p-8 shadow-sm ${isViolet ? 'border-violet-300' : 'border-indigo-300'}`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isViolet ? 'bg-violet-100' : 'bg-indigo-100'}`}>
                    <PlanIcon className={`h-6 w-6 ${isViolet ? 'text-violet-600' : 'text-indigo-600'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{plan.name} Plan</h2>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-sm text-slate-400">{plan.period}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">What's included</p>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${isViolet ? 'bg-violet-100' : 'bg-indigo-100'}`}>
                          <Check className={`h-3 w-3 ${isViolet ? 'text-violet-600' : 'text-indigo-600'}`} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                  {plan.highlights.map((h) => (
                    <span key={h} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 rounded-xl border border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Shield className="h-4 w-4 text-green-500" />
                  SSL Encrypted
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="h-4 w-4 text-green-500" />
                  Secure Payment
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  Powered by Stripe
                </div>
              </div>
            </div>

            {/* Right: Order summary + CTA */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
                <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>

                <div className="space-y-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{plan.name} Plan</span>
                    <span className="font-semibold text-slate-900">{plan.price}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Billing cycle</span>
                    <span className="font-semibold text-slate-900">Monthly</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <span className="font-bold text-slate-900">Total today</span>
                  <span className="text-xl font-bold text-slate-900">{plan.price}</span>
                </div>

                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.99] disabled:opacity-60 ${
                    isViolet
                      ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  {checkoutMutation.isPending ? 'Redirecting to Stripe…' : `Pay ${plan.price} & Upgrade`}
                </button>

                {checkoutMutation.isError && (
                  <p className="mt-3 text-center text-xs text-red-500">
                    {checkoutMutation.error?.response?.data?.error || checkoutMutation.error?.message || 'Unknown error'}
                  </p>
                )}

                <p className="mt-4 text-center text-xs text-slate-400">
                  You'll be redirected to Stripe's secure checkout. Cancel anytime from your billing portal.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
