import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  BookOpen, 
  Clock, 
  Building2,
  CalendarDays
} from 'lucide-react';
import ShortageCalculator from './ShortageCalculator';

export default function StudentDashboard({ data, onRefresh }) {
  const [filter, setFilter] = useState('ALL');

  if (!data || !data.student) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400 text-sm">Loading verified student attendance record...</p>
      </div>
    );
  }

  const { student, overall_percentage, overall_status, critical_subjects_count, subjects } = data;

  const filteredSubjects = subjects.filter(sub => {
    if (filter === 'CRITICAL') return sub.attendance_percentage < 75;
    if (filter === 'WARNING') return sub.attendance_percentage >= 75 && sub.attendance_percentage < 85;
    if (filter === 'GOOD') return sub.attendance_percentage >= 85;
    return true;
  });

  const getStatusBadge = (pct) => {
    if (pct >= 85) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
          Safe (85%+)
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          Eligible (75% to 84%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
        <AlertOctagon className="w-3.5 h-3.5" aria-hidden="true" />
        Shortage (&lt;75%)
      </span>
    );
  };

  const getBarColor = (pct) => {
    if (pct >= 85) return 'bg-emerald-600';
    if (pct >= 75) return 'bg-amber-600';
    return 'bg-rose-600';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Student Dossier Header: Purpose-built institutional card */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                BITM Student Profile
              </span>
              <span className="text-xs text-sky-400 font-mono bg-sky-950 border border-sky-900 px-2 py-0.5 rounded">
                {student.semester || 'SEM03'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {student.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2.5 text-xs text-slate-300">
              <span className="font-mono bg-slate-950 text-slate-200 px-2.5 py-1 rounded border border-slate-800 font-semibold">
                USN: {student.usn}
              </span>
              <span className="text-slate-500">|</span>
              <span>{student.department}</span>
              <span className="text-slate-500">|</span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                Updated: {student.updated_at ? new Date(student.updated_at).toLocaleString() : 'Recently'}
              </span>
            </div>
          </div>

          {/* Aggregate Attendance Standings Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 sm:p-5 flex items-center gap-5 self-start md:self-auto shrink-0">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Aggregate Attendance
              </div>
              <div className={`text-3xl font-extrabold font-tabular mt-0.5 ${
                overall_percentage >= 85 ? 'text-emerald-400' : (overall_percentage >= 75 ? 'text-amber-400' : 'text-rose-400')
              }`}>
                {overall_percentage}%
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800" aria-hidden="true"></div>

            <div>
              {getStatusBadge(overall_percentage)}
              <div className="text-[11px] text-slate-400 mt-1">VTU Exam Eligibility</div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metrics Strip: Functional, no AI clutter */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Summary Metrics">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Overall Standing</span>
            <span className="font-semibold text-slate-300 font-tabular">{overall_percentage}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-sm overflow-hidden">
            <div className={`h-full ${getBarColor(overall_percentage)}`} style={{ width: `${overall_percentage}%` }}></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Required threshold for VTU is 75%</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Subjects in Shortage</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </div>
          <div className={`text-xl font-bold font-tabular ${critical_subjects_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {critical_subjects_count} {critical_subjects_count === 1 ? 'course' : 'courses'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {critical_subjects_count === 0 ? 'No courses below 75%' : 'Immediate attendance correction required'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Registered Courses</span>
            <BookOpen className="w-4 h-4 text-sky-400" aria-hidden="true" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-tabular">
            {subjects.length} Courses
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Theory lectures, labs, and projects</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Source System</span>
            <Building2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-xl font-bold text-slate-100">Contineo SIMS</div>
          <p className="text-[11px] text-slate-400 mt-1">Verified via authorized proctor record</p>
        </div>

      </section>

      {/* Attendance Shortage Planner */}
      <ShortageCalculator overallPercentage={overall_percentage} subjects={subjects} />

      {/* Subject Wise Table Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Course-wise Attendance Records</h2>
            <p className="text-xs text-slate-400 mt-0.5">Subject-level percentages and continuous internal evaluation scores</p>
          </div>

          {/* Filter Pills with explicit active states */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded border border-slate-800 self-start sm:self-auto" role="group" aria-label="Course Filters">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition min-h-[36px] ${
                filter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({subjects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('GOOD')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition min-h-[36px] ${
                filter === 'GOOD' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Safe (85%+)
            </button>
            <button
              type="button"
              onClick={() => setFilter('WARNING')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition min-h-[36px] ${
                filter === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              75% to 84%
            </button>
            <button
              type="button"
              onClick={() => setFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition min-h-[36px] ${
                filter === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-white'
              }`}
            >
              Shortage (&lt;75%)
            </button>
          </div>
        </div>

        {/* Subjects Table (Desktop View) */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" className="py-3 px-4">Course Code</th>
                <th scope="col" className="py-3 px-4">Subject Name</th>
                <th scope="col" className="py-3 px-4">CIE Record</th>
                <th scope="col" className="py-3 px-4">Attendance %</th>
                <th scope="col" className="py-3 px-4">Progress Indicator</th>
                <th scope="col" className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredSubjects.map(sub => (
                <tr key={sub.course_code} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                    {sub.course_code}
                  </td>
                  <td className="py-3.5 px-4 text-slate-100 font-semibold">
                    {sub.subject_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                    <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {sub.cie_info || 'Not Recorded'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-sm font-tabular">
                    <span className={
                      sub.attendance_percentage >= 85 ? 'text-emerald-400' :
                      sub.attendance_percentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                    }>
                      {sub.attendance_percentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 w-44">
                    <div className="w-full bg-slate-800 h-2 rounded-sm overflow-hidden" aria-hidden="true">
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

        {/* Subjects Card View (Mobile Layout, R-03 compliance) */}
        <div className="md:hidden divide-y divide-slate-800">
          {filteredSubjects.map(sub => (
            <div key={sub.course_code} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-sky-400">{sub.course_code}</span>
                  <h3 className="text-sm font-semibold text-white leading-tight mt-0.5">{sub.subject_name}</h3>
                </div>
                <span className={`text-base font-bold font-tabular shrink-0 ${
                  sub.attendance_percentage >= 85 ? 'text-emerald-400' :
                  sub.attendance_percentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {sub.attendance_percentage}%
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-sm overflow-hidden" aria-hidden="true">
                <div
                  className={`h-full ${getBarColor(sub.attendance_percentage)}`}
                  style={{ width: `${sub.attendance_percentage}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {sub.cie_info || 'CIE: N/A'}
                </span>
                {getStatusBadge(sub.attendance_percentage)}
              </div>
            </div>
          ))}
        </div>

      </section>

    </div>
  );
}
