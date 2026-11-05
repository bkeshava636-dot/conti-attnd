import React from 'react';

export default function StudentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading student attendance data">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2.5">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
          <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded-md"></div>
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="size-6 bg-slate-100 dark:bg-slate-800/60 rounded-full"></div>
            </div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
          </div>
        ))}
      </div>

      {/* Tabs & Table Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-8 w-28 bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
            <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
          </div>
          <div className="h-8 w-32 bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
        </div>

        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-12 w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between px-4">
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
