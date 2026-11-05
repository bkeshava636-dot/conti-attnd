import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, X, AlertCircle } from 'lucide-react';

export default function ProctorLoginModal({ onClose, onSuccess }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close with Escape key (Keyboard accessible)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/proctor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: keyInput.trim() })
      });

      if (!res.ok) {
        throw new Error('Invalid proctor security passkey. Access denied.');
      }

      const data = await res.json();
      onSuccess(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="proctor-auth-title">
      <div className="bg-white border border-slate-200/80 rounded-xl max-w-md w-full p-6 sm:p-7 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
          title="Cancel"
          aria-label="Close dialog"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="text-center mb-6">
          <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs" aria-hidden="true">
            <Lock className="size-5" />
          </div>
          <h2 id="proctor-auth-title" className="text-xl font-semibold text-slate-900 tracking-tight text-balance">
            Faculty and Proctor Verification
          </h2>
          <p className="text-xs text-slate-500 mt-1">Authorized proctor administrative access</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800" role="alert">
            <AlertCircle className="size-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="proctor-key" className="block text-xs font-medium text-slate-700 mb-1.5">
              Proctor security passkey
            </label>
            <input
              id="proctor-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your security passkey"
              required
              autoFocus
              className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-lg px-3.5 h-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs"
          >
            <span>{loading ? 'Verifying credentials...' : 'Access proctor roster'}</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Student access is restricted to their individual seat number.
          </p>
        </div>
      </div>
    </div>
  );
}
