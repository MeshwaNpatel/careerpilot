import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { applicationsApi } from '../api/applicationsApi.js';
import { interviewsApi } from '../api/interviewsApi.js';
import { contactsApi } from '../api/contactsApi.js';
import { resumesApi } from '../api/resumesApi.js';
import { FileText, PlusCircle, UserPlus, Calendar, Flag, CheckCircle2, XCircle, Clock, ExternalLink, StickyNote, Trash2, Pencil, Link2, Link2Off, ChevronDown, Sparkles, Upload, Copy, Check, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { parseDate, formatDate, toDateInput } from '../utils/date.js';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import Modal from '../components/common/Modal.jsx';

const STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected'];

const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-800',
  screening: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const FORMAT_LABELS = {
  phone: 'Phone',
  video: 'Video',
  onsite: 'On-site',
  take_home: 'Take-home',
};

const OUTCOME_COLORS = {
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-slate-100 text-slate-600',
};

const editSchema = z.object({
  company:        z.string().trim().min(1, 'Required').max(255),
  roleTitle:      z.string().trim().min(1, 'Required').max(255),
  status:         z.enum(STATUSES),
  appliedAt:      z.string().min(1, 'Required'),
  jobUrl:         z.string().trim().max(500).optional().or(z.literal('')),
  source:         z.string().trim().max(100).optional().or(z.literal('')),
  notes:          z.string().optional().or(z.literal('')),
  salaryMin:      z.coerce.number().int().nonnegative().optional().or(z.literal('')),
  salaryMax:      z.coerce.number().int().nonnegative().optional().or(z.literal('')),
  salaryCurrency: z.string().length(3).default('USD'),
});

const interviewSchema = z.object({
  roundName: z.string().trim().max(100).optional().or(z.literal('')),
  format: z.enum(['video', 'phone', 'onsite', 'take_home']).optional().or(z.literal('')),
  scheduledAt: z.string().optional().or(z.literal('')),
  durationMinutes: z.coerce.number().int().positive().optional().or(z.literal('')),
  interviewerName: z.string().trim().max(255).optional().or(z.literal('')),
  outcome: z.enum(['passed', 'failed', 'pending', 'cancelled']).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  roleTitle: z.string().trim().max(255).optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});


function toDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toISOString().slice(0, 16);
}

function DetailField({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function InterviewModal({ appId, interview, onClose, queryKey }) {
  const queryClient = useQueryClient();
  const isEdit = !!interview;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      roundName: interview?.roundName ?? '',
      format: interview?.format ?? '',
      scheduledAt: interview?.scheduledAt ? toDatetimeLocal(interview.scheduledAt) : '',
      durationMinutes: interview?.durationMinutes ?? '',
      interviewerName: interview?.interviewerName ?? '',
      outcome: interview?.outcome ?? 'pending',
      notes: interview?.notes ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (raw) => {
      const payload = {};
      if (raw.roundName) payload.roundName = raw.roundName;
      if (raw.format) payload.format = raw.format;
      if (raw.scheduledAt) payload.scheduledAt = new Date(raw.scheduledAt).toISOString();
      if (raw.durationMinutes) payload.durationMinutes = Number(raw.durationMinutes);
      if (raw.interviewerName) payload.interviewerName = raw.interviewerName;
      if (raw.outcome) payload.outcome = raw.outcome;
      if (raw.notes) payload.notes = raw.notes;

      return isEdit
        ? interviewsApi.update(appId, interview.id, payload)
        : interviewsApi.create(appId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onClose();
      toast.success(isEdit ? 'Interview updated' : 'Interview added');
    },
    onError: () => toast.error('Failed to save interview'),
  });

  return (
    <Modal title={isEdit ? 'Edit Interview' : 'Add Interview'} onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Round Name" placeholder="e.g. Technical Round 1" {...register('roundName')} />
          <Select label="Format" {...register('format')}>
            <option value="">— select —</option>
            <option value="phone">Phone</option>
            <option value="video">Video</option>
            <option value="onsite">On-site</option>
            <option value="take_home">Take-home</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Scheduled At" type="datetime-local" {...register('scheduledAt')} />
          <Input
            label="Duration (minutes)"
            type="number"
            min="1"
            placeholder="e.g. 60"
            error={errors.durationMinutes?.message}
            {...register('durationMinutes')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Interviewer Name" {...register('interviewerName')} />
          <Select label="Outcome" {...register('outcome')}>
            <option value="pending">Pending</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            {...register('notes')}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Add Interview'}
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-center text-sm text-red-600">
            {mutation.error?.response?.data?.error ?? 'Something went wrong'}
          </p>
        )}
      </form>
    </Modal>
  );
}

function ContactModal({ appId, contact, onClose, queryKey }) {
  const queryClient = useQueryClient();
  const isEdit = !!contact;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name ?? '',
      roleTitle: contact?.roleTitle ?? '',
      email: contact?.email ?? '',
      linkedinUrl: contact?.linkedinUrl ?? '',
      phone: contact?.phone ?? '',
      notes: contact?.notes ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (raw) => {
      const payload = { name: raw.name };
      if (raw.roleTitle) payload.roleTitle = raw.roleTitle;
      if (raw.email) payload.email = raw.email;
      if (raw.linkedinUrl) payload.linkedinUrl = raw.linkedinUrl;
      if (raw.phone) payload.phone = raw.phone;
      if (raw.notes) payload.notes = raw.notes;
      return isEdit
        ? contactsApi.update(appId, contact.id, payload)
        : contactsApi.create(appId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onClose();
      toast.success(isEdit ? 'Contact updated' : 'Contact added');
    },
    onError: () => toast.error('Failed to save contact'),
  });

  return (
    <Modal title={isEdit ? 'Edit Contact' : 'Add Contact'} onClose={onClose}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Name *" error={errors.name?.message} {...register('name')} />
          <Input label="Role / Title" {...register('roleTitle')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" {...register('phone')} />
        </div>
        <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/..." {...register('linkedinUrl')} />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
            rows={2}
            {...register('notes')}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Add Contact'}
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-center text-sm text-red-600">
            {mutation.error?.response?.data?.error ?? 'Something went wrong'}
          </p>
        )}
      </form>
    </Modal>
  );
}

const STATUS_ICONS = {
  applied:   <Clock className="h-3.5 w-3.5" />,
  screening: <Clock className="h-3.5 w-3.5" />,
  interview: <Calendar className="h-3.5 w-3.5" />,
  offer:     <CheckCircle2 className="h-3.5 w-3.5" />,
  rejected:  <XCircle className="h-3.5 w-3.5" />,
};

function buildTimeline(app) {
  const events = [];

  events.push({
    id: 'created',
    date: new Date(app.createdAt),
    icon: <PlusCircle className="h-3.5 w-3.5" />,
    iconBg: 'bg-indigo-100 text-indigo-600',
    title: 'Application created',
    detail: `Added ${app.company} — ${app.roleTitle}`,
  });

  if (app.status !== 'applied') {
    events.push({
      id: 'status',
      date: new Date(app.updatedAt),
      icon: STATUS_ICONS[app.status] ?? <Flag className="h-3.5 w-3.5" />,
      iconBg: app.status === 'offer' ? 'bg-green-100 text-green-600'
            : app.status === 'rejected' ? 'bg-red-100 text-red-600'
            : 'bg-yellow-100 text-yellow-600',
      title: `Status → ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`,
      detail: null,
    });
  }

  (app.interviews ?? []).forEach((iv) => {
    events.push({
      id: `iv-${iv.id}`,
      date: new Date(iv.createdAt),
      icon: <Calendar className="h-3.5 w-3.5" />,
      iconBg: 'bg-purple-100 text-purple-600',
      title: `Interview logged${iv.roundName ? `: ${iv.roundName}` : ''}`,
      detail: [
        iv.format ? iv.format.replace('_', '-') : null,
        iv.scheduledAt ? formatDate(iv.scheduledAt, { month: 'short', day: 'numeric', year: 'numeric' }) : null,
        iv.outcome && iv.outcome !== 'pending' ? iv.outcome : null,
      ].filter(Boolean).join(' · ') || null,
    });
  });

  (app.contacts ?? []).forEach((c) => {
    events.push({
      id: `c-${c.id}`,
      date: new Date(c.createdAt),
      icon: <UserPlus className="h-3.5 w-3.5" />,
      iconBg: 'bg-sky-100 text-sky-600',
      title: `Contact added: ${c.name}`,
      detail: c.roleTitle || null,
    });
  });

  if (app.followUpDate) {
    events.push({
      id: 'followup',
      date: new Date(app.updatedAt),
      icon: <Flag className="h-3.5 w-3.5" />,
      iconBg: 'bg-amber-100 text-amber-600',
      title: 'Follow-up date set',
      detail: formatDate(app.followUpDate, { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  }

  return events.sort((a, b) => b.date - a.date);
}

function gcalUrl(iv, company) {
  const title = encodeURIComponent(`Interview at ${company}${iv.roundName ? ` — ${iv.roundName}` : ''}`);
  let dates = '';
  if (iv.scheduledAt) {
    const start = new Date(iv.scheduledAt);
    const end = new Date(start.getTime() + (iv.durationMinutes ?? 60) * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    dates = `&dates=${fmt(start)}/${fmt(end)}`;
  }
  const details = encodeURIComponent([
    iv.format ? `Format: ${iv.format.replace('_', '-')}` : '',
    iv.interviewerName ? `Interviewer: ${iv.interviewerName}` : '',
    iv.notes ?? '',
  ].filter(Boolean).join('\n'));
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${dates}&details=${details}`;
}

const ACTIVITY_META = {
  application_created: {
    icon: <PlusCircle className="h-3.5 w-3.5" />,
    bg: 'bg-indigo-100 text-indigo-600',
    label: (m) => 'Application created',
    detail: (m) => m.company ? `${m.company} — ${m.roleTitle}` : null,
  },
  status_changed: {
    icon: <Flag className="h-3.5 w-3.5" />,
    bg: (m) => m.status === 'offer' ? 'bg-green-100 text-green-600'
             : m.status === 'rejected' ? 'bg-red-100 text-red-600'
             : 'bg-yellow-100 text-yellow-600',
    label: (m) => `Status → ${m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : 'Updated'}`,
    detail: () => null,
  },
  notes_updated: {
    icon: <StickyNote className="h-3.5 w-3.5" />,
    bg: 'bg-slate-100 text-slate-500',
    label: () => 'Notes updated',
    detail: () => null,
  },
  interview_added: {
    icon: <Calendar className="h-3.5 w-3.5" />,
    bg: 'bg-purple-100 text-purple-600',
    label: (m) => `Interview added${m.roundName ? `: ${m.roundName}` : ''}`,
    detail: (m) => [m.format?.replace('_', '-'), m.scheduledAt ? formatDate(m.scheduledAt, { month: 'short', day: 'numeric' }) : null].filter(Boolean).join(' · ') || null,
  },
  interview_updated: {
    icon: <Pencil className="h-3.5 w-3.5" />,
    bg: 'bg-purple-50 text-purple-500',
    label: (m) => `Interview updated${m.roundName ? `: ${m.roundName}` : ''}`,
    detail: (m) => m.outcome && m.outcome !== 'pending' ? `Outcome: ${m.outcome}` : null,
  },
  interview_deleted: {
    icon: <Trash2 className="h-3.5 w-3.5" />,
    bg: 'bg-red-50 text-red-400',
    label: () => 'Interview removed',
    detail: () => null,
  },
  contact_added: {
    icon: <UserPlus className="h-3.5 w-3.5" />,
    bg: 'bg-sky-100 text-sky-600',
    label: (m) => `Contact added${m.name ? `: ${m.name}` : ''}`,
    detail: (m) => m.roleTitle || null,
  },
  contact_deleted: {
    icon: <Trash2 className="h-3.5 w-3.5" />,
    bg: 'bg-red-50 text-red-400',
    label: () => 'Contact removed',
    detail: () => null,
  },
};

function ActivityEvent({ log }) {
  const meta = ACTIVITY_META[log.type];
  if (!meta) return null;
  const m = log.metadata ?? {};
  const bg = typeof meta.bg === 'function' ? meta.bg(m) : meta.bg;
  return (
    <div className="relative flex gap-4">
      <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${bg}`}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0 pb-1 pt-1">
        <p className="text-sm font-medium text-slate-900">{meta.label(m)}</p>
        {meta.detail(m) && <p className="mt-0.5 text-xs text-slate-500 capitalize">{meta.detail(m)}</p>}
        <p className="mt-0.5 text-xs text-slate-400">
          {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}

          {' · '}
          {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function Timeline({ app }) {
  const { data: activityLogs, isLoading } = useQuery({
    queryKey: ['activity', app.id],
    queryFn: () => applicationsApi.getActivity(app.id),
    staleTime: 30_000,
  });

  // Fallback: derive basic events from app data for apps created before activity logging
  const fallbackEvents = buildTimeline(app);
  const useFallback = !isLoading && (!activityLogs || activityLogs.length === 0);
  const events = useFallback ? fallbackEvents : (activityLogs ?? []);

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Activity</h2>
        {!isLoading && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {useFallback ? fallbackEvents.length : activityLogs.length} events
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-slate-100" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 w-40 animate-pulse rounded-full bg-slate-100" />
                <div className="h-2.5 w-24 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-slate-400">No activity recorded yet.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-px bg-slate-200" />
          <div className="space-y-4">
            {useFallback
              ? fallbackEvents.map((ev) => (
                  <div key={ev.id} className="relative flex gap-4">
                    <div className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${ev.iconBg}`}>
                      {ev.icon}
                    </div>
                    <div className="flex-1 min-w-0 pb-1 pt-1">
                      <p className="text-sm font-medium text-slate-900">{ev.title}</p>
                      {ev.detail && <p className="mt-0.5 text-xs text-slate-500 capitalize">{ev.detail}</p>}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {ev.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              : activityLogs.map((log) => <ActivityEvent key={log.id} log={log} />)
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cover Letter section ──────────────────────────────────────────────────────

function CoverLetterSection({ app }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const appQueryKey = ['application', app.id];

  const saveMutation = useMutation({
    mutationFn: (text) => applicationsApi.update(app.id, { coverLetterText: text ?? null }),
    onSuccess: (data) => {
      queryClient.setQueryData(appQueryKey, (old) =>
        old ? { ...old, application: data.application } : old
      );
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setEditing(false);
      toast.success('Cover letter saved');
    },
    onError: () => toast.error('Failed to save cover letter'),
  });

  function handleCopy() {
    navigator.clipboard.writeText(app.coverLetterText ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEdit() {
    setDraft(app.coverLetterText ?? '');
    setEditing(true);
  }

  const hasCoverLetter = !!app.coverLetterText;

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Cover Letter</h2>
        {hasCoverLetter && !editing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={() => saveMutation.mutate(null)}
              className="flex items-center gap-1.5 rounded-lg border border-red-100 dark:border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}
      </div>

      {hasCoverLetter && !editing ? (
        /* Saved letter view */
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Saved cover letter</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              {copied ? <><Check className="h-3 w-3 text-green-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
            </button>
          </div>
          <div className="px-5 py-4 max-h-72 overflow-y-auto">
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
              {app.coverLetterText}
            </p>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3">
            <button
              onClick={() => navigate('/ai/cover-letter', {
                state: { prefill: { company: app.company, role: app.roleTitle } },
              })}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Wand2 className="h-3.5 w-3.5" /> Regenerate with AI
            </button>
          </div>
        </div>
      ) : editing ? (
        /* Edit mode */
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 overflow-hidden">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            className="w-full resize-none px-5 py-4 text-sm text-slate-900 dark:text-slate-100 bg-transparent outline-none placeholder-slate-400 dark:placeholder-slate-500 leading-relaxed font-serif"
            placeholder="Paste or type your cover letter here…"
          />
          <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 px-4 py-3">
            <button
              onClick={() => saveMutation.mutate(draft)}
              disabled={saveMutation.isPending || !draft.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-600 px-6 py-8 text-center">
          <div className="mb-3 flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <Wand2 className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No cover letter yet</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Generate one with AI or paste an existing letter</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/ai/cover-letter', {
                state: { prefill: { company: app.company, role: app.roleTitle } },
              })}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate with AI
            </button>
            <button
              onClick={handleEdit}
              className="rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Paste manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const appQueryKey = ['applications', id];

  const [showEdit, setShowEdit] = useState(false);
  const [showAddInterview, setShowAddInterview] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingInterview, setEditingInterview] = useState(null);
  const [showResumePicker, setShowResumePicker] = useState(false);

  const { data: allResumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumesApi.list,
  });

  const linkResumeMutation = useMutation({
    mutationFn: (resumeId) => applicationsApi.update(id, { resumeId: resumeId ?? null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appQueryKey });
      setShowResumePicker(false);
      toast.success(app?.resumeId ? 'Resume updated' : 'Resume linked');
    },
    onError: () => toast.error('Failed to update resume'),
  });

  // Resume upload + auto-link
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadLabel, setUploadLabel] = useState('');

  const uploadAndLinkMutation = useMutation({
    mutationFn: async (formData) => {
      const resume = await resumesApi.upload(formData);
      await applicationsApi.update(id, { resumeId: resume.id });
      return resume;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      queryClient.invalidateQueries({ queryKey: appQueryKey });
      setPendingFile(null);
      setUploadLabel('');
      toast.success('Resume uploaded and linked');
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Upload failed'),
  });

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === 'application/pdf') {
      setPendingFile(file);
      setUploadLabel(file.name.replace(/\.pdf$/i, ''));
    } else {
      toast.error('Only PDF files are allowed');
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setUploadLabel(file.name.replace(/\.pdf$/i, ''));
    }
  }, []);

  function handleUploadSubmit(e) {
    e.preventDefault();
    if (!pendingFile || !uploadLabel.trim()) return;
    const fd = new FormData();
    fd.append('resume', pendingFile);
    fd.append('label', uploadLabel.trim());
    uploadAndLinkMutation.mutate(fd);
  }

  const { data: app, isLoading, isError } = useQuery({
    queryKey: appQueryKey,
    queryFn: () => applicationsApi.getById(id),
  });

  const updateMutation = useMutation({
    mutationFn: (values) => {
      const { jobUrl, source, notes, ...rest } = values;
      return applicationsApi.update(id, {
        ...rest,
        ...(jobUrl ? { jobUrl } : { jobUrl: null }),
        ...(source ? { source } : { source: null }),
        ...(notes ? { notes } : { notes: null }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appQueryKey });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowEdit(false);
      toast.success('Application updated');
    },
    onError: () => toast.error('Failed to update application'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => applicationsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      navigate('/applications');
      toast.success('Application deleted');
    },
    onError: () => toast.error('Failed to delete application'),
  });

  const deleteInterviewMutation = useMutation({
    mutationFn: (interviewId) => interviewsApi.remove(id, interviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appQueryKey });
      toast.success('Interview removed');
    },
    onError: () => toast.error('Failed to remove interview'),
  });

  const deleteContactMutation = useMutation({
    mutationFn: (contactId) => contactsApi.remove(id, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appQueryKey });
      toast.success('Contact removed');
    },
    onError: () => toast.error('Failed to remove contact'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      company: '', roleTitle: '', status: 'applied', appliedAt: '',
      jobUrl: '', source: '', notes: '', salaryMin: '', salaryMax: '', salaryCurrency: 'USD',
    },
  });

  useEffect(() => {
    if (app) {
      reset({
        company: app.company,
        roleTitle: app.roleTitle,
        status: app.status,
        appliedAt: toDateInput(app.appliedAt),
        jobUrl: app.jobUrl ?? '',
        source: app.source ?? '',
        notes: app.notes ?? '',
        salaryMin: app.salaryMin ?? '',
        salaryMax: app.salaryMax ?? '',
        salaryCurrency: app.salaryCurrency ?? 'USD',
      });
    }
  }, [app, reset]);

  if (isLoading) {
    return <div className="py-32 text-center text-slate-400">Loading…</div>;
  }

  if (isError || !app) {
    return (
      <div className="py-32 text-center">
        <p className="text-slate-500">Application not found.</p>
        <button onClick={() => navigate('/applications')} className="mt-2 text-indigo-600 underline">
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/applications')}
            className="mb-2 text-sm text-slate-400 hover:text-slate-600"
          >
            ← Back to Applications
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{app.company}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{app.roleTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowEdit(true)}>
            Edit
          </Button>
          <Button
            variant="secondary"
            isLoading={deleteMutation.isPending}
            onClick={() => {
              if (confirm('Delete this application?')) deleteMutation.mutate();
            }}
            className="text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Application details card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${STATUS_COLORS[app.status]}`}
          >
            {app.status}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <DetailField label="Applied" value={formatDate(app.appliedAt)} />
          <DetailField label="Source" value={app.source} />
          <DetailField
            label="Follow-up"
            value={app.followUpDate ? formatDate(app.followUpDate) : null}
          />
          <DetailField
            label="Salary Range"
            value={
              app.salaryMin || app.salaryMax
                ? `${app.salaryCurrency} ${(app.salaryMin ?? '?').toLocaleString()} – ${(app.salaryMax ?? '?').toLocaleString()}`
                : null
            }
          />
          {app.jobUrl && (
            <div className="col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Job URL</dt>
              <dd className="mt-1">
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  View job posting
                </a>
              </dd>
            </div>
          )}
        </dl>

        {app.notes && (
          <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{app.notes}</p>
          </div>
        )}
      </div>

      {/* ── Resume section ── */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Resume</h2>
          {app.resume ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResumePicker(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                <ChevronDown className="h-3.5 w-3.5" /> Change
              </button>
              <button
                onClick={() => linkResumeMutation.mutate(null)}
                className="flex items-center gap-1.5 rounded-lg border border-red-100 dark:border-red-900/40 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <Link2Off className="h-3.5 w-3.5" /> Unlink
              </button>
            </div>
          ) : null}
        </div>

        {app.resume ? (
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{app.resume.label}</p>
              {app.resume.version && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Version {app.resume.version}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {app.resume.downloadUrl && (
                <a
                  href={app.resume.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open in Browser
                </a>
              )}
              <button
                onClick={() => navigate('/ai/review', {
                  state: { prefill: { resumeId: app.resume.id, jobDescription: app.notes ?? '' } },
                })}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition"
                title="AI Resume Review for this job"
              >
                <Sparkles className="h-3.5 w-3.5" /> AI Review
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Drag-drop upload zone */}
            {!pendingFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition-all ${
                  dragOver
                    ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                }`}
              >
                <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                  <Upload className={`h-5 w-5 transition-colors ${dragOver ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Click or drag to upload a new resume
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">PDF only · Max 5MB · Auto-linked to this application</p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{pendingFile.name}</p>
                    <p className="text-xs text-slate-400">{(pendingFile.size / 1024).toFixed(0)} KB · Ready to upload</p>
                  </div>
                  <button type="button" onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
                <input
                  type="text"
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  placeholder="Resume label (e.g. Backend Engineer)"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!uploadLabel.trim() || uploadAndLinkMutation.isPending}
                    className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {uploadAndLinkMutation.isPending ? 'Uploading…' : 'Upload & Link'}
                  </button>
                  <button type="button" onClick={() => setPendingFile(null)} className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Or pick from existing */}
            <div className="text-center">
              <span className="text-xs text-slate-400 dark:text-slate-500">or </span>
              <button onClick={() => setShowResumePicker(true)} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                pick from existing resumes
              </button>
            </div>
          </div>
        )}

        {/* Resume picker dropdown */}
        {showResumePicker && (
          <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {allResumes.length === 0 ? 'No resumes uploaded yet' : 'Select a resume'}
              </p>
              <button onClick={() => setShowResumePicker(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs">✕</button>
            </div>
            {allResumes.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Upload a resume first to link it here.</p>
                <a
                  href="/resumes"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                >
                  Go to Resume Vault
                </a>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-60 overflow-y-auto">
                {allResumes.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      app.resume?.id === r.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    } transition`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{r.label}</p>
                      {r.version && <p className="text-xs text-slate-400">{r.version}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.downloadUrl && (
                        <a
                          href={r.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          title="Open in browser"
                        >
                          <ExternalLink className="h-3 w-3" /> Open
                        </a>
                      )}
                      {app.resume?.id === r.id ? (
                        <span className="rounded-lg bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          Selected
                        </span>
                      ) : (
                        <button
                          onClick={() => linkResumeMutation.mutate(r.id)}
                          disabled={linkResumeMutation.isPending}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cover Letter section ── */}
      <CoverLetterSection app={app} />

      {/* Interviews section */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Interviews
            {app.interviews?.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({app.interviews.length})
              </span>
            )}
          </h2>
          <Button onClick={() => setShowAddInterview(true)}>+ Add Interview</Button>
        </div>

        {app.interviews?.length === 0 || !app.interviews ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
            No interviews logged yet. Click "Add Interview" to track one.
          </div>
        ) : (
          <div className="space-y-3">
            {app.interviews.map((iv) => (
              <div
                key={iv.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {iv.roundName && (
                        <span className="font-medium text-slate-900 dark:text-slate-100">{iv.roundName}</span>
                      )}
                      {iv.format && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {FORMAT_LABELS[iv.format] ?? iv.format}
                        </span>
                      )}
                      {iv.outcome && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${OUTCOME_COLORS[iv.outcome]}`}
                        >
                          {iv.outcome}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                      {iv.scheduledAt && (
                        <span>
                          {new Date(iv.scheduledAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      )}
                      {iv.durationMinutes && <span>{iv.durationMinutes} min</span>}
                      {iv.interviewerName && <span>with {iv.interviewerName}</span>}
                    </div>

                    {iv.notes && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{iv.notes}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-start gap-1">
                    {iv.scheduledAt && (
                      <a
                        href={gcalUrl(iv, app.company)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Add to Google Calendar"
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20"
                      >
                        <ExternalLink className="h-3 w-3" /> GCal
                      </a>
                    )}
                    <button
                      onClick={() => setEditingInterview(iv)}
                      className="rounded px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this interview?')) deleteInterviewMutation.mutate(iv.id);
                      }}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contacts section */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Contacts
            {app.contacts?.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({app.contacts.length})
              </span>
            )}
          </h2>
          <Button onClick={() => setShowAddContact(true)}>+ Add Contact</Button>
        </div>

        {!app.contacts?.length ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
            No contacts yet. Add a recruiter or hiring manager to track your network.
          </div>
        ) : (
          <div className="space-y-3">
            {app.contacts.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{c.name}</span>
                      {c.roleTitle && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">{c.roleTitle}</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline">
                          {c.email}
                        </a>
                      )}
                      {c.phone && <span>{c.phone}</span>}
                      {c.linkedinUrl && (
                        <a
                          href={c.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                    {c.notes && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{c.notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setEditingContact(c)}
                      className="rounded px-2 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this contact?')) deleteContactMutation.mutate(c.id);
                      }}
                      className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <Timeline app={app} />

      {/* Edit application modal */}
      {showEdit && (
        <Modal title="Edit Application" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Company *" error={errors.company?.message} {...register('company')} />
              <Input label="Role Title *" error={errors.roleTitle?.message} {...register('roleTitle')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Status" {...register('status')}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
              <Input
                label="Applied Date *"
                type="date"
                error={errors.appliedAt?.message}
                {...register('appliedAt')}
              />
            </div>
            <Input label="Job URL" {...register('jobUrl')} />
            <Input label="Source" {...register('source')} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Salary Range (optional)</label>
              <div className="flex items-center gap-2">
                <select
                  {...register('salaryCurrency')}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'].map((c) => <option key={c}>{c}</option>)}
                </select>
                <Input placeholder="Min" type="number" {...register('salaryMin')} />
                <span className="text-slate-400">–</span>
                <Input placeholder="Max" type="number" {...register('salaryMax')} />
              </div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">Notes</span>
              <textarea
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                {...register('notes')}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
            {updateMutation.isError && (
              <p className="text-center text-sm text-red-600">
                {updateMutation.error?.response?.data?.error ?? 'Something went wrong'}
              </p>
            )}
          </form>
        </Modal>
      )}

      {/* Add interview modal */}
      {showAddInterview && (
        <InterviewModal
          appId={id}
          interview={null}
          onClose={() => setShowAddInterview(false)}
          queryKey={appQueryKey}
        />
      )}

      {/* Edit interview modal */}
      {editingInterview && (
        <InterviewModal
          appId={id}
          interview={editingInterview}
          onClose={() => setEditingInterview(null)}
          queryKey={appQueryKey}
        />
      )}

      {/* Add contact modal */}
      {showAddContact && (
        <ContactModal
          appId={id}
          contact={null}
          onClose={() => setShowAddContact(false)}
          queryKey={appQueryKey}
        />
      )}

      {/* Edit contact modal */}
      {editingContact && (
        <ContactModal
          appId={id}
          contact={editingContact}
          onClose={() => setEditingContact(null)}
          queryKey={appQueryKey}
        />
      )}
    </div>
  );
}
