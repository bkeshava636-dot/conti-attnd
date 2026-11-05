import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertOctagon, RotateCcw } from 'lucide-react';

export default function ShortageCalculator({ overallPercentage, subjects, darkMode }) {
  const [targetPercentage, setTargetPercentage] = useState(85);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('ALL');
  const [simulatedAttendedDelta, setSimulatedAttendedDelta] = useState(0);
  const [simulatedMissedDelta, setSimulatedMissedDelta] = useState(0);

  // Baseline assumption for semester class load
  const ESTIMATED_TOTAL_CLASSES = 40;

  const currentSubject = subjects.find(s => s.course_code === selectedSubjectCode);
  const basePct = selectedSubjectCode === 'ALL'
    ? overallPercentage
    : currentSubject?.attendance_percentage || overallPercentage;

  const currentAttended = Math.round((basePct / 100) * ESTIMATED_TOTAL_CLASSES);

  // Simulation calculations
  const simulatedAttended = Math.max(0, currentAttended + simulatedAttendedDelta);
  const simulatedTotal = ESTIMATED_TOTAL_CLASSES + simulatedAttendedDelta + simulatedMissedDelta;
  const projectedPct = Math.min(100, Math.max(0, Math.round((simulatedAttended / simulatedTotal) * 1000) / 10));

  // Required consecutive classes to reach target
  let classesNeeded = 0;
  let canSkip = 0;

  if (basePct < targetPercentage) {
    const denom = 1 - (targetPercentage / 100);
    const num = (targetPercentage / 100) * ESTIMATED_TOTAL_CLASSES - currentAttended;
    classesNeeded = Math.max(0, Math.ceil(num / denom));
  } else {
    canSkip = Math.max(0, Math.floor((currentAttended / (targetPercentage / 100)) - ESTIMATED_TOTAL_CLASSES));
  }

  const resetSimulation = () => {
    setSimulatedAttendedDelta(0);
    setSimulatedMissedDelta(0);
  };

  const isSimulating = simulatedAttendedDelta !== 0 || simulatedMissedDelta !== 0;

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-colors" aria-label="Attendance forecast tool">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-slate-100/60 dark:from-slate-800/40 to-transparent pointer-events-none rounded-tr-2xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-800 gap-3 relative">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Calculator className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">Attendance Forecast &amp; Recovery Calculator</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Calculate recovery sessions and safe margin thresholds</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isSimulating && (
            <button
              type="button"
              onClick={resetSimulation}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="size-3" />
              <span>Reset what-if</span>
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            BITM minimum: 85%
          </span>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Subject Select */}
        <div>
          <label htmlFor="forecast-course-select" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Course to evaluate
          </label>
          <select
            id="forecast-course-select"
            value={selectedSubjectCode}
            onChange={(e) => {
              setSelectedSubjectCode(e.target.value);
              resetSimulation();
            }}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 h-10 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-blue-500/20 focus:border-slate-900 dark:focus:border-blue-500 transition-all shadow-xs"
          >
            <option value="ALL">Overall aggregate attendance ({overallPercentage}%)</option>
            {subjects.map(s => (
              <option key={s.course_code} value={s.course_code} className="dark:bg-slate-900">
                {s.course_code}: {s.subject_name.slice(0, 32)} ({s.attendance_percentage}%)
              </option>
            ))}
          </select>
        </div>

        {/* Target Percentage Chips */}
        <div>
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Target percentage goal
          </span>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Target percentage">
            {[75, 80, 85, 90].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetPercentage(t)}
                className={`h-10 rounded-lg text-xs font-medium transition-all duration-150 active:scale-[0.98] border font-mono ${
                  targetPercentage === t
                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t}% {t === 85 ? '(BITM)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {/* Metric 1: Current vs Target */}
        <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Current standing vs goal</div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
              {basePct}%
            </span>
            <span className="text-xs text-slate-400">towards</span>
            <span className="text-base font-semibold font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {targetPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className={`h-full ${basePct >= targetPercentage ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'}`}
              style={{ width: `${Math.min(100, (basePct / targetPercentage) * 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Prescriptive Action */}
        <div className={`rounded-xl p-4 border ${
          basePct >= targetPercentage 
            ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60' 
            : 'bg-rose-50/70 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60'
        }`}>
          <div className="flex items-start gap-3">
            {basePct >= targetPercentage ? (
              <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="size-4" />
              </div>
            ) : (
              <div className="size-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                <AlertOctagon className="size-4" />
              </div>
            )}
            <div>
              {basePct >= targetPercentage ? (
                <>
                  <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                    Safe Margin: Can skip {canSkip} class{canSkip === 1 ? '' : 'es'}
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-0.5 text-pretty">
                    You can miss up to {canSkip} class{canSkip === 1 ? '' : 'es'} consecutively and still remain at or above {targetPercentage}%.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                    Recovery: Attend next {classesNeeded} class{classesNeeded === 1 ? '' : 'es'}
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-0.5 text-pretty">
                    Must attend {classesNeeded} continuous session{classesNeeded === 1 ? '' : 's'} without absence to clear the {targetPercentage}% requirement.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive "What-If" Simulation Playground */}
      <div className="bg-slate-50/80 dark:bg-slate-950/80 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            Interactive simulation: test upcoming attendance scenarios
          </span>
          {isSimulating && (
            <span className="text-xs font-mono font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded">
              Projected: {projectedPct}% ({projectedPct >= basePct ? `+${(projectedPct - basePct).toFixed(1)}%` : `${(projectedPct - basePct).toFixed(1)}%`})
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Attending Classes Stepper */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">If I attend upcoming classes</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Adds attended and total sessions</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimulatedAttendedDelta(Math.max(0, simulatedAttendedDelta - 1))}
                disabled={simulatedAttendedDelta === 0}
                className="size-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center font-bold text-sm"
              >
                -
              </button>
              <span className="font-mono tabular-nums text-xs font-semibold w-6 text-center text-slate-900 dark:text-white">
                +{simulatedAttendedDelta}
              </span>
              <button
                type="button"
                onClick={() => setSimulatedAttendedDelta(simulatedAttendedDelta + 1)}
                className="size-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Missing Classes Stepper */}
          <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">If I miss upcoming classes</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Adds held sessions without attendance</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSimulatedMissedDelta(Math.max(0, simulatedMissedDelta - 1))}
                disabled={simulatedMissedDelta === 0}
                className="size-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center justify-center font-bold text-sm"
              >
                -
              </button>
              <span className="font-mono tabular-nums text-xs font-semibold w-6 text-center text-slate-900 dark:text-white">
                +{simulatedMissedDelta}
              </span>
              <button
                type="button"
                onClick={() => setSimulatedMissedDelta(simulatedMissedDelta + 1)}
                className="size-7 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Quick Scenario Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Quick test:</span>
          <button
            type="button"
            onClick={() => { setSimulatedAttendedDelta(0); setSimulatedMissedDelta(2); }}
            className="text-[11px] h-6 px-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Miss tomorrow (2 classes)
          </button>
          <button
            type="button"
            onClick={() => { setSimulatedAttendedDelta(5); setSimulatedMissedDelta(0); }}
            className="text-[11px] h-6 px-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Attend full week (+5)
          </button>
          <button
            type="button"
            onClick={() => { setSimulatedAttendedDelta(10); setSimulatedMissedDelta(0); }}
            className="text-[11px] h-6 px-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Attend two weeks (+10)
          </button>
        </div>
      </div>
    </section>
  );
}
