import React, { useState, useEffect } from 'react';
import { GraduationCap, ArrowRight, AlertCircle, X } from 'lucide-react';

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
    { usn: '3BR23CS001', name: 'A Vedha Shree', tag: 'Safe (86.5%)' },
    { usn: '3BR23CS002', name: 'Manideep M', tag: 'Safe (88.7%)' },
    { usn: '3BR23CS005', name: 'Bharath Kumar R', tag: 'Shortage (72.9%)' },
    { usn: '3BR23CS012', name: 'Mohammed Rehan', tag: 'Shortage (71.9%)' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 sm:p-7 shadow-xl relative">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-10 w-10 rounded bg-sky-950 border border-sky-800 flex items-center justify-center mx-auto mb-3 text-sky-400" aria-hidden="true">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h2 id="login-title" className="text-xl font-bold text-white tracking-tight">Student Attendance Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Ballari Institute of Technology &amp; Management</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded flex items-center gap-2.5 text-xs text-rose-300" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="student-usn" className="block text-xs font-semibold text-slate-300 mb-1.5">
              University Seat Number (USN)
            </label>
            <input
              id="student-usn"
              type="text"
              value={usnInput}
              onChange={(e) => setUsnInput(e.target.value.toUpperCase())}
              placeholder="e.g. 3BR23CS001"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition uppercase min-h-[44px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold rounded transition flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span>View Attendance Record</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        {/* Verified Sample Profiles for Testing */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Test Student Cohort:
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
                className="p-2.5 text-left bg-slate-950 border border-slate-800 hover:border-sky-700 rounded transition min-h-[44px]"
              >
                <div className="font-mono text-xs font-bold text-sky-400">{st.usn}</div>
                <div className="text-[11px] text-slate-300 truncate">{st.name}</div>
                <div className={`text-[10px] font-semibold mt-0.5 ${st.tag.includes('Safe') ? 'text-emerald-400' : 'text-rose-400'}`}>
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
