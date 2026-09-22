import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';

// Lazy or placeholder imports for pages implemented in subsequent milestones
import Dashboard from './pages/Dashboard';
import ScrapingTasks from './pages/ScrapingTasks';
import CreateTask from './pages/CreateTask';
import DataExplorer from './pages/DataExplorer';
import RunDetails from './pages/RunDetails';
import Settings from './pages/Settings';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<ScrapingTasks />} />
                <Route path="/tasks/create" element={<CreateTask />} />
                <Route path="/tasks/edit/:id" element={<CreateTask isEdit={true} />} />
                <Route path="/data" element={<DataExplorer />} />
                <Route path="/runs" element={<RunDetails />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
