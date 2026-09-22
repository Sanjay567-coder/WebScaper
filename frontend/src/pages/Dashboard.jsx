import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardApi, tasksApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ExternalLink,
  Activity,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState(null);

  const toast = useToast();
  const navigate = useNavigate();

  const loadMetrics = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const res = await dashboardApi.getMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
        if (showToast) toast.success('Dashboard metrics updated');
      }
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleRunTaskNow = async (taskId, taskName) => {
    try {
      setRunningTaskId(taskId);
      toast.info(`Running task: ${taskName}...`);
      const res = await tasksApi.runTaskNow(taskId);
      if (res.success) {
        toast.success(`Task '${taskName}' completed successfully! Found ${res.data.recordsFound || 0} records.`);
        loadMetrics();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to run task ${taskName}`);
    } finally {
      setRunningTaskId(null);
    }
  };

  const formatDuration = (ms) => {
    if (!ms && ms !== 0) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 h-80 animate-pulse"></div>
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 h-80 animate-pulse"></div>
        </div>
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  const kpis = [
    {
      title: 'Scraping Tasks',
      value: metrics?.totalTasks || 0,
      subValue: `${metrics?.activeTasks || 0} Active`,
      icon: Layers,
      color: 'teal',
      gradient: 'from-teal-500/20 to-teal-500/5',
      borderColor: 'border-teal-500/20',
      textColor: 'text-teal-400',
    },
    {
      title: 'Total Scraped Records',
      value: (metrics?.totalRecords || 0).toLocaleString(),
      subValue: 'Stored in MySQL',
      icon: Database,
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Success Rate',
      value: `${metrics?.successRatePercent || 100}%`,
      subValue: `${metrics?.successfulRuns || 0} Successful runs`,
      icon: CheckCircle2,
      color: 'cyan',
      gradient: 'from-cyan-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/20',
      textColor: 'text-cyan-400',
    },
    {
      title: 'Failed Runs',
      value: metrics?.failedRuns || 0,
      subValue: `${metrics?.totalRuns || 0} Total executions`,
      icon: AlertTriangle,
      color: 'rose',
      gradient: 'from-rose-500/20 to-rose-500/5',
      borderColor: 'border-rose-500/20',
      textColor: 'text-rose-400',
    },
  ];

  const BAR_COLORS = ['#14b8a6', '#06b6d4', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            System Live Monitor
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Automated Web Scraping Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Extracting, cleaning, deduplicating, and archiving web data on automated cron schedules.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => loadMetrics(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-semibold flex items-center gap-2 transition-all"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/tasks/create"
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Task</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-gradient-to-br ${kpi.gradient} bg-slate-900/90 border ${kpi.borderColor} shadow-lg backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2.5 rounded-xl bg-slate-950/60 border ${kpi.borderColor} ${kpi.textColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-3xl font-extrabold text-slate-100 tracking-tight">
                  {kpi.value}
                </div>
                <div className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
                  <span>{kpi.subValue}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider mb-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                7-Day Trend
              </div>
              <h3 className="text-base font-bold text-slate-100">Scraping Activity Over Time</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium">
              Daily Scrapes
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.activityChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="recordsCount"
                  name="Scraped Records"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#activityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Records Distribution (1 col) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-0.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Distribution
              </div>
              <h3 className="text-base font-bold text-slate-100">Records per Task</h3>
            </div>
          </div>

          <div className="h-64 w-full">
            {metrics?.taskDistribution && metrics.taskDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.taskDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis
                    dataKey="taskName"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    width={100}
                    tickFormatter={(val) => (val.length > 14 ? val.substring(0, 14) + '…' : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="recordCount" name="Records" radius={[0, 6, 6, 0]}>
                    {metrics.taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No record distribution data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Runs Table */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Recent Scraping Executions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest manual runs and automated cron triggers</p>
          </div>
          <Link
            to="/runs"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
          >
            <span>View all execution logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {metrics?.recentRuns && metrics.recentRuns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Task Name</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Records Found</th>
                  <th className="py-3.5 px-4">New / Dups</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Executed At</th>
                  <th className="py-3.5 px-4 text-right">Quick Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {metrics.recentRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{run.taskName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-100 font-semibold">
                      {run.recordsFound || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400 font-semibold">{run.newRecordsCount || 0}</span>
                      <span className="text-slate-500 mx-1">/</span>
                      <span className="text-amber-400">{run.duplicateRecordsCount || 0}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatDuration(run.durationMs)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(run.startedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRunTaskNow(run.taskId, run.taskName)}
                        disabled={runningTaskId === run.taskId}
                        className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 transition-all disabled:opacity-50 inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Run this task now"
                      >
                        <Play className={`w-3 h-3 ${runningTaskId === run.taskId ? 'animate-spin' : ''}`} />
                        <span>Run</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No execution runs recorded"
            description="Trigger a manual run or wait for your scheduled cron jobs to start collecting data."
            action={
              <Link
                to="/tasks"
                className="py-2 px-4 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Go to Scraping Tasks</span>
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
