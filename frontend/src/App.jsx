import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import StudentSkeleton from './components/StudentSkeleton';
import ProctorDashboard from './components/ProctorDashboard';
import LoginModal from './components/LoginModal';
import ProctorLoginModal from './components/ProctorLoginModal';
import Toast from './components/Toast';

export default function App() {
  const [currentView, setCurrentView] = useState('student'); // 'student' | 'proctor'
  const [currentUSN, setCurrentUSN] = useState('3BR23CS001');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [showStudentLoginModal, setShowStudentLoginModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Dark Mode State: default to true (Dark Mode) as requested
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // Default dark mode
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      showNotification(next ? 'Dark mode enabled' : 'Light mode enabled', 'info');
      return next;
    });
  };

  // Proctor Auth State
  const [proctorToken, setProctorToken] = useState(() => sessionStorage.getItem('proctor_session_token') || null);
  const [showProctorLoginModal, setShowProctorLoginModal] = useState(false);

  useEffect(() => {
    if (currentUSN) {
      fetchStudentAttendance(currentUSN);
    }
  }, [currentUSN]);

  const showNotification = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  async function fetchStudentAttendance(usn) {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(`/api/attendance/student/${usn.toUpperCase()}`);
      if (!res.ok) {
        throw new Error(`Student ${usn} not found or no attendance has been synced yet.`);
      }
      const data = await res.json();
      setStudentData(data);
      setShowStudentLoginModal(false);
    } catch (err) {
      setLoginError(err.message);
      setShowStudentLoginModal(true);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (currentUSN) {
      await fetchStudentAttendance(currentUSN);
      showNotification('Attendance records refreshed successfully');
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSelectStudentFromProctor = (usn) => {
    setCurrentUSN(usn);
    setCurrentView('student');
    showNotification(`Switched to student ${usn}`);
  };

  const handleOpenProctorLogin = () => {
    if (proctorToken) {
      setCurrentView('proctor');
    } else {
      setShowProctorLoginModal(true);
    }
  };

  const handleProctorLoginSuccess = (token) => {
    sessionStorage.setItem('proctor_session_token', token);
    setProctorToken(token);
    setShowProctorLoginModal(false);
    setCurrentView('proctor');
    showNotification('Faculty authentication verified');
  };

  const handleProctorLogout = () => {
    sessionStorage.removeItem('proctor_session_token');
    setProctorToken(null);
    setCurrentView('student');
    showNotification('Exited faculty administration mode', 'info');
  };

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'proctor' && !proctorToken) {
            setShowProctorLoginModal(true);
          } else {
            setCurrentView(view);
          }
        }}
        currentStudent={studentData?.student}
        onLogoutStudent={() => setShowStudentLoginModal(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isProctorAuthenticated={Boolean(proctorToken)}
        onOpenProctorLogin={handleOpenProctorLogin}
        onLogoutProctor={handleProctorLogout}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'student' ? (
          loading && !studentData ? (
            <StudentSkeleton />
          ) : (
            <StudentDashboard 
              data={studentData} 
              onRefresh={handleRefresh} 
              onNotify={showNotification}
              darkMode={darkMode}
            />
          )
        ) : (
          <ProctorDashboard 
            onSelectStudent={handleSelectStudentFromProctor}
            proctorToken={proctorToken}
            onRequireAuth={() => setShowProctorLoginModal(true)}
            onNotify={showNotification}
            darkMode={darkMode}
          />
        )}
      </main>

      {/* Student Login Switcher Modal */}
      {showStudentLoginModal && (
        <LoginModal
          onLogin={(usn) => {
            setCurrentUSN(usn);
            fetchStudentAttendance(usn);
            showNotification(`Loaded attendance for ${usn}`);
          }}
          error={loginError}
        />
      )}

      {/* Proctor Security Verification Modal */}
      {showProctorLoginModal && (
        <ProctorLoginModal
          onClose={() => setShowProctorLoginModal(false)}
          onSuccess={handleProctorLoginSuccess}
        />
      )}

      {/* Toast Notification Container */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Contineo Attendance Tracker • Ballari Institute of Technology &amp; Management
          </div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <a href="/fixture" target="_blank" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contineo SIMS simulator</a>
            <span>•</span>
            <a href="http://localhost:5000/api/health" target="_blank" className="hover:text-slate-900 dark:hover:text-white transition-colors">API health</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
