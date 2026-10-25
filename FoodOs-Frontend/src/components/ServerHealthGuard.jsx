import React, { useState, useEffect } from 'react';
import { checkServerHealth } from '../services/healthService';
import ServerCookingScreen from './ServerCookingScreen';

/**
 * ServerHealthGuard
 *
 * Ensures the backend server is UP (e.g. cold-start on Render)
 * before regular app routes load. If the server is cooking,
 * displays the cooking splash screen until {"status":"UP"} is returned.
 */
export default function ServerHealthGuard({ children }) {
  // Check if we're on a dedicated health inspection route or forced check
  const isHealthPage = window.location.pathname === '/health' || window.location.pathname === '/server-status';

  // If already confirmed ready in this browser tab session, start optimistically as true
  const sessionReady = sessionStorage.getItem('foodos_server_ready') === 'true';

  const [isServerUp, setIsServerUp] = useState(sessionReady && !isHealthPage);
  const [hasStartedCheck, setHasStartedCheck] = useState(false);

  useEffect(() => {
    if (isHealthPage) {
      // On /health route, always show the monitoring screen
      setIsServerUp(false);
      setHasStartedCheck(true);
      return;
    }

    let isMounted = true;

    async function probe() {
      setHasStartedCheck(true);
      const result = await checkServerHealth(4000);
      if (isMounted) {
        if (result.isUp) {
          sessionStorage.setItem('foodos_server_ready', 'true');
          setIsServerUp(true);
        } else {
          // Server is not up yet (cooking, sleeping, or cold start)
          sessionStorage.removeItem('foodos_server_ready');
          setIsServerUp(false);
        }
      }
    }

    probe();

    return () => {
      isMounted = false;
    };
  }, [isHealthPage]);

  // If server is confirmed up and not on dedicated health page, render the normal application
  if (isServerUp && !isHealthPage) {
    return <>{children}</>;
  }

  // Otherwise, display the interactive Server Cooking splash screen
  return (
    <ServerCookingScreen
      isStandalone={isHealthPage}
      onServerReady={() => {
        sessionStorage.setItem('foodos_server_ready', 'true');
        setIsServerUp(true);
        if (isHealthPage) {
          window.location.href = '/';
        }
      }}
    />
  );
}
