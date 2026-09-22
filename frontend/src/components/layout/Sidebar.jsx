import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Database,
  History,
  Settings,
  Globe2,
  Terminal,
} from 'lucide-react';

export const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Scraping Tasks', path: '/tasks', icon: Layers },
    { name: 'Create Task', path: '/tasks/create', icon: PlusCircle },
    { name: 'Data Explorer', path: '/data', icon: Database },
    { name: 'Run History', path: '/runs', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-900/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-teal-500/20">
          <Globe2 className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
            WebScraper
          </span>
          <span className="block text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
            Management Suite
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20 shadow-sm shadow-teal-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center gap-3">
          <div className="relative">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping opacity-75"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Engine Online</p>
            <p className="text-[10px] text-slate-500 truncate">Spring Boot + MySQL</p>
          </div>
          <Terminal className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
