import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { checkServerHealth } from '../services/healthService';

export default function ServerCookingScreen({ onServerReady, isStandalone = false }) {
  const [isUp, setIsUp] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  // Status message generator based on cooking elapsed time
  const getCookingStage = (seconds) => {
    if (isUp) return { title: 'Server is Fully Cooked! 🍲', desc: 'Deliciously ready. Redirecting to FoodOS...' };
    if (seconds < 8) return { title: 'Lighting the Kitchen Burners...', desc: 'Cloud server is waking up from idle sleep' };
    if (seconds < 20) return { title: 'Pre-heating the Container...', desc: 'Initializing application runtime' };
    if (seconds < 35) return { title: 'Adding Secret Spices & DB Connections...', desc: 'Spring Boot initializing JPA & cache repositories' };
    if (seconds < 55) return { title: 'Simmering to Perfection...', desc: 'Validating readiness & liveness probes' };
    return { title: 'Almost Ready to Serve!', desc: 'Cold start usually finishes within 45-60 seconds' };
  };

  const stage = getCookingStage(elapsedSeconds);

  // Perform single health check
  const runCheck = async () => {
    setIsChecking(true);
    setAttempts((prev) => prev + 1);

    const result = await checkServerHealth();
    setLastCheckTime(new Date().toLocaleTimeString());
    setHealthData(result.data || { status: result.status, message: result.error || 'Server is warming up...' });

    if (result.isUp) {
      setIsUp(true);
      setIsChecking(false);
      // Wait 1.2s to celebrate and let the user see the "Cooked" state before continuing
      setTimeout(() => {
        if (onServerReady) {
          onServerReady();
        }
      }, 1200);
      return true;
    }

    setIsChecking(false);
    return false;
  };

  // Setup timer & polling loop
  useEffect(() => {
    // Start elapsed counter
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Initial check immediately
    runCheck();

    // Poll every 3 seconds until UP
    pollRef.current = setInterval(async () => {
      if (!isUp) {
        const ready = await runCheck();
        if (ready) {
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
        }
      }
    }, 3000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(pollRef.current);
    };
  }, [isUp]);

  return (
    <div className="min-h-screen bg-[#111923] text-[#FFFDF8] flex flex-col justify-between items-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E85D04]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-[#F4A261]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#E85D04] to-[#F4A261] flex items-center justify-center font-black text-[#111923] shadow-lg shadow-[#E85D04]/20 text-lg">
            F
          </div>
          <span className="font-bold text-lg tracking-tight text-[#FFFDF8]">
            Food<span className="text-[#E85D04]">OS</span>
          </span>
          <span className="text-xs bg-[#1F2B37] border border-[#34465B] text-[#F4A261] font-mono px-2 py-0.5 rounded-full">
            System Starting
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] bg-[#1F2B37]/60 border border-[#34465B]/60 px-3 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-[#E85D04] animate-pulse'}`} />
            {isUp ? 'Ready' : 'Cooking in progress'}
          </span>
        </div>
      </header>

      {/* Main Cooking Animation Card */}
      <main className="w-full max-w-lg z-10 flex flex-col items-center text-center my-auto py-6">
        {/* Animated Cooking Pot Visual */}
        <div className="relative mb-6">
          {/* Steam bubbles */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#FFFDF8]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-3.5 h-3.5 bg-[#FFFDF8]/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2.5 h-2.5 bg-[#FFFDF8]/40 rounded-full animate-bounce" />
          </div>

          {/* Pot Icon / SVG */}
          <div className={`w-32 h-32 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl relative ${
            isUp
              ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-emerald-500/20'
              : 'bg-[#1F2B37] border-2 border-[#34465B] shadow-[#E85D04]/10'
          }`}>
            {isUp ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-in zoom-in-75 duration-300" />
            ) : (
              <div className="relative flex flex-col items-center">
                {/* Pot body with stirring motion */}
                <svg className="w-16 h-16 text-[#F4A261] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11h16a1 1 0 0 1 1 1v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-6a1 1 0 0 1 1-1Z" />
                  <path d="M2 11h20" />
                  <path d="M12 4v4" />
                  <path d="M8 8h8" />
                </svg>

                {/* Fire underneath */}
                <div className="flex items-center gap-1 mt-1 text-[#E85D04] animate-bounce">
                  <Flame className="w-5 h-5 fill-[#E85D04]" />
                  <Flame className="w-4 h-4 fill-[#F4A261] text-[#F4A261]" />
                  <Flame className="w-5 h-5 fill-[#E85D04]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title and Stage */}
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-[#FFFDF8] mb-2">
          {stage.title}
        </h1>
        <p className="text-sm text-[#94A3B8] max-w-md mb-6 leading-relaxed">
          {stage.desc}
        </p>

        {/* Cooking Timer and Progress */}
        <div className="w-full bg-[#1F2B37] border border-[#34465B] rounded-2xl p-4 mb-4 text-left shadow-lg">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[#94A3B8] flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-[#E85D04] animate-ping'}`} />
              {isUp ? 'Server Status: UP' : 'Server Status: Cooking...'}
            </span>
            <span className="font-mono text-[#F4A261]">
              Cooking Time: <span className="font-bold text-[#FFFDF8]">{elapsedSeconds}s</span>
            </span>
          </div>

          {/* Progress bar (simulated 50s wake cycle) */}
          <div className="w-full h-2 bg-[#111923] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out ${
                isUp
                  ? 'w-full bg-emerald-500'
                  : 'bg-gradient-to-r from-[#E85D04] to-[#F4A261]'
              }`}
              style={{ width: isUp ? '100%' : `${Math.min(95, Math.max(8, (elapsedSeconds / 50) * 100))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-2 font-mono">
            <span>Health Probe: <span className="text-[#94A3B8]">/actuator/health</span></span>
            <span>Attempts: {attempts}</span>
          </div>
        </div>

        {/* Live Actuator JSON response preview */}
        <div className="w-full bg-[#0B1017] border border-[#233140] rounded-xl p-3 mb-6 text-left font-mono text-[11px] text-[#94A3B8] overflow-hidden">
          <div className="flex items-center justify-between text-[#64748B] pb-1 border-b border-[#1E293B] mb-2 text-[10px] uppercase tracking-wider">
            <span>Actuator Probe Response</span>
            <span>Last checked: {lastCheckTime || 'Just now'}</span>
          </div>
          <pre className="text-emerald-400/90 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(
              healthData || { status: 'WAITING_FOR_RESPONSE', message: 'Checking /actuator/health...' },
              null,
              2
            )}
          </pre>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => runCheck()}
            disabled={isChecking || isUp}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F2B37] hover:bg-[#2A3A4A] border border-[#34465B] text-xs font-semibold text-[#FFFDF8] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#E85D04] ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Check Server Now'}
          </button>

          {isUp && onServerReady && (
            <button
              onClick={onServerReady}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#E85D04] hover:bg-[#C94D03] text-xs font-bold text-white transition shadow-lg shadow-[#E85D04]/30"
            >
              Enter FoodOS
            </button>
          )}
        </div>
      </main>

      {/* Footer info - No external domain links or sensitive info */}
      <footer className="w-full max-w-4xl text-center text-xs text-[#64748B] z-10 py-3 flex items-center justify-center border-t border-[#1F2B37]">
        <p>
          Cloud server is warming up. Once active, your session will connect automatically.
        </p>
      </footer>
    </div>
  );
}
