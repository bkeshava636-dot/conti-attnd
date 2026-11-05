import React from 'react';
import { ShieldCheck, GraduationCap, RefreshCw, Lock, LogOut } from 'lucide-react';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  currentStudent, 
  onLogoutStudent, 
  onRefresh, 
  isRefreshing,
  isProctorAuthenticated,
  onOpenProctorLogin,
  onLogoutProctor
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-sky-500/20">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">BITM Contineo</span>
              <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded">
                SIMS SYNC
              </span>
            </div>
            <p className="text-xs text-slate-400">Attendance Portal</p>
          </div>
        </div>

        {/* Center: Admin Status or Mode Indicator */}
        {isProctorAuthenticated ? (
          <div className="flex items-center bg-slate-900 border border-indigo-500/40 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('student')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                currentView === 'student' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student View</span>
            </button>
            <button
              onClick={() => setCurrentView('proctor')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                currentView === 'proctor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Proctor Admin</span>
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
            <GraduationCap className="w-4 h-4 text-sky-400" />
            <span>Student Attendance Portal</span>
          </div>
        )}

        {/* Right Info / Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
            title="Refresh Attendance Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          {/* Student Profile Quick Info */}
          {currentStudent && currentView === 'student' && (
            <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="text-right">
                <div className="text-xs font-bold text-white uppercase">{currentStudent.name}</div>
                <div className="text-[11px] font-mono text-slate-400">{currentStudent.usn}</div>
              </div>
              <button
                onClick={onLogoutStudent}
                className="text-xs text-slate-400 hover:text-sky-400 border border-slate-800 hover:border-sky-500/40 px-2 py-1 rounded transition"
              >
                Switch
              </button>
            </div>
          )}

          {/* Proctor Login / Exit Button */}
          {isProctorAuthenticated ? (
            <button
              onClick={onLogoutProctor}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg transition"
              title="Lock & Exit Proctor Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
          ) : (
            <button
              onClick={onOpenProctorLogin}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 hover:bg-slate-800/80 border border-slate-800 px-2.5 py-1.5 rounded-lg transition"
              title="Proctor / Faculty Access"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Proctor Access</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
