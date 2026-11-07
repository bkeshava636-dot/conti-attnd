import React from 'react';
import { ShieldCheck, GraduationCap, RotateCw, Lock, LogOut, Sun, Moon, Download } from 'lucide-react';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  currentStudent, 
  onLogoutStudent, 
  onRefresh, 
  isRefreshing, 
  isProctorAuthenticated, 
  onOpenProctorLogin, 
  onLogoutProctor,
  darkMode,
  onToggleDarkMode,
  installPrompt,
  onInstallApp
}) {
  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 sticky top-0 z-40 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Institutional Branding */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-semibold text-xs tracking-wider shadow-xs" aria-hidden="true">
            BITM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">Contineo Attendance</span>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md font-mono">
                SIMS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Ballari Institute of Technology &amp; Management</p>
          </div>
        </div>

        {/* View Switcher for Verified Faculty */}
        {isProctorAuthenticated ? (
          <nav className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800" aria-label="Faculty navigation">
            <button
              type="button"
              onClick={() => setCurrentView('student')}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                currentView === 'student' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Proctor roster</span>
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 rounded-lg">
            <GraduationCap className="size-3.5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
            <span>Academic Attendance Dossier</span>
          </div>
        )}

        {/* Actions & Session Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* PWA Mobile & Desktop Install Button */}
          {installPrompt && (
            <button
              type="button"
              onClick={onInstallApp}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all duration-150 active:scale-[0.98]"
              title="Install app to your home screen"
            >
              <Download className="size-3.5" aria-hidden="true" />
              <span>Install App</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="size-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-800 transition-all duration-150 active:scale-[0.98] flex items-center justify-center"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="size-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="size-4 text-slate-600" aria-hidden="true" />
            )}
          </button>

          {/* Refresh Data */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="size-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-800 transition-all duration-150 active:scale-[0.98] flex items-center justify-center"
            title="Refresh attendance records"
            aria-label="Refresh attendance records"
          >
            <RotateCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-slate-900 dark:text-white' : ''}`} aria-hidden="true" />
          </button>

          {/* Mobile Student Logout Button */}
          {currentStudent && currentView === 'student' && (
            <button
              type="button"
              onClick={onLogoutStudent}
              className="flex sm:hidden items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/60 transition-all duration-150 active:scale-[0.98]"
              title="Log out student"
              aria-label="Log out student"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          )}

          {/* Desktop Student Profile Switcher */}
          {currentStudent && currentView === 'student' && (
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{currentStudent.name}</div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">{currentStudent.usn}</div>
              </div>
              <button
                type="button"
                onClick={onLogoutStudent}
                className="flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all duration-150 active:scale-[0.98]"
              >
                <LogOut className="size-3 text-slate-400" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Proctor Authentication Lock/Unlock */}
          {isProctorAuthenticated ? (
            <button
              type="button"
              onClick={onLogoutProctor}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100/70 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 transition-all duration-150 active:scale-[0.98]"
              title="Lock and exit proctor view"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              <span>Exit faculty view</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenProctorLogin}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all duration-150 active:scale-[0.98]"
              title="Faculty and proctor login"
            >
              <Lock className="size-3.5 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              <span>Faculty login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
