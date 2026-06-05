import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { fetchMeContext } from '../../store/authSlice';
import websocketService from '../../services/websocket';

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();

  // Refresh identity + accessible outlets from /api/me/context whenever the
  // authenticated shell mounts (login redirect, page reload). This is the
  // source of truth for the outlet picker now that it's no longer in the JWT.
  useEffect(() => {
    dispatch(fetchMeContext());
  }, [dispatch]);

  // Connect WebSocket when any /app route mounts, disconnect on unmount
  useEffect(() => {
    websocketService.connect();
    return () => websocketService.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-900 font-sans">
      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Topbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="px-3 py-4 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
