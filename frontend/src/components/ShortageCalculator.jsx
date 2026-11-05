import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function ShortageCalculator({ overallPercentage, subjects }) {
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('ALL');

  // Baseline assumption for semester class load to estimate required sessions
  const ESTIMATED_TOTAL_CLASSES = 40;

  const currentPct = selectedSubjectCode === 'ALL'
    ? overallPercentage
    : subjects.find(s => s.course_code === selectedSubjectCode)?.attendance_percentage || overallPercentage;

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
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-5 sm:p-6 shadow-sm" aria-label="Shortage Calculator">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-sky-400" aria-hidden="true" />
          <h2 className="font-bold text-white text-sm">Attendance Forecast and Shortage Planner</h2>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 self-start sm:self-auto">
          VTU Standard: 75% Examination Minimum
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="course-select" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Course to Evaluate
          </label>
          <select
            id="course-select"
            value={selectedSubjectCode}
            onChange={(e) => setSelectedSubjectCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 min-h-[44px]"
          >
            <option value="ALL">Overall Aggregate Attendance ({overallPercentage}%)</option>
            {subjects.map(s => (
              <option key={s.course_code} value={s.course_code}>
                {s.course_code}: {s.subject_name.slice(0, 28)} ({s.attendance_percentage}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-300 mb-1.5">
            Target Eligibility Threshold
          </span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Target Percentage">
            {[75, 80, 85].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetPercentage(t)}
                className={`py-2 rounded text-xs font-bold transition border min-h-[44px] ${
                  targetPercentage === t
                    ? 'bg-sky-700 text-white border-sky-600 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {t}% Target
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outcome Banner with High Contrast */}
      <div className="rounded p-4 bg-slate-950 border border-slate-800 flex items-center gap-4">
        {currentPct >= targetPercentage ? (
          <div className="h-10 w-10 rounded bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0" aria-hidden="true">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0" aria-hidden="true">
            <AlertOctagon className="w-5 h-5" />
          </div>
        )}

        <div className="text-xs">
          {currentPct >= targetPercentage ? (
            <div>
              <p className="font-bold text-emerald-400 text-sm">
                Safe Margin: You can miss up to {canSkip} class{canSkip === 1 ? '' : 'es'}
              </p>
              <p className="text-slate-400 mt-0.5">
                Your current standing of <strong className="text-slate-200 font-tabular">{currentPct}%</strong> meets the {targetPercentage}% requirement.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-bold text-rose-400 text-sm">
                Shortage Notice: Attend the next {classesNeeded} class{classesNeeded === 1 ? '' : 'es'} consecutively
              </p>
              <p className="text-slate-400 mt-0.5">
                Required to raise attendance from <strong className="text-slate-200 font-tabular">{currentPct}%</strong> to your {targetPercentage}% goal.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
