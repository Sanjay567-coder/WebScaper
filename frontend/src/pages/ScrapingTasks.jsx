import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { tasksApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Layers,
  PlusCircle,
  Search,
  Filter,
  Play,
  Edit2,
  Trash2,
  Eye,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Pause,
  RotateCw,
  X,
  Code2
} from 'lucide-react';

export const ScrapingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [pageData, setPageData] = useState({ pageNumber: 0, totalPages: 1, totalElements: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewTask, setPreviewTask] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [deleteModalTask, setDeleteModalTask] = useState(null);

  const toast = useToast();
  const navigate = useNavigate();

  const loadTasks = async (page = 0) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        size: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy: 'createdAt',
        direction: 'desc',
      };
      const res = await tasksApi.getTasks(params);
      if (res.success && res.data) {
        setTasks(res.data.content || []);
        setPageData({
          pageNumber: res.data.pageNumber || 0,
          totalPages: res.data.totalPages || 1,
          totalElements: res.data.totalElements || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to load scraping tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(0);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTasks(0);
  };

  const handleRunNow = async (task) => {
    try {
      setRunningTaskId(task.id);
      toast.info(`Executing scraping task: ${task.name}...`);
      const res = await tasksApi.runTaskNow(task.id);
      if (res.success) {
        toast.success(`Task '${task.name}' completed! Found ${res.data.recordsFound} records (${res.data.newRecordsCount} new, ${res.data.duplicateRecordsCount} duplicates).`);
        loadTasks(pageData.pageNumber);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to execute task ${task.name}`);
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleStatusToggle = async (task) => {
    const nextStatus = task.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await tasksApi.updateStatus(task.id, nextStatus);
      if (res.success) {
        toast.success(`Task status changed to ${nextStatus}`);
        loadTasks(pageData.pageNumber);
      }
    } catch (err) {
      toast.error('Failed to update task status');
    }
  };

  const handleTestPreview = async (task) => {
    try {
      setPreviewTask(task);
      setIsPreviewLoading(true);
      setPreviewResult(null);
      const res = await tasksApi.testScrapeTask(task.id, 5);
      if (res.success) {
        setPreviewResult(res.data);
      }
    } catch (err) {
      toast.error('Test scrape failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalTask) return;
    try {
      await tasksApi.deleteTask(deleteModalTask.id);
      toast.success(`Task '${deleteModalTask.name}' deleted`);
      setDeleteModalTask(null);
      loadTasks(0);
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" />
            Scraping Tasks Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure target URLs, CSS selectors, automated schedules, and trigger runs.
          </p>
        </div>

        <Link
          to="/tasks/create"
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Scraping Task</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by task name or URL..."
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/70 border border-slate-800 text-xs text-slate-300 rounded-xl py-2 px-3 outline-none focus:border-teal-500/50 transition-all"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
            <option value="DRAFT">DRAFT</option>
          </select>

          <button
            onClick={() => loadTasks(pageData.pageNumber)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh list"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-4 px-5">Task Details</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Schedule</th>
                  <th className="py-4 px-4">Records</th>
                  <th className="py-4 px-4">Last Run</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-100 text-sm">{task.name}</div>
                      <a
                        href={task.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-teal-400/80 hover:text-teal-300 flex items-center gap-1 mt-0.5 max-w-sm truncate"
                      >
                        <span className="truncate">{task.sourceUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                      {task.schedule === 'MANUAL' ? (
                        <span className="text-slate-500">Manual Trigger</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-teal-400">
                          {task.schedule}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-100 text-sm">
                        {(task.totalRecordsCount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">
                      <div>{formatDate(task.lastRunAt)}</div>
                      {task.lastRunStatus && (
                        <div className="mt-0.5">
                          <StatusBadge status={task.lastRunStatus} />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Run Now Button */}
                        <button
                          onClick={() => handleRunNow(task)}
                          disabled={runningTaskId === task.id}
                          className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition-all disabled:opacity-50"
                          title="Run task immediately"
                        >
                          <Play className={`w-3.5 h-3.5 ${runningTaskId === task.id ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Test Scrape Preview */}
                        <button
                          onClick={() => handleTestPreview(task)}
                          className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all"
                          title="Preview Test Scrape"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Pause / Resume Status */}
                        <button
                          onClick={() => handleStatusToggle(task)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                          title={task.status === 'ACTIVE' ? 'Pause Task' : 'Activate Task'}
                        >
                          {task.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit */}
                        <Link
                          to={`/tasks/edit/${task.id}`}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteModalTask(task)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No scraping tasks found"
            description="Create your first scraping task to automate data collection from public websites."
            action={
              <Link
                to="/tasks/create"
                className="py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Scraping Task</span>
              </Link>
            }
          />
        )}

        {/* Pagination Bar */}
        {pageData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-slate-200">{pageData.pageNumber + 1}</span> of{' '}
              <span className="font-semibold text-slate-200">{pageData.totalPages}</span> ({pageData.totalElements} tasks total)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadTasks(pageData.pageNumber - 1)}
                disabled={pageData.pageNumber === 0}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadTasks(pageData.pageNumber + 1)}
                disabled={pageData.pageNumber >= pageData.totalPages - 1}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test Scrape Live Preview Modal/Drawer */}
      {previewTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase">
                  <Code2 className="w-4 h-4" />
                  Live Test Scrape Preview
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{previewTask.name}</h3>
              </div>
              <button
                onClick={() => setPreviewTask(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isPreviewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400">Connecting to {previewTask.sourceUrl} and parsing selectors...</p>
                </div>
              ) : previewResult ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Status</div>
                      <div className={`text-sm font-bold mt-0.5 ${previewResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {previewResult.success ? '200 OK' : 'FAILED'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Items Found</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {previewResult.totalItemsFound}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Duration</div>
                      <div className="text-sm font-bold text-slate-100 mt-0.5">
                        {previewResult.durationMs}ms
                      </div>
                    </div>
                  </div>

                  {previewResult.errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      {previewResult.errorMessage}
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Extracted JSON Preview ({previewResult.previewItems?.length || 0} samples)
                    </div>
                    <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-teal-300 overflow-x-auto max-h-72">
                      {JSON.stringify(previewResult.previewItems, null, 2)}
                    </pre>
                  </div>
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
              <button
                onClick={() => setPreviewTask(null)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Delete Scraping Task?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to delete <span className="text-slate-200 font-semibold">"{deleteModalTask.name}"</span>?
                This will also delete all associated execution runs and scraped records.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalTask(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="py-2 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrapingTasks;
