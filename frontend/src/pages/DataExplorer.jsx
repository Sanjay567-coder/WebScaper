import React, { useState, useEffect } from 'react';
import { dataApi, tasksApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Database,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  RotateCw,
  Hash
} from 'lucide-react';

export const DataExplorer = () => {
  const [records, setRecords] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [pageData, setPageData] = useState({ pageNumber: 0, totalPages: 1, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('scrapedAt');
  const [direction, setDirection] = useState('desc');
  const [pageSize, setPageSize] = useState(15);

  // Record Detail Drawer
  const [inspectRecord, setInspectRecord] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const toast = useToast();

  useEffect(() => {
    // Load tasks list for filtering dropdown
    const fetchTasks = async () => {
      try {
        const res = await tasksApi.getTasks({ page: 0, size: 100 });
        if (res.success && res.data) {
          setTasksList(res.data.content || []);
        }
      } catch (err) {
        console.error('Failed to load tasks for dropdown', err);
      }
    };
    fetchTasks();
  }, []);

  const loadRecords = async (page = 0) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        size: pageSize,
        taskId: selectedTaskId || undefined,
        search: search.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        sortBy,
        direction,
      };

      const res = await dataApi.getRecords(params);
      if (res.success && res.data) {
        setRecords(res.data.content || []);
        setPageData({
          pageNumber: res.data.pageNumber || 0,
          totalPages: res.data.totalPages || 1,
          totalElements: res.data.totalElements || 0,
        });
      }
    } catch (err) {
      toast.error('Failed to fetch scraped records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(0);
  }, [selectedTaskId, sortBy, direction, pageSize]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadRecords(0);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedTaskId('');
    setStartDate('');
    setEndDate('');
    setSortBy('scrapedAt');
    setDirection('desc');
  };

  const handleDeleteRecord = async (id) => {
    try {
      await dataApi.deleteRecord(id);
      toast.success('Record deleted from database');
      if (inspectRecord?.id === id) setInspectRecord(null);
      loadRecords(pageData.pageNumber);
    } catch (err) {
      toast.error('Failed to delete record');
    }
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.info('SHA-256 hash copied to clipboard');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (records.length === 0) {
      toast.error('No records available to export');
      return;
    }

    // Collect all unique keys
    const allKeys = new Set(['id', 'taskId', 'taskName', 'sourceUrl', 'scrapedAt', 'contentHash']);
    records.forEach((r) => {
      if (r.parsedData) {
        Object.keys(r.parsedData).forEach((k) => allKeys.add(k));
      }
    });

    const header = Array.from(allKeys);
    const csvRows = [header.join(',')];

    records.forEach((r) => {
      const row = header.map((key) => {
        let val = '';
        if (key === 'id') val = r.id;
        else if (key === 'taskId') val = r.taskId;
        else if (key === 'taskName') val = r.taskName;
        else if (key === 'sourceUrl') val = r.sourceUrl;
        else if (key === 'scrapedAt') val = r.scrapedAt;
        else if (key === 'contentHash') val = r.contentHash;
        else if (r.parsedData && r.parsedData[key] !== undefined) {
          val = typeof r.parsedData[key] === 'object' ? JSON.stringify(r.parsedData[key]) : r.parsedData[key];
        }
        // Escape CSV values
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scraped_data_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV export generated successfully!');
  };

  // Export to JSON
  const exportToJSON = () => {
    if (records.length === 0) {
      toast.error('No records available to export');
      return;
    }

    const exportPayload = records.map((r) => ({
      id: r.id,
      taskId: r.taskId,
      taskName: r.taskName,
      sourceUrl: r.sourceUrl,
      scrapedAt: r.scrapedAt,
      contentHash: r.contentHash,
      data: r.parsedData || {},
    }));

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scraped_data_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('JSON export generated successfully!');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" />
            Scraped Data Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, inspect parsed JSON payloads, and export collected records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            className="py-2 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shadow-emerald-500/5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportToJSON}
            className="py-2 px-3.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shadow-teal-500/5"
          >
            <FileCode className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search record content or URL..."
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 outline-none"
            />
          </div>

          {/* Task Dropdown Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none"
            >
              <option value="">All Scraping Tasks</option>
              {tasksList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={`${sortBy}-${direction}`}
              onChange={(e) => {
                const [sb, dir] = e.target.value.split('-');
                setSortBy(sb);
                setDirection(dir);
              }}
              className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2 px-3 text-xs text-slate-200 outline-none"
            >
              <option value="scrapedAt-desc">Newest First</option>
              <option value="scrapedAt-asc">Oldest First</option>
              <option value="id-desc">ID Descending</option>
              <option value="id-asc">ID Ascending</option>
            </select>
          </div>

          {/* Actions */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
              title="Reset filters"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Scraped Records Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-4 px-4 w-12">#</th>
                  <th className="py-4 px-4">Task & Source</th>
                  <th className="py-4 px-4">Extracted Fields Preview</th>
                  <th className="py-4 px-4">SHA-256 Hash</th>
                  <th className="py-4 px-4">Scraped At</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {records.map((record) => {
                  const dataEntries = Object.entries(record.parsedData || {});
                  return (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 font-mono text-slate-500">{record.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-100">{record.taskName}</div>
                        <a
                          href={record.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-teal-400/80 hover:text-teal-300 flex items-center gap-1 mt-0.5 max-w-xs truncate"
                        >
                          <span className="truncate">{record.sourceUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {dataEntries.slice(0, 3).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 max-w-[200px] truncate"
                            >
                              <span className="text-teal-400 font-semibold">{k}:</span>{' '}
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          ))}
                          {dataEntries.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-semibold">
                              +{dataEntries.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          onClick={() => handleCopyHash(record.contentHash)}
                          className="font-mono text-[10px] px-2 py-1 bg-slate-950 rounded border border-slate-800/80 text-teal-400/90 cursor-pointer hover:border-teal-500/40 transition-colors flex items-center gap-1 w-fit"
                          title="Click to copy full SHA-256 hash"
                        >
                          <Hash className="w-3 h-3 text-slate-500" />
                          <span>{record.contentHash.substring(0, 12)}…</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(record.scrapedAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectRecord(record)}
                            className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition-all"
                            title="Inspect JSON Record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No records found in database"
            description="Run a scraping task to start extracting and collecting structured data."
          />
        )}

        {/* Pagination Bar */}
        {pageData.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-slate-200">{pageData.pageNumber + 1}</span> of{' '}
              <span className="font-semibold text-slate-200">{pageData.totalPages}</span> ({pageData.totalElements} records total)
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadRecords(pageData.pageNumber - 1)}
                disabled={pageData.pageNumber === 0}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadRecords(pageData.pageNumber + 1)}
                disabled={pageData.pageNumber >= pageData.totalPages - 1}
                className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Inspection Modal / Drawer */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase">
                  <Database className="w-4 h-4" />
                  Scraped Record #{inspectRecord.id}
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-0.5">{inspectRecord.taskName}</h3>
              </div>
              <button
                onClick={() => setInspectRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Metadata Box */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Source URL:</span>
                  <a
                    href={inspectRecord.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-400 hover:underline flex items-center gap-1 max-w-xs truncate"
                  >
                    <span>{inspectRecord.sourceUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">SHA-256 Hash:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-teal-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {inspectRecord.contentHash}
                    </span>
                    <button
                      onClick={() => handleCopyHash(inspectRecord.contentHash)}
                      className="text-slate-400 hover:text-slate-200"
                      title="Copy Hash"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scraped Timestamp:</span>
                  <span className="text-slate-300">{formatDate(inspectRecord.scrapedAt)}</span>
                </div>
              </div>

              {/* Parsed JSON Viewer */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Parsed JSON Payload
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-teal-300 overflow-x-auto max-h-72">
                  {JSON.stringify(inspectRecord.parsedData || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center">
              <button
                onClick={() => handleDeleteRecord(inspectRecord.id)}
                className="py-2 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </button>

              <button
                onClick={() => setInspectRecord(null)}
                className="py-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExplorer;
