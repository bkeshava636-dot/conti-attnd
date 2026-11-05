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
    <header className="border-b border-slate-200/80 bg-white/95 sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Institutional Branding */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-semibold text-xs tracking-wider shadow-xs" aria-hidden="true">
            BITM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm tracking-tight">Contineo Attendance</span>
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-mono">
                SIMS
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Ballari Institute of Technology &amp; Management</p>
          </div>
        </div>

        {/* View Switcher for Verified Faculty */}
        {isProctorAuthenticated ? (
          <nav className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200" aria-label="Faculty Navigation">
            <button
              type="button"
              onClick={() => setCurrentView('student')}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                currentView === 'student' 
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="size-3.5" aria-hidden="true" />
              <span>Student view</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('proctor')}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                currentView === 'proctor' 
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Proctor roster</span>
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
            <GraduationCap className="size-3.5 text-slate-700" aria-hidden="true" />
            <span>Academic Attendance Dossier</span>
          </div>
        )}

        {/* Actions & Session Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="size-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-all duration-150 active:scale-[0.98] flex items-center justify-center"
            title="Refresh attendance records"
            aria-label="Refresh attendance records"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} aria-hidden="true" />
          </button>

          {/* Student Profile Switcher */}
          {currentStudent && currentView === 'student' && (
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-900">{currentStudent.name}</div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500">{currentStudent.usn}</div>
              </div>
              <button
                type="button"
                onClick={onLogoutStudent}
                className="h-8 px-2.5 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all duration-150 active:scale-[0.98]"
              >
                Change student
              </button>
            </div>
          )}

          {/* Proctor Authentication Lock/Unlock */}
          {isProctorAuthenticated ? (
            <button
              type="button"
              onClick={onLogoutProctor}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 transition-all duration-150 active:scale-[0.98]"
              title="Lock and exit proctor view"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              <span>Exit faculty view</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenProctorLogin}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all duration-150 active:scale-[0.98]"
              title="Faculty and proctor login"
            >
              <Lock className="size-3.5 text-slate-500" aria-hidden="true" />
              <span>Faculty login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
