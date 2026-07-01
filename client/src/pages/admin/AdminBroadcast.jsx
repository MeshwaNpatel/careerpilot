import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';

const SEGMENTS = [
  { value: 'all',     label: 'All users',         desc: 'Every registered user' },
  { value: 'free',    label: 'Free plan',          desc: 'Free tier users' },
  { value: 'pro',     label: 'Pro plan',           desc: 'Pro tier users' },
  { value: 'premium', label: 'Premium plan',       desc: 'Premium tier users' },
];

const SEGMENT_BADGE = {
  all:     'bg-slate-100 text-slate-600',
  free:    'bg-slate-100 text-slate-600',
  pro:     'bg-indigo-50 text-indigo-700',
  premium: 'bg-purple-50 text-purple-700',
};

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function HistoryCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 truncate">{entry.title}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEGMENT_BADGE[entry.segment] ?? SEGMENT_BADGE.all}`}>
              {entry.segment === 'all' ? 'All users' : `${entry.segment} plan`}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {entry.recipientCount.toLocaleString()} recipients
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(entry.sentAt)}
            </span>
            <span>{new Date(entry.sentAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          title={expanded ? 'Collapse' : 'Show message'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.message}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminBroadcast() {
  const queryClient = useQueryClient();
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [lastResult, setLastResult] = useState(null);

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['admin', 'broadcast-history'],
    queryFn: adminApi.getBroadcastHistory,
    staleTime: 0,
  });

  const mutation = useMutation({
    mutationFn: () => adminApi.broadcast({ title: title.trim(), message: message.trim(), segment }),
    onSuccess: (data) => {
      setLastResult({ title: title.trim(), segment, sent: data.sent });
      setTitle('');
      setMessage('');
      setSegment('all');
      queryClient.invalidateQueries({ queryKey: ['admin', 'broadcast-history'] });
    },
  });

  const canSend = title.trim().length > 0 && message.trim().length > 0 && !mutation.isPending;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">Broadcast Notification</h1>
        <p className="mt-0.5 text-sm text-slate-500">Send an in-app notification to users by plan segment</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">

          {/* Success banner */}
          {lastResult && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <div>
                <p className="font-semibold text-green-800">Sent successfully</p>
                <p className="mt-0.5 text-sm text-green-700">
                  "{lastResult.title}" delivered to{' '}
                  <span className="font-semibold">{lastResult.sent.toLocaleString()}</span>{' '}
                  {lastResult.segment === 'all' ? 'users' : `${lastResult.segment}-plan users`}.
                </p>
              </div>
              <button onClick={() => setLastResult(null)} className="ml-auto text-green-400 hover:text-green-600 text-lg leading-none">×</button>
            </div>
          )}

          {/* Error banner */}
          {mutation.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              Failed to send broadcast. Please try again.
            </div>
          )}

          {/* Compose card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-800">Compose message</h2>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Segment */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Audience</label>
                <div className="grid grid-cols-2 gap-2">
                  {SEGMENTS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSegment(s.value)}
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        segment === s.value
                          ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-400'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className={`text-sm font-medium ${segment === s.value ? 'text-indigo-700' : 'text-slate-800'}`}>
                        {s.label}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Notification title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. New feature available!"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">{title.length}/120</p>
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Message body <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Write your message here…"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-right text-xs text-slate-400">{message.length}/500</p>
              </div>

              {/* Preview */}
              {(title || message) && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="font-semibold text-slate-900">{title || <span className="text-slate-300">Title…</span>}</p>
                    <p className="mt-1 text-sm text-slate-600">{message || <span className="text-slate-300">Message…</span>}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
              <p className="text-xs text-slate-400">Recipients will see this in their notification bell.</p>
              <button
                onClick={() => mutation.mutate()}
                disabled={!canSend}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {mutation.isPending ? 'Sending…' : 'Send broadcast'}
              </button>
            </div>
          </div>

          {/* Broadcast history */}
          <div>
            <h2 className="mb-3 font-semibold text-slate-800">
              Broadcast History
              {history.length > 0 && (
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {history.length}
                </span>
              )}
            </h2>

            {historyLoading ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading history…</div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
                No broadcasts sent yet. Send your first one above.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <HistoryCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
