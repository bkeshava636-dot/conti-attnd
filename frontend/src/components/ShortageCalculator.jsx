import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function ShortageCalculator({ overallPercentage, subjects }) {
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('ALL');

  // Estimate classes: Assume 40 total classes conducted so far per subject
  const ESTIMATED_TOTAL_CLASSES = 40;

  const currentPct = selectedSubjectCode === 'ALL'
    ? overallPercentage
    : subjects.find(s => s.course_code === selectedSubjectCode)?.attendance_percentage || overallPercentage;

  // Calculation:
  // Current attended = Math.round((currentPct / 100) * total)
  // To reach target T%:
  // (attended + X) / (total + X) >= T / 100
  // attended + X >= (T/100)*total + (T/100)*X
  // X * (1 - T/100) >= (T/100)*total - attended
  // X = Math.ceil(((target/100)*total - attended) / (1 - target/100))
  //
  // If current > target, can skip Y classes:
  // attended / (total + Y) >= T / 100
  // Y = Math.floor((attended / (target/100)) - total)

  const attended = Math.round((currentPct / 100) * ESTIMATED_TOTAL_CLASSES);
  let classesNeeded = 0;
  let canSkip = 0;

  if (currentPct < targetPercentage) {
    const denom = 1 - (targetPercentage / 100);
    const num = (targetPercentage / 100) * ESTIMATED_TOTAL_CLASSES - attended;
    classesNeeded = Math.max(0, Math.ceil(num / denom));
  } else {
    canSkip = Math.max(0, Math.floor((attended / (targetPercentage / 100)) - ESTIMATED_TOTAL_CLASSES));
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-sky-400" />
          <h3 className="font-bold text-white text-sm">Attendance Target & Shortage Planner</h3>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
          VTU Standard Rule: 75% Min / 85% Safe
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Select Subject</label>
          <select
            value={selectedSubjectCode}
            onChange={(e) => setSelectedSubjectCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">Overall Attendance Aggregate</option>
            {subjects.map(s => (
              <option key={s.course_code} value={s.course_code}>
                {s.course_code} - {s.subject_name.slice(0, 24)} ({s.attendance_percentage}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Target Threshold</label>
          <div className="flex gap-2">
            {[75, 80, 85].map(t => (
              <button
                key={t}
                onClick={() => setTargetPercentage(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  targetPercentage === t
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {t}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="rounded-lg p-4 bg-slate-950/60 border border-slate-800/80 flex items-center gap-4">
        {currentPct >= targetPercentage ? (
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}

        <div className="text-xs">
          {currentPct >= targetPercentage ? (
            <div>
              <p className="font-bold text-emerald-400 text-sm">
                Safe Margin! You can miss up to <span className="underline font-black">{canSkip} class{canSkip === 1 ? '' : 'es'}</span>
              </p>
              <p className="text-slate-400 mt-0.5">
                Your current standing of <strong className="text-white">{currentPct}%</strong> exceeds your {targetPercentage}% requirement.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-rose-400 text-sm">
                Shortage Alert! You must attend next <span className="underline font-black">{classesNeeded} class{classesNeeded === 1 ? '' : 'es'}</span> consecutively
              </p>
              <p className="text-slate-400 mt-0.5">
                To bridge the deficit from <strong className="text-white">{currentPct}%</strong> up to your target of <strong className="text-white">{targetPercentage}%</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
