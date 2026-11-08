import React, { useState, useEffect } from 'react';
import { 
  Users, 
  History, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Eye,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function ProctorDashboard({ onSelectStudent, proctorToken, onRequireAuth, onNotify }) {
  const [roster, setRoster] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'SAFE' | 'SHORTAGE'
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'imports'

  useEffect(() => {
    loadProctorData();
  }, [proctorToken]);

  async function loadProctorData() {
    setLoading(true);
    try {
      if (!proctorToken) {
        onRequireAuth?.();
        return;
      }

      const authHeaders = {
        'Authorization': `Bearer ${proctorToken}`
      };

      const [rosterRes, importsRes] = await Promise.all([
        fetch('/api/proctor/roster', { headers: authHeaders }).then(async r => {
          if (r.status === 401 || r.status === 403) throw new Error('AUTH_REQUIRED');
          return r.json();
        }),
        fetch('/api/proctor/imports', { headers: authHeaders }).then(async r => {
          if (r.status === 401 || r.status === 403) throw new Error('AUTH_REQUIRED');
          return r.json();
        })
      ]);

      if (rosterRes.roster) setRoster(rosterRes.roster);
      if (importsRes.imports) setImports(importsRes.imports);
    } catch (err) {
      console.error('Failed to load proctor data:', err);
      if (err.message === 'AUTH_REQUIRED') {
        onRequireAuth?.();
      }
    } finally {
      setLoading(false);
    }
  }

  // Filter roster
  const filteredRoster = roster.filter(st => {
    const matchesSearch = st.name.toLowerCase().includes(search.toLowerCase()) || 
                          st.usn.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'SAFE') return st.all_courses_safe;
    if (statusFilter === 'SHORTAGE') return st.status !== 'NO_DATA' && !st.all_courses_safe;
    return true;
  });

  const allSafeCount = roster.filter(s => s.all_courses_safe).length;
  const shortageCount = roster.filter(s => s.status !== 'NO_DATA' && !s.all_courses_safe).length;

  const exportCSV = () => {
    const headers = "USN,Name,Semester,Course_Standing,Shortage_Courses_Count,Shortage_Subjects_List\n";
    const rows = roster.map(s => {
      const shortageList = (s.shortage_subjects || [])
        .map(sub => `${sub.course_code}: ${sub.percentage}%`)
        .join('; ');
      return `"${s.usn}","${s.name}","${s.semester}","${s.all_courses_safe ? 'ALL_SAFE' : 'HAS_SHORTAGE'}",${s.shortage_count || 0},"${shortageList || 'None'}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BITM_Course_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onNotify?.('Exported course attendance roster to CSV');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Proctor Header Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
              Faculty counselling roster
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight text-balance">
            Proctor Administration Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ballari Institute of Technology &amp; Management • Per-Course 85% Attendance Compliance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 h-9 px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            <FileSpreadsheet className="size-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <span>Export roster CSV</span>
          </button>
          
          <a
            href="/fixture"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 h-9 px-3.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs transition-all duration-150 active:scale-[0.98]"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span>Contineo simulator</span>
          </a>
        </div>
      </section>

      {/* Aggregate Metric Cards (Per-Course Focused) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Cohort statistics">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Enrolled cohort</span>
            <Users className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">{roster.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified via Contineo SIMS</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>All courses safe (85%+)</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">{allSafeCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Zero shortage across all subjects</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Students with shortage</span>
            <AlertCircle className={`size-4 ${shortageCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} aria-hidden="true" />
          </div>
          <div className={`text-2xl font-semibold font-mono tabular-nums ${shortageCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400'}`}>
            {shortageCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">At least 1 course &lt;85%</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Evaluation rule</span>
            <ShieldCheck className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">85% Minimum</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mandatory per individual course</div>
        </div>

      </section>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'roster'}
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-150 ${
            activeTab === 'roster'
              ? 'border-slate-900 dark:border-blue-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="size-3.5" aria-hidden="true" />
          <span>Student roster ({roster.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'imports'}
          onClick={() => setActiveTab('imports')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-150 ${
            activeTab === 'imports'
              ? 'border-slate-900 dark:border-blue-500 text-slate-900 dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="size-3.5" aria-hidden="true" />
          <span>Extraction audit log ({imports.length})</span>
        </button>
      </div>

      {/* Roster Tab View */}
      {activeTab === 'roster' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors" aria-label="Student roster">
          
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="size-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
              <label htmlFor="roster-search" className="sr-only">Search student by name or USN</label>
              <input
                id="roster-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student by name or USN..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 h-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-blue-500/20 focus:border-slate-900 dark:focus:border-blue-500 transition-all font-mono"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-full sm:w-auto" role="group" aria-label="Roster filters">
              {[
                { id: 'ALL', label: `All (${roster.length})` },
                { id: 'SAFE', label: `All Safe (${allSafeCount})` },
                { id: 'SHORTAGE', label: `Has Shortage (${shortageCount})` }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all duration-150 active:scale-[0.98] ${
                    statusFilter === st.id 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-700' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roster Table (Per-Course Standing) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th scope="col" className="py-3 px-4">USN</th>
                  <th scope="col" className="py-3 px-4">Student name</th>
                  <th scope="col" className="py-3 px-4">Semester</th>
                  <th scope="col" className="py-3 px-4">Course Standing</th>
                  <th scope="col" className="py-3 px-4">Shortage Subjects (&lt;85%)</th>
                  <th scope="col" className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRoster.map(st => (
                  <tr key={st.usn} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">{st.usn}</td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-medium">{st.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{st.semester}</td>
                    <td className="py-3.5 px-4">
                      {st.status === 'NO_DATA' || st.total_subjects === 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <span>No subjects recorded</span>
                        </span>
                      ) : st.all_courses_safe ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                          <span>All Courses Safe</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70">
                          <AlertTriangle className="size-3 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
                          <span>Shortage in {st.shortage_count} {st.shortage_count === 1 ? 'course' : 'courses'}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.all_courses_safe ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">None (All &ge;85%)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {(st.shortage_subjects || []).map((sub, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100/70 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70"
                            >
                              <span>{sub.course_code}:</span>
                              <span className="tabular-nums">{sub.percentage}%</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(st.usn)}
                        className="size-8 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors inline-flex items-center justify-center"
                        title={`Inspect attendance record for ${st.name}`}
                        aria-label={`Inspect attendance record for ${st.name}`}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>
      )}

      {/* Imports Tab View */}
      {activeTab === 'imports' && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs p-5 sm:p-6 transition-colors" aria-label="Audit log">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Extraction audit trail</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Log of automated sync actions triggered via Contineo Attendance Collector</p>

          <div className="space-y-3">
            {imports.map((imp, idx) => (
              <div key={imp.id || idx} className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{imp.id}</span>
                    <span className="text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md">
                      {imp.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Proctor: <strong className="text-slate-700 dark:text-slate-300">{imp.proctor_id}</strong> | Academic period: <strong className="text-slate-700 dark:text-slate-300">{imp.academic_period}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-right">
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Records synced</div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono tabular-nums">{imp.successful_records} of {imp.total_students}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Timestamp</div>
                    <div className="font-mono text-slate-600 dark:text-slate-300">{new Date(imp.imported_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
