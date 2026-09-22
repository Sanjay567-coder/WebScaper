import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Server,
  Activity,
  Cpu,
  HardDrive,
  Save,
  CheckCircle2,
  Lock,
  Globe2,
  Clock,
  RotateCw,
  Loader2
} from 'lucide-react';

export const Settings = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || 'System Administrator');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [systemHealth, setSystemHealth] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  const loadHealthAndSettings = async () => {
    try {
      setIsLoadingHealth(true);
      const [healthRes, settingsRes] = await Promise.all([
        settingsApi.getSystemHealth(),
        settingsApi.getSettings(),
      ]);

      if (healthRes.success && healthRes.data) {
        setSystemHealth(healthRes.data);
      }
      if (settingsRes.success && settingsRes.data) {
        setAppSettings(settingsRes.data);
      }
    } catch (err) {
      console.error('Failed to load system diagnostics', err);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    loadHealthAndSettings();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const payload = { name };
      if (password) payload.password = password;

      const res = await settingsApi.updateProfile(payload);
      if (res.success) {
        toast.success('Admin profile updated successfully');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-teal-400" />
            System & Administrator Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your credentials, global scraping parameters, and inspect server runtime health.
          </p>
        </div>

        <button
          onClick={loadHealthAndSettings}
          className="py-2 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto shadow-sm"
        >
          <RotateCw className={`w-4 h-4 ${isLoadingHealth ? 'animate-spin text-teal-400' : ''}`} />
          <span>Refresh Health</span>
        </button>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider border-b border-slate-800/80 pb-3">
            <User className="w-4 h-4" />
            Administrator Profile & Security
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Administrator Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'admin@webscraper.local'}
                className="w-full bg-slate-950/40 border border-slate-800/60 rounded-xl py-2.5 px-4 text-xs text-slate-500 outline-none cursor-not-allowed"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/60 space-y-3">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Change Password (optional)
              </span>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (leave blank to keep current)"
                  className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 outline-none"
                />
              </div>

              {password && (
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-teal-500/50 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-600 outline-none"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 mt-4"
            >
              {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Profile Changes</span>
            </button>
          </form>
        </div>

        {/* Global Scraper Defaults Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider border-b border-slate-800/80 pb-3">
            <Globe2 className="w-4 h-4" />
            Global Scraper Defaults
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Default HTTP User-Agent Header
              </label>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-teal-300 break-all">
                {appSettings?.defaultUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Default Timeout</span>
                <div className="text-base font-extrabold text-slate-100 mt-0.5">
                  {appSettings?.defaultTimeoutSeconds || 10} seconds
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Default Retries</span>
                <div className="text-base font-extrabold text-slate-100 mt-0.5">
                  {appSettings?.defaultRetryCount ?? 2} attempts
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Background Scheduler</span>
                <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active & Polling Tasks
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold text-[11px]">
                ENABLED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Health & JVM Diagnostics */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            Backend System Health & Runtime Diagnostics
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Operational
          </span>
        </div>

        {/* Diagnostic Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-semibold uppercase">Database Status</span>
              <Server className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-sm font-bold text-emerald-400">
              {systemHealth?.database || 'CONNECTED'} (MySQL 8.0)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-semibold uppercase">JVM Heap Memory</span>
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-sm font-bold text-slate-100">
              {systemHealth?.usedMemoryMb || 0} MB <span className="text-xs text-slate-500 font-normal">/ {systemHealth?.totalMemoryMb || 0} MB</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-semibold uppercase">Server Uptime</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-slate-100 font-mono">
              {formatUptime(systemHealth?.uptimeSeconds)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-semibold uppercase">Runtime Environment</span>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-sm font-bold text-slate-100 truncate" title={`${systemHealth?.jvmVersion} (${systemHealth?.osName})`}>
              Java {systemHealth?.jvmVersion || '17'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
