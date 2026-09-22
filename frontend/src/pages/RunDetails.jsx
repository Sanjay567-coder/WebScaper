import React, { useState, useEffect } from 'react';
import { runsApi, tasksApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  History,
  Terminal,
  Filter,
  RotateCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Activity
} from 'lucide-react';

export const RunDetails = () => {
  const [runs, setRuns] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [pageData, setPageData] = useState({ pageNumber: 0, totalPages: 1, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Log Inspector Modal
  const [selectedRun, setSelectedRun] = useState(null);

  const toast = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await tasksApi.getTasks({ page: 0, size: 100 });
        if (res.success && res.data) {
          setTasksList(res.data.content || []);
        }
      } catch (err) {
        console.error('Failed to load tasks list', err);
      }
    };
    fetchTasks();
  }, []);

  const loadRuns = async (page = 0) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        size: 15,
        taskId: selectedTaskId || undefined,
        status: statusFilter || undefined,
      };

      const res = await runsApi.getRuns(params);
      if (res.success && res.data) {
        setRuns(res.data.content || []);
        setPageData({
          pageNumber: res.data.pageNumber || 0,
          totalPages: res.data.totalPages || 1,
          totalElements: res.data.totalElements || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load execution run history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns(0);
  }, [selectedTaskId, statusFilter]);

  const formatDuration = (ms) => {
    if (!ms && ms !== 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-teal-400" />
            Execution Runs & Structured Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time execution states, durations, error traces, and Jsoup HTTP connection logs.
          </p>
        </div>

        <button
          onClick={() => loadRuns(pageData.pageNumber)}
          className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <RotateCw className="w-4 h-4" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          {/* Task Dropdown */}
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 text-xs text-slate-200 rounded-xl py-2 px-3 outline-none focus:border-teal-500/50"
          >
            <option value="">All Scraping Tasks</option>
            {tasksList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 text-xs text-slate-200 rounded-xl py-2 px-3 outline-none focus:border-teal-500/50"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="RUNNING">RUNNING</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="text-slate-300 font-semibold">{runs.length}</span> execution logs
        </div>
      </div>

      {/* Execution Runs Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-12">#</th>
                  <th className="py-4 px-4">Task Name</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Total Records</th>
                  <th className="py-4 px-4">New / Duplicates</th>
                  <th className="py-4 px-4">Duration</th>
                  <th className="py-4 px-4">Executed At</th>
                  <th className="py-4 px-4 text-right">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 font-mono text-slate-500">{run.id}</td>
                    <td className="py-4 px-4 font-bold text-slate-100">{run.taskName}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      {run.recordsFound || 0}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-emerald-400 font-semibold">{run.newRecordsCount || 0} new</span>
                      <span className="text-slate-500 mx-1.5">•</span>
                      <span className="text-amber-400">{run.duplicateRecordsCount || 0} dups</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400">
                      {formatDuration(run.durationMs)}
                    </td>
                    <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(run.startedAt)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedRun(run)}
                        className="py-1.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={History}
            title="No execution runs recorded yet"
            description="Execute a scraping task from the tasks page or wait for scheduled cron triggers."
          />
        )}

        {/* Pagination */}
        {pageData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-slate-200">{pageData.pageNumber + 1}</span> of{' '}
              <span className="font-semibold text-slate-200">{pageData.totalPages}</span> ({pageData.totalElements} runs total)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadRuns(pageData.pageNumber - 1)}
                disabled={pageData.pageNumber === 0}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadRuns(pageData.pageNumber + 1)}
                disabled={pageData.pageNumber >= pageData.totalPages - 1}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Run Log Details Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase">
                  <Terminal className="w-4 h-4" />
                  Execution Run Log #{selectedRun.id}
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{selectedRun.taskName}</h3>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Summary Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedRun.status} />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Extracted</span>
                  <div className="text-base font-extrabold text-slate-100 mt-0.5">
                    {selectedRun.recordsFound || 0}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">New Records</span>
                  <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                    {selectedRun.newRecordsCount || 0}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Duration</span>
                  <div className="text-base font-extrabold text-teal-400 font-mono mt-0.5">
                    {formatDuration(selectedRun.durationMs)}
                  </div>
                </div>
              </div>

              {/* Error Banner if any */}
              {selectedRun.errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Error Trace Message:</span>
                  </div>
                  <div>{selectedRun.errorMessage}</div>
                </div>
              )}

              {/* Structured Terminal Logs */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Structured Execution Output</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap overflow-x-auto max-h-72 leading-relaxed shadow-inner">
                  {selectedRun.logs || '[No execution logs recorded]'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setSelectedRun(null)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunDetails;
