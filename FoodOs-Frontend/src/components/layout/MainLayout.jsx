import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-slate-900 font-sans">
      <Sidebar />
      <Topbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
