import { forwardRef } from 'react';

const Select = forwardRef(function Select({ label, error, className = '', children, ...props }, ref) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <select
        ref={ref}
        className={`rounded-lg border bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 ${
          error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
});

export default Select;
