import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, X, AlertCircle } from 'lucide-react';

export default function ProctorLoginModal({ onClose, onSuccess }) {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        throw new Error('Invalid proctor security key. Access denied.');
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
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/30 text-white">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Proctor Admin Verification</h2>
          <p className="text-xs text-slate-400 mt-1">Authorized faculty and counselling officers only</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Proctor Security Passkey
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your Proctor Secret Key"
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Verifying...' : 'Unlock Proctor Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Students are restricted to individual USN attendance view.
          </p>
        </div>
      </div>
    </div>
  );
}
