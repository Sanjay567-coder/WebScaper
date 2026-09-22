import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const MainLayout = () => {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard Overview';
    if (pathname === '/tasks') return 'Scraping Tasks';
    if (pathname === '/tasks/create') return 'Create Scraping Task';
    if (pathname.startsWith('/tasks/edit/')) return 'Edit Scraping Task';
    if (pathname === '/data') return 'Scraped Data Explorer';
    if (pathname.startsWith('/runs')) return 'Execution Runs & Logs';
    if (pathname === '/settings') return 'System Settings';
    return 'WebScraper Suite';
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={getPageTitle(location.pathname)} />

        <main className="flex-1 overflow-y-auto p-8 bg-slate-950/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
