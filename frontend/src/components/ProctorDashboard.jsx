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
  Eye
} from 'lucide-react';

export default function ProctorDashboard({ onSelectStudent, proctorToken, onRequireAuth }) {
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
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Proctor Header Banner */}
      <section className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-sky-400 bg-sky-950 border border-sky-900 px-2 py-0.5 rounded">
              Proctor Administration Roster
            </span>
            <span className="text-xs text-slate-400 font-mono">Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Faculty Counselling Roster</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ballari Institute of Technology &amp; Management • Department of Computer Science &amp; Engineering
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded border border-slate-700 transition min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>Export Roster CSV</span>
          </button>
          
          <a
            href="/fixture"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold rounded transition min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            <span>Contineo Simulator</span>
          </a>
        </div>
      </section>

      {/* Aggregate Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Cohort Statistics">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Assigned Students</span>
            <Users className="w-4 h-4 text-sky-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-white font-tabular">{roster.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Synchronized via Contineo SIMS</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Batch Mean Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-sky-400 font-tabular">{batchAvg}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Cohort average across all courses</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Safe Standing (85%+)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-tabular">{goodCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Eligible without condonation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1.5">
            <span>Attendance Shortage (&lt;75%)</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" aria-hidden="true" />
          </div>
          <div className={`text-2xl font-bold font-tabular ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {criticalCount}
          </div>
          <div className="text-[11px] text-rose-300 mt-1">Counselling review advised</div>
        </div>

      </section>

      {/* Tabs */}
      <div className="flex border-b border-slate-800" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'roster'}
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition min-h-[44px] ${
            activeTab === 'roster'
              ? 'border-sky-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          <span>Student Roster ({roster.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'imports'}
          onClick={() => setActiveTab('imports')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition min-h-[44px] ${
            activeTab === 'imports'
              ? 'border-sky-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" aria-hidden="true" />
          <span>Extraction Audit Log ({imports.length})</span>
        </button>
      </div>

      {/* Roster Tab View */}
      {activeTab === 'roster' && (
        <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm" aria-label="Student Roster">
          
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" aria-hidden="true" />
              <label htmlFor="roster-search" className="sr-only">Search student by name or USN</label>
              <input
                id="roster-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student by name or USN..."
                className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto" role="group" aria-label="Roster Filter">
              {['ALL', 'GOOD', 'WARNING', 'CRITICAL'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-2 rounded text-xs font-semibold transition min-h-[44px] ${
                    statusFilter === st ? 'bg-sky-700 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'GOOD' ? '85%+' : st === 'WARNING' ? '75% to 84%' : '<75%'}
                </button>
              ))}
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th scope="col" className="py-3 px-4">USN</th>
                  <th scope="col" className="py-3 px-4">Student Name</th>
                  <th scope="col" className="py-3 px-4">Semester</th>
                  <th scope="col" className="py-3 px-4">Attendance %</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredRoster.map(st => (
                  <tr key={st.usn} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">{st.usn}</td>
                    <td className="py-3.5 px-4 text-white font-semibold">{st.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{st.semester}</td>
                    <td className="py-3.5 px-4 font-bold text-sm font-tabular">
                      <span className={
                        st.overall_percentage >= 85 ? 'text-emerald-400' :
                        st.overall_percentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                      }>
                        {st.overall_percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        st.overall_percentage >= 85 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        st.overall_percentage >= 75 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectStudent(st.usn)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                        title={`Inspect attendance record for ${st.name}`}
                        aria-label={`Inspect attendance record for ${st.name}`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
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
        <section className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm p-5" aria-label="Audit Log">
          <h2 className="text-base font-bold text-white mb-1">Extraction Audit Trail</h2>
          <p className="text-xs text-slate-400 mb-4">Log of automated sync actions triggered via Contineo Attendance Collector</p>

          <div className="space-y-3">
            {imports.map((imp, idx) => (
              <div key={imp.id || idx} className="bg-slate-950 border border-slate-800 rounded p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{imp.id}</span>
                    <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                      {imp.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Proctor: <strong className="text-slate-300">{imp.proctor_id}</strong> | Academic Period: <strong className="text-slate-300">{imp.academic_period}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-right">
                  <div>
                    <div className="text-slate-400">Records Synced</div>
                    <div className="text-sm font-bold text-white font-tabular">{imp.successful_records} of {imp.total_students}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Timestamp</div>
                    <div className="font-mono text-slate-300">{new Date(imp.imported_at).toLocaleString()}</div>
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
