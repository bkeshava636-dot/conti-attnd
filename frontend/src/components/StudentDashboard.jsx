import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Filter,
  Calendar,
  Sparkles
} from 'lucide-react';
import ShortageCalculator from './ShortageCalculator';

export default function StudentDashboard({ data, onRefresh }) {
  const [filter, setFilter] = useState('ALL');

  if (!data || !data.student) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Loading student attendance records...</p>
      </div>
    );
  }

  const { student, overall_percentage, overall_status, critical_subjects_count, subjects } = data;

  // Filter subjects
  const filteredSubjects = subjects.filter(sub => {
    if (filter === 'CRITICAL') return sub.attendance_percentage < 75;
    if (filter === 'WARNING') return sub.attendance_percentage >= 75 && sub.attendance_percentage < 85;
    if (filter === 'GOOD') return sub.attendance_percentage >= 85;
    return true;
  });

  const getStatusBadge = (pct) => {
    if (pct >= 85) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle className="w-3.5 h-3.5" />
          Safe (≥85%)
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Eligible (75-84%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        Shortage (&lt;75%)
      </span>
    );
  };

  const getBarColor = (pct) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Student Welcome & Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                Ballari Institute of Technology & Management
              </span>
              <span className="text-xs text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded">
                {student.semester || 'SEM03'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {student.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-slate-300">
              <span className="font-mono bg-slate-800/90 text-sky-300 px-2 py-0.5 rounded border border-slate-700">
                USN: {student.usn}
              </span>
              <span>•</span>
              <span>{student.department}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Updated: {student.updated_at ? new Date(student.updated_at).toLocaleString() : 'Recently'}
              </span>
            </div>
          </div>

          {/* Quick Overall Attendance Badge */}
          <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-4 self-start md:self-auto shrink-0">
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Overall Attendance</div>
              <div className={`text-3xl font-black ${
                overall_percentage >= 85 ? 'text-emerald-400' : (overall_percentage >= 75 ? 'text-amber-400' : 'text-rose-400')
              }`}>
                {overall_percentage}%
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800"></div>
            <div>
              {getStatusBadge(overall_percentage)}
              <div className="text-[10px] text-slate-400 mt-1">VTU Exam Eligibility</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Overall Standing</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{overall_percentage}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div className={`h-full ${getBarColor(overall_percentage)}`} style={{ width: `${overall_percentage}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Critical Shortage (&lt;75%)</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-2xl font-bold ${critical_subjects_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {critical_subjects_count} {critical_subjects_count === 1 ? 'Subject' : 'Subjects'}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {critical_subjects_count === 0 ? 'All subjects meet university criteria' : 'Requires immediate attendance correction'}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Registered Subjects</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{subjects.length} Courses</div>
          <p className="text-xs text-slate-400 mt-2">Theory, Labs & Practical Modules</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Proctor Sync Source</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">Contineo SIMS</div>
          <p className="text-xs text-slate-400 mt-2">Direct Proctor Verification Active</p>
        </div>

      </div>

      {/* Shortage & Bunk Planner */}
      <ShortageCalculator overallPercentage={overall_percentage} subjects={subjects} />

      {/* Subject Wise Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Subject-wise Attendance Breakdown</h2>
            <p className="text-xs text-slate-400 mt-0.5">Continuous evaluation and attendance percentage per course</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                filter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({subjects.length})
            </button>
            <button
              onClick={() => setFilter('GOOD')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                filter === 'GOOD' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              ≥85%
            </button>
            <button
              onClick={() => setFilter('WARNING')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                filter === 'WARNING' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              75-84%
            </button>
            <button
              onClick={() => setFilter('CRITICAL')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                filter === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              &lt;75%
            </button>
          </div>
        </div>

        {/* Subjects Table (Desktop) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Course Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4">CIE Record</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Visual Progress</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredSubjects.map(sub => (
                <tr key={sub.course_code} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                    {sub.course_code}
                  </td>
                  <td className="py-3.5 px-4 text-white font-semibold">
                    {sub.subject_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {sub.cie_info || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-sm">
                    <span className={
                      sub.attendance_percentage >= 85 ? 'text-emerald-400' :
                      sub.attendance_percentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                    }>
                      {sub.attendance_percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 w-44">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getBarColor(sub.attendance_percentage)}`}
                        style={{ width: `${sub.attendance_percentage}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {getStatusBadge(sub.attendance_percentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Subjects Card View (Mobile) */}
        <div className="md:hidden divide-y divide-slate-800">
          {filteredSubjects.map(sub => (
            <div key={sub.course_code} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-400">{sub.course_code}</span>
                  <h4 className="text-sm font-semibold text-white leading-tight mt-0.5">{sub.subject_name}</h4>
                </div>
                <span className={`text-base font-extrabold ${
                  sub.attendance_percentage >= 85 ? 'text-emerald-400' :
                  sub.attendance_percentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {sub.attendance_percentage}%
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(sub.attendance_percentage)}`}
                  style={{ width: `${sub.attendance_percentage}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {sub.cie_info}
                </span>
                {getStatusBadge(sub.attendance_percentage)}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
