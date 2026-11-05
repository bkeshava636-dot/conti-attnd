import React, { useState, useEffect } from 'react';
import { GraduationCap, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginModal({ onLogin, error }) {
  const [usnInput, setUsnInput] = useState('3BR23CS001');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usnInput.trim()) return;
    setLoading(true);
    onLogin(usnInput.trim());
    setLoading(false);
  };

  const sampleStudents = [
    { usn: '3BR23CS001', name: 'A Vedha Shree', tag: 'Safe (86.5%)', safe: true },
    { usn: '3BR23CS002', name: 'Manideep M', tag: 'Safe (88.7%)', safe: true },
    { usn: '3BR23CS005', name: 'Bharath Kumar R', tag: 'Shortage (72.9%)', safe: false },
    { usn: '3BR23CS012', name: 'Mohammed Rehan', tag: 'Shortage (71.9%)', safe: false },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="bg-white border border-slate-200/80 rounded-xl max-w-md w-full p-6 sm:p-7 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-xs" aria-hidden="true">
            <GraduationCap className="size-5" />
          </div>
          <h2 id="login-title" className="text-xl font-semibold text-slate-900 tracking-tight text-balance">
            Student Attendance Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">Ballari Institute of Technology &amp; Management</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800" role="alert">
            <AlertCircle className="size-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student-usn" className="block text-xs font-medium text-slate-700 mb-1.5">
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
              className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 rounded-lg px-3.5 h-10 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition-all uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs"
          >
            <span>View attendance record</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </form>

        {/* Verified Sample Profiles for Testing */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-500 mb-2 uppercase tracking-wider">
            Quick selection sample roster
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sampleStudents.map(st => (
              <button
                key={st.usn}
                type="button"
                onClick={() => {
                  setUsnInput(st.usn);
                  onLogin(st.usn);
                }}
                className="p-2.5 text-left bg-slate-50 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 rounded-lg transition-all duration-150 active:scale-[0.98]"
              >
                <div className="font-mono text-xs font-semibold text-slate-900">{st.usn}</div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5">{st.name}</div>
                <div className={`text-[10px] font-medium mt-1 inline-flex items-center gap-1 ${st.safe ? 'text-emerald-700' : 'text-rose-700'}`}>
                  <span className={`size-1.5 rounded-full ${st.safe ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {st.tag}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
