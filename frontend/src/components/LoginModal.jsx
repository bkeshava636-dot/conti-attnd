import React, { useState } from 'react';
import { GraduationCap, ArrowRight, AlertCircle, X, Loader2 } from 'lucide-react';

export default function LoginModal({ onLogin, error, onClose }) {
  const [usnInput, setUsnInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clean = usnInput.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    await onLogin(clean);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
        
        {/* Optional Close Button if already logged in */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="size-12 rounded-xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs" aria-hidden="true">
            <GraduationCap className="size-6" />
          </div>
          <h2 id="login-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Enter Your USN
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ballari Institute of Technology &amp; Management
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Enter your University Seat Number to view your course attendance
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300" role="alert">
            <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" aria-hidden="true" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student-usn" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              University Seat Number (USN)
            </label>
            <input
              id="student-usn"
              type="text"
              value={usnInput}
              onChange={(e) => setUsnInput(e.target.value.toUpperCase())}
              placeholder="e.g. 3BR23CS001"
              required
              autoFocus
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 rounded-lg px-3.5 h-11 text-sm font-mono font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-all uppercase tracking-wider"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !usnInput.trim()}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Checking student roster...</span>
              </>
            ) : (
              <>
                <span>View My Attendance</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
