import React, { useState, useEffect } from 'react';
import { 
  Users, 
  History, 
  Download, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

export default function ProctorDashboard({ onSelectStudent }) {
  const [roster, setRoster] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'imports'

  useEffect(() => {
    loadProctorData();
  }, []);

  async function loadProctorData() {
    setLoading(true);
    try {
      const [rosterRes, importsRes] = await Promise.all([
        fetch('/api/proctor/roster').then(r => r.json()),
        fetch('/api/proctor/imports').then(r => r.json())
      ]);

      if (rosterRes.roster) setRoster(rosterRes.roster);
      if (importsRes.imports) setImports(importsRes.imports);
    } catch (err) {
      console.error('Failed to load proctor data:', err);
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
    a.download = `BITM_CSE_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Proctor Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              Proctor Administration Roster
            </span>
            <span className="text-xs text-slate-400 font-mono">Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Dr. B. K. Sharma (Counselling Batch)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ballari Institute of Technology & Management • Department of Computer Science & Engineering
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          
          <a
            href="/fixture"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Contineo Simulator</span>
          </a>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Total Assigned Students</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white">{roster.length}</div>
          <div className="text-xs text-slate-400 mt-1">100% Synced from SIMS</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Batch Average</span>
            <CheckCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-400">{batchAvg}%</div>
          <div className="text-xs text-slate-400 mt-1">Mean across all courses</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Safe Standing (≥85%)</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{goodCount}</div>
          <div className="text-xs text-slate-400 mt-1">Eligible without condonation</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-2">
            <span>Critical Shortage (&lt;75%)</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-3xl font-black ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {criticalCount}
          </div>
          <div className="text-xs text-rose-300 mt-1">Immediate counselling advised</div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'roster'
              ? 'border-indigo-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Roster ({roster.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('imports')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'imports'
              ? 'border-indigo-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Sync & Extraction Audit Log ({imports.length})</span>
        </button>
      </div>

      {/* Roster Tab View */}
      {activeTab === 'roster' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name or USN..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {['ALL', 'GOOD', 'WARNING', 'CRITICAL'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition ${
                    statusFilter === st ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'GOOD' ? '≥85%' : st === 'WARNING' ? '75-84%' : '<75%'}
                </button>
              ))}
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">USN</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Attendance %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredRoster.map(st => (
                  <tr key={st.usn} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-sky-400">{st.usn}</td>
                    <td className="py-3 px-4 text-white font-semibold">{st.name}</td>
                    <td className="py-3 px-4 text-slate-400">{st.semester}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold text-sm ${
                        st.overall_percentage >= 85 ? 'text-emerald-400' :
                        st.overall_percentage >= 75 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {st.overall_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        st.overall_percentage >= 85 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        st.overall_percentage >= 75 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectStudent(st.usn)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                        title="View Full Attendance Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Imports Tab View */}
      {activeTab === 'imports' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg p-5">
          <h2 className="text-base font-bold text-white mb-1">One-Click Extraction Audit Trail</h2>
          <p className="text-xs text-slate-400 mb-4">Complete log of automated sync actions triggered via the Contineo Extension</p>

          <div className="space-y-3">
            {imports.map((imp, idx) => (
              <div key={imp.id || idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{imp.id}</span>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {imp.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Proctor: <strong className="text-slate-300">{imp.proctor_id}</strong> • Period: <strong className="text-slate-300">{imp.academic_period}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-right">
                  <div>
                    <div className="text-slate-400">Students Synced</div>
                    <div className="text-sm font-bold text-white">{imp.successful_records} / {imp.total_students}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Timestamp</div>
                    <div className="font-mono text-slate-300">{new Date(imp.imported_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
