import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, X, AlertCircle } from 'lucide-react';

export default function ProctorLoginModal({ onClose, onSuccess }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close with Escape key (R-32)
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
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="proctor-auth-title">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 sm:p-7 shadow-xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-2 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Cancel"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-sky-400" aria-hidden="true">
            <Lock className="w-5 h-5" />
          </div>
          <h2 id="proctor-auth-title" className="text-xl font-bold text-white tracking-tight">Faculty &amp; Proctor Verification</h2>
          <p className="text-xs text-slate-400 mt-1">Authorized proctor portal access</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded flex items-center gap-2.5 text-xs text-rose-300" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="proctor-key" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Proctor Security Passkey
            </label>
            <input
              id="proctor-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your security passkey"
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition font-mono min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold rounded transition flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span>{loading ? 'Verifying Credentials...' : 'Access Proctor Roster'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400">
            Student access is restricted to their individual USN.
          </p>
        </div>
      </div>
    </div>
  );
}
