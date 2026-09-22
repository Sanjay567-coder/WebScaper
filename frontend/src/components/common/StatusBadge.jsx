import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toString().toUpperCase();

  const getStyles = () => {
    switch (normalized) {
      case 'ACTIVE':
      case 'SUCCESS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RUNNING':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse';
      case 'PAUSED':
      case 'DRAFT':
      case 'PARTIAL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'FAILED':
      case 'ERROR':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border tracking-wide uppercase ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {normalized}
    </span>
  );
};

export default StatusBadge;
