import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';

export const Navbar = ({ title = 'Dashboard' }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md px-8 flex items-center justify-between z-10">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-100">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User Info & Role */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>{user?.name || 'Administrator'}</span>
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded font-semibold uppercase">
                <Shield className="w-2.5 h-2.5" />
                Admin
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{user?.email || 'admin@webscraper.local'}</div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 ml-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
