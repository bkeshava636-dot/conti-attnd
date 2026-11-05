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
    <section className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs" aria-label="Shortage calculator">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-slate-700" aria-hidden="true" />
          <h2 className="font-semibold text-slate-900 text-sm">Attendance forecast and shortage recovery planner</h2>
        </div>
        <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 self-start sm:self-auto font-mono">
          VTU Standard: 75% exam minimum
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="course-select" className="block text-xs font-medium text-slate-700 mb-1.5">
            Select course to evaluate
          </label>
          <select
            id="course-select"
            value={selectedSubjectCode}
            onChange={(e) => setSelectedSubjectCode(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 h-9 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          >
            <option value="ALL">Overall aggregate attendance ({overallPercentage}%)</option>
            {subjects.map(s => (
              <option key={s.course_code} value={s.course_code}>
                {s.course_code}: {s.subject_name.slice(0, 30)} ({s.attendance_percentage}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs font-medium text-slate-700 mb-1.5">
            Target eligibility threshold
          </span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Target percentage">
            {[75, 80, 85].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetPercentage(t)}
                className={`h-9 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] border ${
                  targetPercentage === t
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t}% target
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      <div className={`rounded-lg p-4 border flex items-center gap-4 ${
        currentPct >= targetPercentage 
          ? 'bg-emerald-50/60 border-emerald-200/80' 
          : 'bg-rose-50/60 border-rose-200/80'
      }`}>
        {currentPct >= targetPercentage ? (
          <div className="size-9 rounded-lg bg-emerald-100 border border-emerald-300/80 flex items-center justify-center text-emerald-800 shrink-0" aria-hidden="true">
            <CheckCircle2 className="size-5" />
          </div>
        ) : (
          <div className="size-9 rounded-lg bg-rose-100 border border-rose-300/80 flex items-center justify-center text-rose-800 shrink-0" aria-hidden="true">
            <AlertOctagon className="size-5" />
          </div>
        )}

        <div className="text-xs">
          {currentPct >= targetPercentage ? (
            <div>
              <p className="font-semibold text-emerald-900 text-sm">
                Safe buffer: You can miss up to {canSkip} class{canSkip === 1 ? '' : 'es'}
              </p>
              <p className="text-emerald-700 mt-0.5">
                Your current standing of <strong className="font-mono tabular-nums">{currentPct}%</strong> meets the {targetPercentage}% requirement.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-rose-900 text-sm">
                Recovery plan: Attend the next {classesNeeded} class{classesNeeded === 1 ? '' : 'es'} consecutively
              </p>
              <p className="text-rose-700 mt-0.5">
                Required to lift current attendance from <strong className="font-mono tabular-nums">{currentPct}%</strong> to your {targetPercentage}% goal.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
