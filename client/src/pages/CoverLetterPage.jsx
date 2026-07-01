import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { Copy, Check, Download, Sparkles, Wand2, Lightbulb, ChevronRight, Mail, BookmarkCheck, X, Search } from 'lucide-react';
import { resumesApi } from '../api/resumesApi.js';
import { aiApi } from '../api/aiApi.js';
import { applicationsApi } from '../api/applicationsApi.js';
import { useAuth } from '../hooks/useAuth.js';
import { toast } from 'sonner';

const ADJUSTMENTS = [
  'Make it more confident',
  'Focus on technical skills',
  'Shorten to 3 paragraphs',
  'Make it more concise',
];

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ── Formatted letter preview ──────────────────────────────────────────────────

function LetterPreview({ letter, companyName, roleTitle, userName, userEmail }) {
  const paragraphs = letter
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div id="cover-letter-print" className="p-8 font-serif text-sm leading-relaxed text-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-base font-bold text-slate-900">{userName}</p>
          <p className="text-slate-500 mt-0.5">{userEmail}</p>
        </div>
        <p className="text-slate-400 text-xs">{formatDate(new Date())}</p>
      </div>

      {/* Addressee */}
      <div className="mb-6 text-slate-700">
        <p>Hiring Manager</p>
        {companyName && <p>{companyName}</p>}
      </div>

      {/* Salutation */}
      <p className="mb-4 font-medium">Dear Hiring Manager,</p>

      {/* Body */}
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* Sign-off */}
      {!letter.toLowerCase().includes('sincerely') &&
       !letter.toLowerCase().includes('regards') && (
        <div className="mt-6">
          <p>Sincerely,</p>
          <p className="mt-3 font-semibold">{userName}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

// ── Save-to-application modal ─────────────────────────────────────────────────

function SaveToAppModal({ letter, defaultCompany, onClose }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(defaultCompany ?? '');
  const [savedId, setSavedId] = useState(null);

  const { data } = useQuery({
    queryKey: ['applications', 'all-for-cl'],
    queryFn: () => applicationsApi.list({ limit: 200 }),
  });

  const saveMutation = useMutation({
    mutationFn: (appId) => applicationsApi.update(appId, { coverLetterText: letter }),
    onSuccess: (_, appId) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setSavedId(appId);
      toast.success('Cover letter saved to application');
      setTimeout(onClose, 1500);
    },
    onError: () => toast.error('Failed to save — please try again'),
  });

  const apps = (data?.items ?? []).filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return a.company.toLowerCase().includes(q) || a.roleTitle.toLowerCase().includes(q);
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 top-1/4 z-50 mx-auto w-full max-w-md px-4">
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500 mb-0.5">Save Cover Letter</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Pick an application</p>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company or role…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
              />
            </div>
          </div>

          {/* Application list */}
          <div className="max-h-64 overflow-y-auto px-3 pb-4">
            {apps.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No applications found</p>
            ) : (
              <div className="space-y-1 mt-1">
                {apps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => saveMutation.mutate(app.id)}
                    disabled={saveMutation.isPending}
                    className={`w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition ${
                      savedId === app.id
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent'
                    } disabled:opacity-50`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{app.company}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{app.roleTitle}</p>
                    </div>
                    {savedId === app.id
                      ? <BookmarkCheck className="h-4 w-4 flex-shrink-0 text-green-500" />
                      : <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex-shrink-0">Save</span>
                    }
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoverLetterPage() {
  const { state } = useLocation();
  const { user } = useAuth();
  const prefill = state?.prefill ?? null;

  const [form, setForm] = useState({
    companyName: prefill?.company ?? '',
    roleTitle: prefill?.role ?? '',
    whyInterested: '',
    resumeId: '',
  });

  const [copied, setCopied] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumesApi.list,
  });

  const generateMutation = useMutation({
    mutationFn: ({ adjustment } = {}) =>
      aiApi.generateCoverLetter({
        companyName: form.companyName,
        roleTitle: form.roleTitle,
        whyInterested: adjustment
          ? `${form.whyInterested}\n\nPlease adjust the letter: ${adjustment}`
          : form.whyInterested,
        ...(form.resumeId && { resumeId: form.resumeId }),
      }),
    onSuccess: () => setShowAdjustments(false),
  });

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generateMutation.data?.letter ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPdf() {
    const el = document.getElementById('cover-letter-print');
    if (!el) return;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:816px;height:1056px;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"><title>Cover Letter</title>
      <style>
        @page { margin: 0; size: 8.5in 11in portrait; }
        html, body { margin: 0; padding: 0; font-family: Georgia, serif; font-size: 14px; }
        a { color: #1155CC; }
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.contains(iframe) && document.body.removeChild(iframe), 2000);
    }, 300);
  }

  function handleSubmit(e) {
    e.preventDefault();
    generateMutation.mutate({});
  }

  const isValid = form.companyName.trim() && form.roleTitle.trim() && form.whyInterested.trim().length >= 10;
  const letter = generateMutation.data?.letter ?? '';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cover Letter Generator</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Generate a tailored, professional cover letter in seconds</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">AI Power Active</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex gap-0">

        {/* ── Left: Generator Inputs ── */}
        <div className="w-[420px] flex-shrink-0 overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="p-6">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Generator Inputs</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 mb-5">Provide context to create a tailored, professional letter.</p>

            {prefill && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-3 py-2.5">
                <Mail className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
                <p className="text-xs text-green-800 dark:text-green-300">
                  Pre-filled for <strong>{prefill.role}</strong> at <strong>{prefill.company}</strong>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Google, Stripe, Tesla"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
              </div>

              {/* Role Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Role Title</label>
                <input
                  name="roleTitle"
                  value={form.roleTitle}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Senior Product Designer"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
              </div>

              {/* Resume */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Base Resume <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    name="resumeId"
                    value={form.resumeId}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 pr-9 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                  >
                    <option value="">— none —</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}{r.version ? ` (${r.version})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                </div>
              </div>

              {/* Why interested */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Why are you interested?{' '}
                  <span className="font-normal text-slate-400 dark:text-slate-500">(AI Prompt)</span>
                </label>
                <textarea
                  name="whyInterested"
                  value={form.whyInterested}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Describe your specific motivations, relevant past wins, or how you align with the company's mission…"
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
              </div>

              {/* Pro Tip */}
              <div className="flex items-start gap-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-4 py-3">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 flex items-center justify-center rounded-full bg-indigo-600">
                  <Lightbulb className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300">Pro Tip</p>
                  <p className="mt-0.5 text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
                    Mentioning specific recent company achievements or news will increase your AI-matching score by up to 35%.
                  </p>
                </div>
              </div>

              {/* Generate button */}
              <button
                type="submit"
                disabled={!isValid || generateMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
              >
                <Wand2 className="h-4 w-4" />
                {generateMutation.isPending ? 'Generating…' : 'Generate Cover Letter'}
              </button>

              {generateMutation.isError && (
                <p className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-center text-sm text-red-600 dark:text-red-400">
                  {generateMutation.error?.response?.data?.error ?? 'Something went wrong'}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* ── Right: Live Preview ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-800/50">
          {/* Preview toolbar */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!letter}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                {copied ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                disabled={!letter}
                className="flex items-center gap-1.5 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-40 transition-colors"
              >
                <BookmarkCheck className="h-3.5 w-3.5" /> Save to App
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={!letter}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download PDF
              </button>
            </div>
          </div>

          {/* Letter sheet */}
          <div className="flex-1 overflow-auto p-6 flex justify-center">
            <div className="w-full max-w-2xl">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white shadow-sm min-h-[600px] relative">
                {/* Empty state */}
                {!letter && !generateMutation.isPending && (
                  <div className="flex h-full min-h-[500px] flex-col items-center justify-center text-center p-8">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
                      <Wand2 className="h-8 w-8 text-indigo-400" />
                    </div>
                    <p className="font-semibold text-slate-600 dark:text-slate-300">Your letter will appear here</p>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Fill in the form and click Generate Cover Letter</p>
                  </div>
                )}

                {/* Loading skeleton */}
                {generateMutation.isPending && (
                  <div className="p-8 space-y-4">
                    {[100, 60, 100, 100, 75, 100, 100, 80].map((w, i) => (
                      <div key={i} className="h-3 animate-pulse rounded-full bg-slate-100 dark:bg-slate-700" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}

                {/* Letter content — always rendered on white (paper) */}
                {letter && (
                  <>
                    <LetterPreview
                      letter={letter}
                      companyName={form.companyName}
                      roleTitle={form.roleTitle}
                      userName={user?.name ?? 'Your Name'}
                      userEmail={user?.email ?? ''}
                    />

                    {/* AI Adjustments */}
                    <div className="absolute bottom-4 right-4">
                      {showAdjustments && (
                        <div className="absolute bottom-full right-0 mb-2 w-52 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
                          <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">AI Adjustments</p>
                          </div>
                          {ADJUSTMENTS.map((adj) => (
                            <button
                              key={adj}
                              onClick={() => generateMutation.mutate({ adjustment: adj })}
                              disabled={generateMutation.isPending}
                              className="flex w-full items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors disabled:opacity-50"
                            >
                              {adj}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => setShowAdjustments((s) => !s)}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        AI ADJUSTMENTS
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save-to-application modal */}
      {showSaveModal && (
        <SaveToAppModal
          letter={letter}
          defaultCompany={form.companyName}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
