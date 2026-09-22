import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-10 bg-slate-800/60 rounded-lg w-full"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-12 bg-slate-800/40 rounded-lg flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
      <div className="h-4 bg-slate-800 rounded w-1/3"></div>
      <div className="h-8 bg-slate-800 rounded w-1/2"></div>
      <div className="h-3 bg-slate-800/60 rounded w-2/3"></div>
    </div>
  );
};
