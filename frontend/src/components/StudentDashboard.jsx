import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Clock, 
  Building2,
  Search, 
  ArrowUpDown, 
  Copy, 
  Check,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function StudentDashboard({ data, onRefresh, onNotify, darkMode }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SHORTAGE' | 'SAFE'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('LOWEST'); // 'LOWEST' | 'HIGHEST' | 'CODE' | 'NAME'
  const [copiedUSN, setCopiedUSN] = useState(false);

  const student = data?.student;
  const subjects = data?.subjects || [];

  // Shortage calculation: in BITM, any course < 85% is in shortage
  const shortageSubjects = useMemo(() => subjects.filter(s => Number(s.attendance_percentage) < 85), [subjects]);
  const safeSubjects = useMemo(() => subjects.filter(s => Number(s.attendance_percentage) >= 85), [subjects]);
  const shortageCount = shortageSubjects.length;
  const allCoursesSafe = subjects.length > 0 && shortageCount === 0;

  // Filter & Sort courses (unconditional hook)
  const processedSubjects = useMemo(() => {
    if (!subjects.length) return [];
    return subjects
      .filter(sub => {
        const pct = Number(sub.attendance_percentage) || 0;
        // Status filter
        if (filter === 'SHORTAGE' && pct >= 85) return false;
        if (filter === 'SAFE' && pct < 85) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = sub.course_code.toLowerCase().includes(q);
          const matchName = sub.subject_name.toLowerCase().includes(q);
          if (!matchCode && !matchName) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'LOWEST') return a.attendance_percentage - b.attendance_percentage;
        if (sortBy === 'HIGHEST') return b.attendance_percentage - a.attendance_percentage;
        if (sortBy === 'CODE') return a.course_code.localeCompare(b.course_code);
        if (sortBy === 'NAME') return a.subject_name.localeCompare(b.subject_name);
        return 0;
      });
  }, [subjects, filter, searchQuery, sortBy]);

  if (!data || !student) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs">
        <p className="text-slate-500 dark:text-slate-400 text-sm">No verified attendance record loaded.</p>
      </div>
    );
  }

  const handleCopyUSN = () => {
    navigator.clipboard.writeText(student.usn);
    setCopiedUSN(true);
    onNotify?.(`USN ${student.usn} copied to clipboard`);
    setTimeout(() => setCopiedUSN(false), 2000);
  };

  const initials = student.name
    ? student.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('')
    : 'ST';

  // Status Badge with High-Contrast Colors
  const getStatusBadge = (pct) => {
    if (pct >= 85) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
          <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-500/20" aria-hidden="true" />
          Safe (85%+)
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
          <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400 ring-2 ring-amber-500/20" aria-hidden="true" />
          Shortage (75-84%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70">
        <span className="size-1.5 rounded-full bg-rose-600 dark:bg-rose-400 ring-2 ring-rose-500/20" aria-hidden="true" />
        Critical Shortage (&lt;75%)
      </span>
    );
  };

  const getBarColor = (pct) => {
    if (pct >= 85) return 'bg-emerald-500 dark:bg-emerald-400';
    if (pct >= 75) return 'bg-amber-500 dark:bg-amber-400';
    return 'bg-rose-500 dark:bg-rose-400';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Student Dossier Header Banner (Per-Course Focused, No Overall %) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* Identity & Metadata */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="size-14 rounded-2xl bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-semibold text-lg tracking-wider shrink-0 shadow-xs">
              {initials}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  {student.department}
                </span>
                <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                  {student.semester || 'SEM03'}
                </span>
                <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                  Verified SIMS record
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight text-balance">
                {student.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono font-medium">
                  <span>USN: {student.usn}</span>
                  <button
                    type="button"
                    onClick={handleCopyUSN}
                    className="text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors ml-0.5"
                    title="Copy USN"
                    aria-label="Copy USN"
                  >
                    {copiedUSN ? <Check className="size-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3" />}
                  </button>
                </div>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="size-3.5 text-slate-400" aria-hidden="true" />
                  Synced: {student.updated_at ? new Date(student.updated_at).toLocaleString() : 'Recently'}
                </span>
              </div>
            </div>
          </div>

          {/* Per-Course Standing Card (Replaces Overall %) */}
          <div className="flex items-center gap-4 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 self-start md:self-auto shrink-0 transition-colors">
            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
              allCoursesSafe 
                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
            }`}>
              {allCoursesSafe ? (
                <ShieldCheck className="size-6" aria-hidden="true" />
              ) : (
                <AlertCircle className="size-6" aria-hidden="true" />
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Course Status
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {allCoursesSafe ? 'All Courses Safe' : `Shortage in ${shortageCount} ${shortageCount === 1 ? 'Course' : 'Courses'}`}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                {allCoursesSafe 
                  ? 'All registered subjects are at 85% or above' 
                  : 'Requires attendance improvement below 85%'}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4 Metric Cards Strip (Per-Course Focused) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Course statistics">
        
        {/* Metric 1: Course Standing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Course standing</span>
            <ShieldCheck className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${allCoursesSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {allCoursesSafe ? 'All Safe' : `${shortageCount} Alert`}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">BITM rule: 85% per individual course</p>
        </div>

        {/* Metric 2: Shortage Courses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Shortage courses (&lt;85%)</span>
            <AlertTriangle className={`size-4 ${shortageCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} aria-hidden="true" />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${shortageCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {shortageCount} {shortageCount === 1 ? 'course' : 'courses'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {shortageCount === 0 ? 'All courses satisfy 85% minimum' : 'Below 85% attendance requirement'}
          </p>
        </div>

        {/* Metric 3: Safe Courses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Safe courses (85%+)</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {safeSubjects.length} of {subjects.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Exam eligible subjects</p>
        </div>

        {/* Metric 4: Source System */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Source system</span>
            <Building2 className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">Contineo SIMS</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live synchronized portal data</p>
        </div>

      </section>

      {/* Course Breakdown Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors">
        
        {/* Table Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Course-wise attendance records</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Subject attendance percentages with 85% minimum cutoff</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Live Search */}
            <div className="relative">
              <Search className="size-3.5 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code or subject..."
                className="w-full sm:w-56 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 h-9 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all font-mono"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 h-9">
              <ArrowUpDown className="size-3 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
              >
                <option value="LOWEST" className="dark:bg-slate-900">Lowest attendance first</option>
                <option value="HIGHEST" className="dark:bg-slate-900">Highest attendance first</option>
                <option value="CODE" className="dark:bg-slate-900">Course code (A-Z)</option>
                <option value="NAME" className="dark:bg-slate-900">Subject name (A-Z)</option>
              </select>
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 self-start sm:self-auto" role="group" aria-label="Course filters">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                  filter === 'ALL' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({subjects.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('SHORTAGE')}
                className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                  filter === 'SHORTAGE' 
                    ? 'bg-white dark:bg-rose-950 text-rose-800 dark:text-rose-300 shadow-xs border border-rose-200 dark:border-rose-800' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Shortage &lt;85% ({shortageCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('SAFE')}
                className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                  filter === 'SAFE' 
                    ? 'bg-white dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shadow-xs border border-emerald-200 dark:border-emerald-800' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Safe 85%+ ({safeSubjects.length})
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {processedSubjects.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mx-auto flex items-center justify-center mb-3">
              <BookOpen className="size-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No courses match criteria</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try modifying your search query or reset the filter to view all enrolled courses.
            </p>
            <button
              type="button"
              onClick={() => { setFilter('ALL'); setSearchQuery(''); }}
              className="mt-4 h-8 px-3 rounded-md text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 transition-all duration-150 active:scale-[0.98]"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="py-3 px-4">Course code</th>
                    <th scope="col" className="py-3 px-4">Course title</th>
                    <th scope="col" className="py-3 px-4">Attendance %</th>
                    <th scope="col" className="py-3 px-4 text-right">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {processedSubjects.map(sub => (
                    <tr key={sub.course_code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        {sub.course_code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-200 font-medium">
                        {sub.subject_name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-sm font-mono tabular-nums">
                        <span className={
                          sub.attendance_percentage >= 85 ? 'text-emerald-700 dark:text-emerald-400' :
                          sub.attendance_percentage >= 75 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                        }>
                          {sub.attendance_percentage}%
                        </span>
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
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {processedSubjects.map(sub => (
                <div key={sub.course_code} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {sub.course_code}
                      </span>
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white leading-tight mt-1">{sub.subject_name}</h3>
                    </div>
                    <span className={`text-base font-bold font-mono tabular-nums shrink-0 ${
                      sub.attendance_percentage >= 85 ? 'text-emerald-700 dark:text-emerald-400' :
                      sub.attendance_percentage >= 75 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>
                      {sub.attendance_percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden" aria-hidden="true">
                    <div
                      className={`h-full ${getBarColor(sub.attendance_percentage)}`}
                      style={{ width: `${sub.attendance_percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">85% BITM Cutoff</span>
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
