import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import ProctorDashboard from './components/ProctorDashboard';
import LoginModal from './components/LoginModal';
import ProctorLoginModal from './components/ProctorLoginModal';

export default function App() {
  const [currentView, setCurrentView] = useState('student'); // 'student' | 'proctor'
  const [currentUSN, setCurrentUSN] = useState('3BR23CS001');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [showStudentLoginModal, setShowStudentLoginModal] = useState(false);

  // Proctor Auth State
  const [proctorToken, setProctorToken] = useState(() => sessionStorage.getItem('proctor_session_token') || null);
  const [showProctorLoginModal, setShowProctorLoginModal] = useState(false);

  useEffect(() => {
    if (currentUSN) {
      fetchStudentAttendance(currentUSN);
    }
  }, [currentUSN]);

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
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleSelectStudentFromProctor = (usn) => {
    setCurrentUSN(usn);
    setCurrentView('student');
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
  };

  const handleProctorLogout = () => {
    sessionStorage.removeItem('proctor_session_token');
    setProctorToken(null);
    setCurrentView('student');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'student' ? (
          loading && !studentData ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <div className="h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Fetching student record...</p>
            </div>
          ) : (
            <StudentDashboard data={studentData} onRefresh={handleRefresh} />
          )
        ) : (
          <ProctorDashboard 
            onSelectStudent={handleSelectStudentFromProctor}
            proctorToken={proctorToken}
            onRequireAuth={() => setShowProctorLoginModal(true)}
          />
        )}
      </main>

      {/* Student Login Switcher Modal */}
      {showStudentLoginModal && (
        <LoginModal
          onLogin={(usn) => {
            setCurrentUSN(usn);
            fetchStudentAttendance(usn);
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

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Contineo Attendance Tracker • Ballari Institute of Technology & Management
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="/fixture" target="_blank" className="hover:text-sky-400 transition">Contineo SIMS Simulator</a>
            <span>•</span>
            <a href="http://localhost:5000/api/health" target="_blank" className="hover:text-sky-400 transition">API Health</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
