import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  BookOpen, 
  Clock, 
  Building2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import ShortageCalculator from './ShortageCalculator';

export default function StudentDashboard({ data, onRefresh }) {
  const [filter, setFilter] = useState('ALL');

  if (!data || !data.student) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-slate-200/80 shadow-xs">
        <p className="text-slate-500 text-sm">No verified attendance record loaded.</p>
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

  // UI-Skills Playbook: Status dot + accessible label (Status not color alone)
  const getStatusBadge = (pct) => {
    if (pct >= 85) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-600 ring-2 ring-emerald-500/20" aria-hidden="true" />
          Safe (85%+)
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-600 ring-2 ring-amber-500/20" aria-hidden="true" />
          Eligible (75% to 84%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
        <span className="size-1.5 rounded-full bg-rose-600 ring-2 ring-rose-500/20" aria-hidden="true" />
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
      
      {/* Student Dossier Header: Refined quiet surface */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Student attendance dossier
              </span>
              <span className="text-[11px] font-mono text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                {student.semester || 'SEM03'}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight text-balance">
              {student.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs text-slate-600">
              <span className="font-mono tabular-nums bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200 font-medium">
                USN: {student.usn}
              </span>
              <span className="text-slate-300">•</span>
              <span>{student.department}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="size-3.5 text-slate-400" aria-hidden="true" />
                Updated: {student.updated_at ? new Date(student.updated_at).toLocaleString() : 'Recently'}
              </span>
            </div>
          </div>

          {/* Aggregate Attendance Standing Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-4 flex items-center gap-5 self-start md:self-auto shrink-0">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Aggregate attendance
              </div>
              <div className={`text-3xl font-semibold font-mono tabular-nums mt-0.5 ${
                overall_percentage >= 85 ? 'text-emerald-700' : (overall_percentage >= 75 ? 'text-amber-700' : 'text-rose-700')
              }`}>
                {overall_percentage}%
              </div>
            </div>

            <div className="h-10 w-px bg-slate-200" aria-hidden="true" />

            <div>
              {getStatusBadge(overall_percentage)}
              <div className="text-[11px] text-slate-500 mt-1">VTU exam status</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Metric Cards Strip: UI-Skills quiet elevation & tabular figures */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Attendance summary metrics">
        
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Overall standing</span>
            <span className="font-medium text-slate-900 font-mono tabular-nums">{overall_percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className={`h-full ${getBarColor(overall_percentage)}`} style={{ width: `${overall_percentage}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-pretty">VTU minimum threshold is 75%</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Shortage subjects</span>
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className={`text-2xl font-semibold font-mono tabular-nums ${critical_subjects_count > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
            {critical_subjects_count} {critical_subjects_count === 1 ? 'course' : 'courses'}
          </div>
          <p className="text-xs text-slate-500 mt-1 text-pretty">
            {critical_subjects_count === 0 ? 'All courses above 75%' : 'Immediate attendance recovery required'}
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Enrolled courses</span>
            <BookOpen className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {subjects.length} courses
          </div>
          <p className="text-xs text-slate-500 mt-1 text-pretty">Theory, lab, and skill development</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Verified source</span>
            <Building2 className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-slate-900">Contineo SIMS</div>
          <p className="text-xs text-slate-500 mt-1 text-pretty">Synchronized from proctor portal</p>
        </div>

      </section>

      {/* Shortage Forecast Calculator */}
      <ShortageCalculator overallPercentage={overall_percentage} subjects={subjects} />

      {/* Course Breakdown Table */}
      <section className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        
        {/* Table Header & Segmented Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Course attendance breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">Continuous evaluation and lecture participation records</p>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto" role="group" aria-label="Course filters">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({subjects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('GOOD')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                filter === 'GOOD' ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Safe (85%+)
            </button>
            <button
              type="button"
              onClick={() => setFilter('WARNING')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                filter === 'WARNING' ? 'bg-white text-amber-800 shadow-xs border border-amber-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              75% to 84%
            </button>
            <button
              type="button"
              onClick={() => setFilter('CRITICAL')}
              className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                filter === 'CRITICAL' ? 'bg-white text-rose-800 shadow-xs border border-rose-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shortage (&lt;75%)
            </button>
          </div>
        </div>

        {/* Empty State (UI-Skills Playbook: empty-state-cta-demo.tsx) */}
        {filteredSubjects.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="size-10 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
              <BookOpen className="size-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No courses match this filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto text-pretty">
              None of the enrolled courses fall under the selected status criteria.
            </p>
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className="mt-4 h-8 px-3 rounded-md text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all duration-150 active:scale-[0.98]"
            >
              Show all courses
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th scope="col" className="py-3 px-4">Course code</th>
                    <th scope="col" className="py-3 px-4">Course title</th>
                    <th scope="col" className="py-3 px-4">CIE evaluation</th>
                    <th scope="col" className="py-3 px-4">Attendance %</th>
                    <th scope="col" className="py-3 px-4">Progress</th>
                    <th scope="col" className="py-3 px-4 text-right">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSubjects.map(sub => (
                    <tr key={sub.course_code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {sub.course_code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-medium">
                        {sub.subject_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {sub.cie_info || 'Not recorded'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-sm font-mono tabular-nums">
                        <span className={
                          sub.attendance_percentage >= 85 ? 'text-emerald-700' :
                          sub.attendance_percentage >= 75 ? 'text-amber-700' : 'text-rose-700'
                        }>
                          {sub.attendance_percentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 w-40">
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden" aria-hidden="true">
                          <div
                            className={`h-full ${getBarColor(sub.attendance_percentage)}`}
                            style={{ width: `${sub.attendance_percentage}%` }}
                          />
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

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredSubjects.map(sub => (
                <div key={sub.course_code} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {sub.course_code}
                      </span>
                      <h3 className="text-sm font-medium text-slate-900 leading-tight mt-1.5">{sub.subject_name}</h3>
                    </div>
                    <span className={`text-base font-semibold font-mono tabular-nums shrink-0 ${
                      sub.attendance_percentage >= 85 ? 'text-emerald-700' :
                      sub.attendance_percentage >= 75 ? 'text-amber-700' : 'text-rose-700'
                    }`}>
                      {sub.attendance_percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden" aria-hidden="true">
                    <div
                      className={`h-full ${getBarColor(sub.attendance_percentage)}`}
                      style={{ width: `${sub.attendance_percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {sub.cie_info || 'CIE: N/A'}
                    </span>
                    {getStatusBadge(sub.attendance_percentage)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </section>

    </div>
  );
}
