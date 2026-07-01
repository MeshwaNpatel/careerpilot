import { forwardRef } from 'react';

const Input = forwardRef(function Input({ label, error, className = '', ...props }, ref) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input
        ref={ref}
        className={`rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
});

export default Input;
