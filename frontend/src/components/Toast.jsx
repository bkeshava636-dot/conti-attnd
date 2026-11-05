import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
    error: <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />,
    info: <Info className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
  };

  const bgStyles = {
    success: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-100 shadow-xl shadow-emerald-500/5',
    error: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-slate-800 dark:text-slate-100 shadow-xl shadow-rose-500/5',
    info: 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-100 shadow-xl shadow-blue-500/5'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 fade-in duration-200">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-medium ${bgStyles[type]}`}>
        {icons[type]}
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 size-5 flex items-center justify-center rounded transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
