import { Link } from 'react-router-dom';
import {
  KanbanSquare,
  Sparkles,
  Mail,
  Bell,
  FileText,
  BarChart2,
  Check,
} from 'lucide-react';

const FEATURES = [
  {
    Icon: KanbanSquare,
    title: 'Kanban Pipeline',
    desc: 'Track every application across Applied → Screening → Interview → Offer. Drag cards to update status instantly.',
  },
  {
    Icon: Sparkles,
    title: 'AI Resume Review',
    desc: 'Get an ATS compatibility score, missing keywords, and section-by-section feedback powered by GPT-4o.',
  },
  {
    Icon: Mail,
    title: 'Cover Letter Generator',
    desc: 'Generate a tailored 3-paragraph cover letter in seconds. Copy, refine, and send.',
  },
  {
    Icon: Bell,
    title: 'Follow-up Reminders',
    desc: 'Never ghost a recruiter again. Set a follow-up date on any application and get reminded by email.',
  },
  {
    Icon: FileText,
    title: 'Resume Vault',
    desc: 'Store multiple resume versions. Track which version you submitted for each role.',
  },
  {
    Icon: BarChart2,
    title: 'Job Search Analytics',
    desc: 'Visualize your pipeline funnel, response rate, top job boards, and resume performance.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['25 applications', '2 resume uploads', '3 AI reviews/month', 'Follow-up reminders'],
    cta: 'Get started',
    to: '/signup',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    features: ['Unlimited applications', '10 resume uploads', '20 AI reviews/month', 'Full analytics'],
    cta: 'Start Pro',
    to: '/signup',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '$19',
    period: '/month',
    features: ['Everything in Pro', 'Unlimited resumes', 'Unlimited AI usage', 'Analytics export'],
    cta: 'Start Premium',
    to: '/signup',
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur">
        <span className="text-lg font-bold text-indigo-600">CareerPilot</span>
        <nav className="flex gap-3">
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Log in
          </Link>
          <Link to="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Sign up free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1 text-sm font-medium text-indigo-700">
          AI-powered job search CRM
        </div>
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-slate-900">
          Your AI co-pilot for the job search
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-600">
          Track every application like a CRM, get AI resume feedback, generate tailored cover letters,
          and never miss a follow-up again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/signup" className="rounded-lg bg-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
            Get started free
          </Link>
          <Link to="/login" className="rounded-lg border border-slate-300 px-7 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Log in
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">No credit card required · Free plan forever</p>
      </section>

      {/* Features */}
      <section className="bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">
            Everything you need to run your job search
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-slate-900">Simple pricing</h2>
          <p className="mb-10 text-center text-slate-500">Start free, upgrade when you need more.</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-xl border p-6 shadow-sm ${
                  plan.highlight ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500"> {plan.period}</span>
                </p>
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <Check className="h-4 w-4 flex-shrink-0 text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.to}
                  className={`rounded-lg py-2 text-center text-sm font-semibold transition ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} CareerPilot · Built with React, Node.js, OpenAI &amp; Stripe
      </footer>
    </div>
  );
}
