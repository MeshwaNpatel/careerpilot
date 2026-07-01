import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi.js';
import { ToggleLeft, ToggleRight, Save } from 'lucide-react';

const FLAG_META = {
  ai_review_enabled:       { label: 'AI Resume Review',       desc: 'Allow users to run AI resume reviews', type: 'bool' },
  cover_letter_enabled:    { label: 'AI Cover Letter',        desc: 'Allow users to generate cover letters', type: 'bool' },
  free_plan_ai_limit:      { label: 'Free plan AI limit',     desc: 'Max AI requests per month on Free tier', type: 'number', min: 0, max: 100 },
  pro_plan_ai_limit:       { label: 'Pro plan AI limit',      desc: 'Max AI requests per month on Pro tier', type: 'number', min: 0, max: 500 },
  max_resume_uploads_free: { label: 'Resume uploads (Free)',  desc: 'Max resume files for Free tier users', type: 'number', min: 0, max: 20 },
  max_resume_uploads_pro:  { label: 'Resume uploads (Pro)',   desc: 'Max resume files for Pro tier users', type: 'number', min: 0, max: 100 },
};

function BoolFlag({ flagKey, value, onSave, saving }) {
  const isOn = value === 'true';
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onSave(flagKey, String(!isOn))}
        disabled={saving}
        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
          isOn
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        } disabled:opacity-50`}
      >
        {isOn
          ? <ToggleRight className="h-5 w-5 text-green-500" />
          : <ToggleLeft className="h-5 w-5 text-slate-400" />}
        {isOn ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  );
}

function NumberFlag({ flagKey, value, meta, onSave, saving }) {
  const [local, setLocal] = useState(value);
  const dirty = local !== value;

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        value={local}
        min={meta.min}
        max={meta.max}
        onChange={(e) => setLocal(e.target.value)}
        className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
      <button
        onClick={() => onSave(flagKey, local)}
        disabled={!dirty || saving}
        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Save className="h-3.5 w-3.5" /> Save
      </button>
    </div>
  );
}

export default function AdminFeatureFlags() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState({});

  const { data: flags, isLoading, isError } = useQuery({
    queryKey: ['admin', 'flags'],
    queryFn: adminApi.getFlags,
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }) => adminApi.setFlag(key, value),
    onMutate: ({ key }) => setSaving(key),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flags'] });
      setSaved((p) => ({ ...p, [key]: true }));
      setTimeout(() => setSaved((p) => { const n = { ...p }; delete n[key]; return n; }), 2000);
    },
    onSettled: () => setSaving(null),
  });

  if (isLoading) return <div className="py-32 text-center text-slate-400">Loading…</div>;
  if (isError)   return <div className="py-32 text-center text-red-500">Failed to load feature flags.</div>;

  const boolFlags   = Object.entries(FLAG_META).filter(([, m]) => m.type === 'bool');
  const numberFlags = Object.entries(FLAG_META).filter(([, m]) => m.type === 'number');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">Feature Flags</h1>
        <p className="mt-0.5 text-sm text-slate-500">Changes apply immediately — stored in Redis</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Toggle flags */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Feature toggles</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {boolFlags.map(([key, meta]) => (
              <div key={key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{meta.label}</p>
                  <p className="text-sm text-slate-500">{meta.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  {saved[key] && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
                  <BoolFlag
                    flagKey={key}
                    value={flags[key]}
                    onSave={(k, v) => mutation.mutate({ key: k, value: v })}
                    saving={saving === key}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Numeric limits */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Plan limits</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {numberFlags.map(([key, meta]) => (
              <div key={key} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{meta.label}</p>
                  <p className="text-sm text-slate-500">{meta.desc}</p>
                </div>
                <div className="flex items-center gap-3">
                  {saved[key] && <span className="text-xs text-green-600 font-medium">Saved ✓</span>}
                  <NumberFlag
                    flagKey={key}
                    value={flags[key]}
                    meta={meta}
                    onSave={(k, v) => mutation.mutate({ key: k, value: v })}
                    saving={saving === key}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
