import React, { useState, useEffect } from 'react';
import { 
  Users, 
  History, 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ExternalLink,
  Eye,
  RefreshCw
} from 'lucide-react';

export default function ProctorDashboard({ onSelectStudent, proctorToken, onRequireAuth, onNotify }) {
  const [roster, setRoster] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
    if (statusFilter === 'CRITICAL') return st.overall_percentage < 75;
    if (statusFilter === 'WARNING') return st.overall_percentage >= 75 && st.overall_percentage < 85;
    if (statusFilter === 'GOOD') return st.overall_percentage >= 85;
    return true;
  });

  const batchAvg = roster.length > 0
    ? Math.round((roster.reduce((sum, s) => sum + s.overall_percentage, 0) / roster.length) * 10) / 10
    : 0;

  const criticalCount = roster.filter(s => s.overall_percentage < 75).length;
  const goodCount = roster.filter(s => s.overall_percentage >= 85).length;

  const exportCSV = () => {
    const headers = "USN,Name,Semester,Overall_Attendance,Status\n";
    const rows = roster.map(s => `"${s.usn}","${s.name}","${s.semester}",${s.overall_percentage}%,${s.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BITM_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    onNotify?.('Exported cohort roster to CSV');
  };

  const getStatusBadge = (pct) => {
    if (pct >= 85) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70">
          <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 ring-2 ring-emerald-500/20" aria-hidden="true" />
          Safe (85%+)
        </span>
      );
    }
    if (pct >= 75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70">
          <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400 ring-2 ring-amber-500/20" aria-hidden="true" />
          Eligible (75-84%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70">
        <span className="size-1.5 rounded-full bg-rose-600 dark:bg-rose-400 ring-2 ring-rose-500/20" aria-hidden="true" />
        Shortage (&lt;75%)
      </span>
    );
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
            Ballari Institute of Technology &amp; Management • Department of Computer Science &amp; Engineering
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

      {/* Aggregate Metric Cards */}
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
            <span>Batch average</span>
            <CheckCircle2 className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white font-mono tabular-nums">{batchAvg}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cohort mean attendance</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Safe standing (85%+)</span>
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">{goodCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Exam eligible without condonation</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs transition-colors">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span>Attendance shortage (&lt;75%)</span>
            <AlertOctagon className="size-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          </div>
          <div className={`text-2xl font-semibold font-mono tabular-nums ${criticalCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400'}`}>
            {criticalCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Counselling review advised</div>
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
                { id: 'GOOD', label: '85%+' },
                { id: 'WARNING', label: '75% to 84%' },
                { id: 'CRITICAL', label: '<75%' }
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

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th scope="col" className="py-3 px-4">USN</th>
                  <th scope="col" className="py-3 px-4">Student name</th>
                  <th scope="col" className="py-3 px-4">Semester</th>
                  <th scope="col" className="py-3 px-4">Attendance %</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredRoster.map(st => (
                  <tr key={st.usn} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 dark:text-slate-200">{st.usn}</td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-medium">{st.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono">{st.semester}</td>
                    <td className="py-3.5 px-4 font-semibold text-sm font-mono tabular-nums">
                      <span className={
                        st.overall_percentage >= 85 ? 'text-emerald-700 dark:text-emerald-400' :
                        st.overall_percentage >= 75 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                      }>
                        {st.overall_percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(st.overall_percentage)}
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
