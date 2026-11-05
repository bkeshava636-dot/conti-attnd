import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import ProctorDashboard from './components/ProctorDashboard';
import LoginModal from './components/LoginModal';

export default function App() {
  const [currentView, setCurrentView] = useState('student'); // 'student' | 'proctor'
  const [currentUSN, setCurrentUSN] = useState('3BR23CS001');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

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
      setShowLoginModal(false);
    } catch (err) {
      setLoginError(err.message);
      setShowLoginModal(true);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentStudent={studentData?.student}
        onLogout={() => setShowLoginModal(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
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
          <ProctorDashboard onSelectStudent={handleSelectStudentFromProctor} />
        )}
      </main>

      {/* Student Login Switcher Modal */}
      {showLoginModal && (
        <LoginModal
          onLogin={(usn) => {
            setCurrentUSN(usn);
            fetchStudentAttendance(usn);
          }}
          error={loginError}
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
