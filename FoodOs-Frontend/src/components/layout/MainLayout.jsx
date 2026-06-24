import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Rail } from './Rail';
import { BottomTabs } from './BottomTabs';
import { fetchMeContext } from '../../store/authSlice';
import websocketService from '../../services/websocket';

/**
 * App shell: fixed 80px icon rail (lg+) / bottom tab bar (< lg).
 * The content area is paper by default; dark operational screens (Floor,
 * Kitchen, POS) break out to full-bleed dark using `-m-*` + their own bg.
 */
export const MainLayout = () => {
  const dispatch = useDispatch();

  // Refresh identity + accessible outlets from /api/me/context on shell mount.
  useEffect(() => {
    dispatch(fetchMeContext());
  }, [dispatch]);

  // Connect WebSocket while any /app route is mounted.
  useEffect(() => {
    websocketService.connect();
    return () => websocketService.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink-text font-sans">
      <Rail />
      <div className="lg:ml-20 min-h-screen flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomTabs />
    </div>
  );
};
