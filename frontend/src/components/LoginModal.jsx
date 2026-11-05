import React, { useState } from 'react';
import { GraduationCap, ArrowRight, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

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
    { usn: '3BR23CS005', name: 'Bharath Kumar R', tag: 'Shortage (71.9%)' },
    { usn: '3BR23CS012', name: 'Mohammed Rehan', tag: 'Shortage (70.9%)' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20 text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Attendance Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Ballari Institute of Technology & Management</p>
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
              University Seat Number (USN)
            </label>
            <div className="relative">
              <input
                type="text"
                value={usnInput}
                onChange={(e) => setUsnInput(e.target.value.toUpperCase())}
                placeholder="e.g. 3BR23CS001"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2"
          >
            <span>View My Attendance</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick select demo pills */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">
            Quick Test Student Profiles:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {sampleStudents.map(st => (
              <button
                key={st.usn}
                onClick={() => {
                  setUsnInput(st.usn);
                  onLogin(st.usn);
                }}
                className="p-2 text-left bg-slate-950 border border-slate-800 hover:border-sky-500/40 rounded-lg transition group"
              >
                <div className="font-mono text-xs font-bold text-sky-400 group-hover:text-sky-300">{st.usn}</div>
                <div className="text-[11px] text-slate-300 truncate">{st.name}</div>
                <div className={`text-[10px] font-semibold ${st.tag.includes('Safe') ? 'text-emerald-400' : 'text-rose-400'}`}>
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
