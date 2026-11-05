import React from 'react';
import { ShieldCheck, GraduationCap, RotateCw, Lock, LogOut } from 'lucide-react';

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
    <header className="border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Institutional Branding */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-sky-700 text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-sm" aria-hidden="true">
            BITM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">BITM Attendance</span>
              <span className="text-[11px] font-semibold text-sky-400 bg-sky-950/80 border border-sky-800/60 px-1.5 py-0.5 rounded">
                SIMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Ballari Institute of Technology &amp; Management</p>
          </div>
        </div>

        {/* View Switcher for Verified Faculty */}
        {isProctorAuthenticated ? (
          <nav className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-1" aria-label="Faculty Navigation">
            <button
              type="button"
              onClick={() => setCurrentView('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                currentView === 'student' ? 'bg-sky-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>Student View</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('proctor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
                currentView === 'proctor' ? 'bg-sky-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Proctor Roster</span>
            </button>
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded">
            <GraduationCap className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span>Academic Attendance Dossier</span>
          </div>
        )}

        {/* Actions & Session Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Attendance Records"
            aria-label="Refresh attendance records"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} aria-hidden="true" />
          </button>

          {/* Student Profile Switcher */}
          {currentStudent && currentView === 'student' && (
            <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200 uppercase">{currentStudent.name}</div>
                <div className="text-[11px] font-mono text-slate-400">{currentStudent.usn}</div>
              </div>
              <button
                type="button"
                onClick={onLogoutStudent}
                className="text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded transition min-h-[44px]"
              >
                Change USN
              </button>
            </div>
          )}

          {/* Proctor Authentication Lock/Unlock */}
          {isProctorAuthenticated ? (
            <button
              type="button"
              onClick={onLogoutProctor}
              className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 border border-rose-800/60 px-3 py-2 rounded transition min-h-[44px]"
              title="Lock and exit proctor view"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Exit Proctor</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenProctorLogin}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded transition min-h-[44px]"
              title="Faculty and proctor login"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Faculty Login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
