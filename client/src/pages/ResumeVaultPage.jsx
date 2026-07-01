import { useRef, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Upload, Download, Pencil, Trash2, FileText, Plus, Sparkles, TrendingUp,
  ArrowRight, Briefcase, X, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { resumesApi } from '../api/resumesApi.js';
import { applicationsApi } from '../api/applicationsApi.js';
import { subscriptionsApi } from '../api/adminApi.js';
import { useAuth } from '../hooks/useAuth.js';

const PLAN_LIMITS = { free: 10, pro: 25, premium: Infinity };

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditModal({ resume, onClose }) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState(resume.label);
  const [version, setVersion] = useState(resume.version ?? '');

  const mutation = useMutation({
    mutationFn: () => resumesApi.update(resume.id, { label: label.trim(), version: version.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume updated');
      onClose();
    },
    onError: () => toast.error('Failed to update resume'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-5 py-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Edit resume</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Label *</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Version</span>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. v2.0"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 px-5 py-4">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!label.trim() || mutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Resume card ───────────────────────────────────────────────────────────────

function ResumeCard({ resume, linkedCount, onEdit, onDelete }) {
  const pct = Math.min(100, (linkedCount / 10) * 100);

  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
          <FileText className="h-5 w-5 text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">{resume.label}</p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {resume.version && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                {resume.version}
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(resume.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            {resume.fileSizeKb > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">· {resume.fileSizeKb} KB</span>
            )}
          </div>
        </div>
      </div>

      {/* Linked applications stat */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Briefcase className="h-3 w-3" />
            Linked to applications
          </span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{linkedCount}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
        <a
          href={resume.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(resume)}
            className="rounded-lg p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(resume.id)}
            className="rounded-lg p-2 text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add card (empty slot) ─────────────────────────────────────────────────────

function AddResumeCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-5 min-h-[180px] text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-current">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium">Add Resume</span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ResumeVaultPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: sub } = useQuery({ queryKey: ['subscription'], queryFn: subscriptionsApi.getMy, staleTime: 0 });
  const plan = sub?.plan ?? user?.plan ?? 'free';
  const limit = PLAN_LIMITS[plan] ?? 10;

  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadVersion, setUploadVersion] = useState('');
  const [editingResume, setEditingResume] = useState(null);

  const { data: resumes = [], isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumesApi.list,
  });

  const { data: appsData } = useQuery({
    queryKey: ['applications', 'kanban'],
    queryFn: () => applicationsApi.list({ limit: 100 }),
  });

  const linkedCounts = useMemo(() => {
    const counts = {};
    (appsData?.items ?? []).forEach((app) => {
      if (app.resume?.id) counts[app.resume.id] = (counts[app.resume.id] ?? 0) + 1;
    });
    return counts;
  }, [appsData]);

  const uploadMutation = useMutation({
    mutationFn: (formData) => resumesApi.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setPendingFile(null);
      setUploadLabel('');
      setUploadVersion('');
      toast.success('Resume uploaded');
    },
    onError: (err) => toast.error(err.response?.data?.error ?? 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => resumesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume deleted');
    },
    onError: () => toast.error('Failed to delete resume'),
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
    if (uploadVersion.trim()) fd.append('version', uploadVersion.trim());
    uploadMutation.mutate(fd);
  }

  function handleDelete(id) {
    if (confirm('Delete this resume? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  }

  const atLimit = limit !== Infinity && resumes.length >= limit;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resume Vault</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Store and manage your resume versions. Link them to applications for AI insights.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={atLimit}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Upload className="h-4 w-4" />
            Upload Resume
          </button>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 px-8 py-6 space-y-6">

        {/* ── Upload zone / pending form ── */}
        {!pendingFile ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !atLimit && fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-all ${
              atLimit
                ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-50 cursor-not-allowed'
                : dragOver
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer'
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors ${
              dragOver ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              <Upload className={`h-6 w-6 transition-colors ${dragOver ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'}`} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {atLimit ? 'Upload limit reached' : 'Click or drag to upload'}
              </p>
              <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">PDF only · Maximum file size 5MB</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Tailored for LinkedIn
              </span>
              <span className="rounded-full bg-green-50 dark:bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                ATS Optimized
              </span>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleUploadSubmit}
            className="rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-900/10 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/30">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{pendingFile.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{(pendingFile.size / 1024).toFixed(0)} KB · Ready to upload</p>
              </div>
              <button type="button" onClick={() => setPendingFile(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Label *</span>
                <input
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  placeholder="e.g. Software Engineer Resume"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Version</span>
                <input
                  value={uploadVersion}
                  onChange={(e) => setUploadVersion(e.target.value)}
                  placeholder="e.g. v2.0"
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingFile(null)}
                className="rounded-xl px-4 py-2 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!uploadLabel.trim() || uploadMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading…' : <><Upload className="h-4 w-4" /> Upload</>}
              </button>
            </div>
          </form>
        )}

        {/* ── Resume cards grid ── */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-600" />
                  </div>
                </div>
                <div className="h-1.5 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 h-8 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No resumes yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Upload your first resume to link it to applications and unlock AI features.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((resume) => (
              <ResumeCard
                key={resume.id}
                resume={resume}
                linkedCount={linkedCounts[resume.id] ?? 0}
                onEdit={setEditingResume}
                onDelete={handleDelete}
              />
            ))}
            {!atLimit && <AddResumeCard onClick={() => fileInputRef.current?.click()} />}
          </div>
        )}

        {/* ── Bottom promo banners ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
            <div className="relative z-10">
              <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70 mb-3">
                AI INSIGHTS
              </span>
              <p className="text-lg font-bold leading-snug">Score your resume against any job description.</p>
              <p className="mt-1 text-sm text-white/60">
                Get an ATS compatibility score, missing keywords, and section-by-section feedback.
              </p>
              <Link
                to="/ai/review"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Try AI Review
              </Link>
            </div>
            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-indigo-600/20" />
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-violet-600/10" />
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white">
            <div className="relative z-10">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-lg font-bold leading-snug">Career Acceleration</p>
              <p className="mt-1 text-sm text-white/70">
                Track your pipeline health, response rates, and weekly application velocity.
              </p>
              <Link
                to="/analytics"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25 transition-colors"
              >
                View Analytics <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-indigo-500/20" />
          </div>
        </div>

      </div>

      {editingResume && (
        <EditModal resume={editingResume} onClose={() => setEditingResume(null)} />
      )}
    </div>
  );
}
