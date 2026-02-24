import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { StoryScene } from './StoryElements';
import { ArrowRight } from 'lucide-react';
import * as THREE from 'three';

// ─── CSS-based cinematic overlays (vignette + film grain) ──────────────────────
// Bypasses @react-three/postprocessing React 19 incompatibility entirely
const vignetteStyle = {
  position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
  background: 'radial-gradient(ellipse at center, transparent 50%, rgba(10,10,15,0.6) 100%)',
};
const grainStyle = {
  position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', opacity: 0.045,
  mixBlendMode: 'overlay',
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '128px 128px',
};

// ─── Stage config for narrative text ───────────────────────────────────────────
const STAGES = [
  { threshold: 0.18, align: 'left',  yAnchor: 'top' },
  { threshold: 0.38, align: 'right', yAnchor: 'top' },
  { threshold: 0.55, align: 'left',  yAnchor: 'top' },
  { threshold: 0.78, align: 'right', yAnchor: 'bottom' },
  { threshold: 1.01, align: 'center', yAnchor: 'center' },
];

export default function Scene3D({ onNavigate }) {
  const containerRef = useRef(null);
  const scrollProgress = useRef(0);
  const [activeStage, setActiveStage] = useState(0);
  const [rawProgress, setRawProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { top, height } = containerRef.current.getBoundingClientRect();
      const scrollableDistance = height - window.innerHeight;
      const scrolled = -top;
      const newProgress = Math.max(0, Math.min(1, scrolled / scrollableDistance));
      scrollProgress.current = newProgress;
      setRawProgress(newProgress);

      // Determine narrative stage from thresholds
      let stage = 0;
      for (let i = 0; i < STAGES.length; i++) {
        if (newProgress < STAGES[i].threshold) { stage = i; break; }
        if (i === STAGES.length - 1) stage = i;
      }
      setActiveStage(stage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Overlay text panel helper
  const textPanel = (visible, pos, children) => {
    const base = 'transition-all duration-[1200ms] ease-out';
    const vis = visible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-6 blur-sm';
    const align =
      pos === 'left'   ? 'left-4 md:left-10 top-[22%]' :
      pos === 'right'  ? 'right-4 md:right-10 top-[28%]' :
      pos === 'bottom-right' ? 'right-4 md:right-10 bottom-[22%]' :
      'inset-0 flex items-center justify-center';
    return (
      <div className={`absolute ${align} ${base} ${vis}`}>
        {children}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full relative" style={{ height: '600vh', background: '#0A0A0F' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* ─── 3D Canvas ─────────────────────────────────────────────── */}
        <div className="absolute inset-0 z-0">
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [5.5, 3.8, 7.5], fov: 36, near: 0.1, far: 50 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 0.85,
              powerPreference: 'high-performance',
            }}
            onCreated={({ gl }) => { gl.setClearColor('#0A0A0F'); }}
          >
            <StoryScene scrollYProgress={scrollProgress} />
          </Canvas>
        </div>

        {/* ─── CSS Cinematic Overlays ────────────────────────────────── */}
        <div style={vignetteStyle} />
        <div style={grainStyle} />

        {/* ─── Narrative Text Overlays ───────────────────────────────── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full pointer-events-none">

          {/* Stage 0 — Establishing */}
          {textPanel(activeStage === 0, 'left',
            <div className="max-w-xl">
              <p className="text-amber-400 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">The everyday struggle</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1]" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
                Managing a<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">chaotic</span> restaurant?
              </h2>
            </div>
          )}

          {/* Stage 1 — Table arranges */}
          {textPanel(activeStage === 1, 'right',
            <div className="max-w-lg text-right">
              <p className="text-amber-400/70 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">Introducing</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1]" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">FoodOS</span> brings<br />order to the chaos.
              </h2>
            </div>
          )}

          {/* Stage 2 — Customer sits */}
          {textPanel(activeStage === 2, 'left',
            <div className="max-w-lg">
              <p className="text-amber-400/70 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">Seamless experience</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1]" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
                Guests welcomed.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">Seated in seconds.</span>
              </h2>
            </div>
          )}

          {/* Stage 3 — Waiter serves */}
          {textPanel(activeStage === 3, 'bottom-right',
            <div className="max-w-lg text-right">
              <p className="text-amber-400/70 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-3">Instant KOTs</p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[1.1]" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}>
                Served with<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-400">precision.</span> Every time.
              </h2>
            </div>
          )}

          {/* Stage 4 — Hero CTA */}
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-[1400ms] ease-out ${
            activeStage === 4 ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
          }`}>
            <div className="text-center px-6 py-10 md:px-16 md:py-14 rounded-3xl"
                 style={{ background: 'radial-gradient(ellipse at center, rgba(255,248,235,0.08) 0%, rgba(0,0,0,0.7) 100%)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-amber-400 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-4">Your restaurant, elevated</p>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 leading-[1.1]" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                Ready to experience<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">FoodOS</span>?
              </h2>
              <p className="text-white/60 text-sm md:text-lg mb-8 max-w-lg mx-auto">
                The complete operating system for modern, fast-paced restaurants.
              </p>
              <button
                onClick={onNavigate}
                className="bg-gradient-to-r from-amber-400 to-orange-500 text-black px-8 py-4 rounded-full text-lg font-bold shadow-xl shadow-amber-500/25 transition-all hover:scale-105 hover:shadow-amber-500/40 inline-flex items-center gap-2 cursor-pointer"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ─── Scroll Progress Indicator (right edge) ─────────────── */}
          <div className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 transition-opacity duration-700 ${activeStage === 4 ? 'opacity-0' : 'opacity-100'}`}>
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`rounded-full transition-all duration-500 ${
                i === activeStage ? 'w-2 h-2 bg-amber-400 scale-125 shadow-sm shadow-amber-400/50' : 'w-1.5 h-1.5 bg-white/20 scale-100'
              }`} />
            ))}
          </div>

          {/* ─── Scroll Prompt ──────────────────────────────────────── */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center transition-opacity duration-700 ${
            activeStage >= 4 ? 'opacity-0' : rawProgress < 0.02 ? 'opacity-100' : 'opacity-40'
          }`}>
            <span className="text-white/50 text-[10px] font-medium tracking-[0.3em] uppercase mb-2">Scroll to explore</span>
            <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-1.5 bg-white/50 rounded-full animate-bounce" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
