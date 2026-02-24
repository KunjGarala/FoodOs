// ═══════════════════════════════════════════════════════════════════════════════
// StoryElements.jsx — Cinematic Restaurant Scene for FoodOS Landing Page
// Scroll-driven 5-act sequence: Setup → Arrange → Customer → Waiter → Hero
// ═══════════════════════════════════════════════════════════════════════════════
import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────
function clamp01(t) { return Math.max(0, Math.min(1, t)); }
function remap(value, lo, hi) { return clamp01((value - lo) / (hi - lo)); }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

// ─── CAMERA KEYFRAMES (cinematic dolly / arc) ──────────────────────────────────
const CAM_KF = [
  { t: 0.00, pos: [5.5, 3.8, 7.5], look: [0, 0.7, 0]   },
  { t: 0.15, pos: [4.0, 3.0, 6.0], look: [0, 0.75, 0]  },
  { t: 0.30, pos: [2.5, 2.5, 5.0], look: [0, 0.8, 0]   },
  { t: 0.45, pos: [-1.0, 2.3, 6.5], look: [0.5, 0.9, 0] },
  { t: 0.58, pos: [-0.5, 2.0, 5.0], look: [0, 0.85, 0] },
  { t: 0.72, pos: [1.8, 2.2, 4.5], look: [-0.3, 0.9, 0]},
  { t: 0.85, pos: [1.0, 1.7, 3.2], look: [0, 0.8, 0]   },
  { t: 1.00, pos: [0.3, 1.4, 2.3], look: [0, 0.82, 0]  },
];

function interpCam(kf, t) {
  const last = kf.length - 1;
  if (t <= kf[0].t)    return { pos: [...kf[0].pos], look: [...kf[0].look] };
  if (t >= kf[last].t) return { pos: [...kf[last].pos], look: [...kf[last].look] };
  for (let i = 0; i < last; i++) {
    if (t >= kf[i].t && t <= kf[i + 1].t) {
      const local = easeInOutCubic((t - kf[i].t) / (kf[i + 1].t - kf[i].t));
      return {
        pos: kf[i].pos.map((v, j) => THREE.MathUtils.lerp(v, kf[i + 1].pos[j], local)),
        look: kf[i].look.map((v, j) => THREE.MathUtils.lerp(v, kf[i + 1].look[j], local)),
      };
    }
  }
  return { pos: [...kf[last].pos], look: [...kf[last].look] };
}


// ═══════════════════════════════════════════════════════════════════════════════
// RESTAURANT ENVIRONMENT
// ═══════════════════════════════════════════════════════════════════════════════

function WoodFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshPhysicalMaterial color="#2E1A0E" roughness={0.55} metalness={0.02} clearcoat={0.3} clearcoatRoughness={0.4} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 7.5) * 1.25, 0.001, 0]} receiveShadow>
          <planeGeometry args={[0.008, 20]} />
          <meshStandardMaterial color="#1E0F06" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Walls() {
  const wallColor = '#D8C8B0';
  const wainscotColor = '#4A3020';
  const molding = '#3A2215';
  return (
    <group>
      <mesh position={[0, 1.75, -6]} receiveShadow>
        <boxGeometry args={[20, 3.5, 0.25]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.55, -5.86]}>
        <boxGeometry args={[20, 1.1, 0.04]} />
        <meshStandardMaterial color={wainscotColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.12, -5.84]}>
        <boxGeometry args={[20, 0.06, 0.06]} />
        <meshStandardMaterial color={molding} roughness={0.7} />
      </mesh>
      <mesh position={[-8, 1.75, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[20, 3.5, 0.25]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>
      <mesh position={[-7.86, 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[20, 1.1, 0.04]} />
        <meshStandardMaterial color={wainscotColor} roughness={0.8} />
      </mesh>
      <mesh position={[8, 1.75, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[20, 3.5, 0.25]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>
      <mesh position={[7.86, 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[20, 1.1, 0.04]} />
        <meshStandardMaterial color={wainscotColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Ceiling() {
  return (
    <group>
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[20, 0.15, 20]} />
        <meshStandardMaterial color="#2D1F14" roughness={0.95} />
      </mesh>
      {[[-2, -2], [2, -2], [0, 1], [-2, 4], [2, 4]].map(([x, z], i) => (
        <group key={i} position={[x, 3.42, z]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.18, 0.06, 24]} />
            <meshStandardMaterial color="#1A1209" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <circleGeometry args={[0.12, 24]} />
            <meshStandardMaterial color="#FFF5E0" emissive="#FFE4B5" emissiveIntensity={2} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WallDecor() {
  return (
    <group>
      <group position={[0, 2.2, -5.82]}>
        <mesh>
          <boxGeometry args={[1.6, 1.1, 0.06]} />
          <meshStandardMaterial color="#3A2510" roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.4, 0.9]} />
          <meshStandardMaterial color="#6B4C3B" roughness={0.95} />
        </mesh>
      </group>
      {[[-3, 2.3, -5.78], [3, 2.3, -5.78]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <boxGeometry args={[0.08, 0.2, 0.1]} />
            <meshStandardMaterial color="#C9A86C" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.12, 0.04]}>
            <cylinderGeometry args={[0.06, 0.04, 0.12, 12]} />
            <meshStandardMaterial color="#FFF8E7" emissive="#FFD699" emissiveIntensity={1.5} transparent opacity={0.85} />
          </mesh>
          <pointLight position={[0, 0.15, 0.08]} intensity={0.8} distance={4} color="#FFD699" />
        </group>
      ))}
      <group position={[-5, 0, -4]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 0.5, 16]} />
          <meshStandardMaterial color="#8B5E3C" roughness={0.85} />
        </mesh>
        {[[0, 0.7, 0], [-0.15, 0.6, 0.1], [0.12, 0.65, -0.08], [0.08, 0.75, 0.12], [-0.1, 0.8, -0.05]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.12 + i * 0.01, 12, 12]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#2D5A27' : '#3A7D32'} roughness={0.85} />
          </mesh>
        ))}
      </group>
      <group position={[5.5, 0, -3.5]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.18, 0.14, 0.4, 16]} />
          <meshStandardMaterial color="#6B4226" roughness={0.85} />
        </mesh>
        {[[0, 0.6, 0], [-0.1, 0.55, 0.08], [0.1, 0.58, -0.06]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#386B30" roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function BackgroundTables() {
  const TableSimple = ({ pos }) => (
    <group position={pos}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.04, 24]} />
        <meshStandardMaterial color="#4A3422" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 12]} />
        <meshStandardMaterial color="#3A2A1A" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.03, 16]} />
        <meshStandardMaterial color="#3A2A1A" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
  return (
    <group>
      <TableSimple pos={[-4, 0, -2]} />
      <TableSimple pos={[4.5, 0, -3]} />
      <TableSimple pos={[-3.5, 0, 3]} />
      <TableSimple pos={[5, 0, 2.5]} />
    </group>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// DINING TABLE WITH SETTING
// ═══════════════════════════════════════════════════════════════════════════════

function DiningTable({ tableRef }) {
  return (
    <group ref={tableRef}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.05, 48]} />
        <meshPhysicalMaterial color="#4A2C17" roughness={0.35} metalness={0.05} clearcoat={0.8} clearcoatRoughness={0.15} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <torusGeometry args={[0.7, 0.025, 8, 48]} />
        <meshStandardMaterial color="#3D2212" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.68, 16]} />
        <meshStandardMaterial color="#3A2A1A" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.35, 0.06, 24]} />
        <meshStandardMaterial color="#3A2A1A" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.77, 0]} receiveShadow>
        <boxGeometry args={[1.2, 0.008, 0.28]} />
        <meshStandardMaterial color="#FAF5EE" roughness={0.8} />
      </mesh>
      {/* Plate 1 (customer side) */}
      <group position={[0, 0.77, -0.3]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.015, 32]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.08} metalness={0.02} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
        <mesh position={[0, 0.005, 0]}>
          <torusGeometry args={[0.16, 0.004, 6, 32]} />
          <meshStandardMaterial color="#E8E8E8" roughness={0.2} />
        </mesh>
      </group>
      {/* Plate 2 (opposite side) */}
      <group position={[0, 0.77, 0.3]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.015, 32]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.08} metalness={0.02} clearcoat={1} clearcoatRoughness={0.05} />
        </mesh>
        <mesh position={[0, 0.005, 0]}>
          <torusGeometry args={[0.16, 0.004, 6, 32]} />
          <meshStandardMaterial color="#E8E8E8" roughness={0.2} />
        </mesh>
      </group>
      {/* Wine Glasses */}
      <group position={[0.25, 0.77, -0.28]}>
        <mesh><cylinderGeometry args={[0.025, 0.035, 0.1, 16, 1, true]} />
          <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.25} roughness={0.05} metalness={0.1} transmission={0.9} thickness={0.5} /></mesh>
        <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.008, 0.008, 0.06, 8]} />
          <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.3} roughness={0.1} transmission={0.85} /></mesh>
        <mesh position={[0, -0.08, 0]}><cylinderGeometry args={[0.03, 0.03, 0.005, 16]} />
          <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.3} roughness={0.1} transmission={0.85} /></mesh>
      </group>
      <group position={[-0.22, 0.77, 0.32]}>
        <mesh><cylinderGeometry args={[0.025, 0.035, 0.1, 16, 1, true]} />
          <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.25} roughness={0.05} metalness={0.1} transmission={0.9} thickness={0.5} /></mesh>
        <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.008, 0.008, 0.06, 8]} />
          <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.3} roughness={0.1} transmission={0.85} /></mesh>
        <mesh position={[0, -0.08, 0]}><cylinderGeometry args={[0.03, 0.03, 0.005, 16]} />
          <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.3} roughness={0.1} transmission={0.85} /></mesh>
      </group>
      {/* Cutlery */}
      <mesh position={[-0.22, 0.775, -0.3]} rotation={[0, 0.05, 0]}>
        <boxGeometry args={[0.008, 0.004, 0.14]} /><meshStandardMaterial color="#C0C0C0" metalness={0.92} roughness={0.12} /></mesh>
      <mesh position={[0.22, 0.775, -0.3]} rotation={[0, -0.05, 0]}>
        <boxGeometry args={[0.008, 0.004, 0.14]} /><meshStandardMaterial color="#C0C0C0" metalness={0.92} roughness={0.12} /></mesh>
      <mesh position={[-0.22, 0.775, 0.3]} rotation={[0, 0.05, 0]}>
        <boxGeometry args={[0.008, 0.004, 0.14]} /><meshStandardMaterial color="#C0C0C0" metalness={0.92} roughness={0.12} /></mesh>
      <mesh position={[0.22, 0.775, 0.3]} rotation={[0, -0.05, 0]}>
        <boxGeometry args={[0.008, 0.004, 0.14]} /><meshStandardMaterial color="#C0C0C0" metalness={0.92} roughness={0.12} /></mesh>
      {/* Napkins */}
      <mesh position={[-0.14, 0.775, -0.3]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <planeGeometry args={[0.1, 0.1]} /><meshStandardMaterial color="#FAF5EE" roughness={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0.14, 0.775, 0.3]} rotation={[-Math.PI / 2, 0, -0.3]}>
        <planeGeometry args={[0.1, 0.1]} /><meshStandardMaterial color="#FAF5EE" roughness={0.85} side={THREE.DoubleSide} /></mesh>
      {/* Candle Centerpiece */}
      <group position={[0, 0.77, 0]}>
        <mesh><cylinderGeometry args={[0.035, 0.03, 0.04, 12]} />
          <meshStandardMaterial color="#C9A86C" metalness={0.75} roughness={0.25} /></mesh>
        <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.015, 0.015, 0.1, 12]} />
          <meshStandardMaterial color="#FFF8E7" roughness={0.7} /></mesh>
        <mesh position={[0, 0.12, 0]}><sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#FFAA33" emissive="#FF8800" emissiveIntensity={3} /></mesh>
      </group>
    </group>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// DINING CHAIRS
// ═══════════════════════════════════════════════════════════════════════════════

function DiningChair({ chairRef, mirror = false }) {
  const dir = mirror ? -1 : 1;
  const legColor = '#3A2A1A';
  const seatColor = '#2C1810';
  return (
    <group ref={chairRef}>
      <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.05, 0.36]} /><meshStandardMaterial color={seatColor} roughness={0.85} /></mesh>
      <mesh position={[0, 0.495, 0]} castShadow>
        <boxGeometry args={[0.34, 0.02, 0.32]} /><meshStandardMaterial color="#3D2618" roughness={0.9} /></mesh>
      <mesh position={[0, 0.72, dir * -0.16]} castShadow>
        <boxGeometry args={[0.34, 0.48, 0.025]} /><meshStandardMaterial color={legColor} roughness={0.7} /></mesh>
      <mesh position={[0, 0.68, dir * -0.145]} castShadow>
        <boxGeometry args={[0.28, 0.3, 0.02]} /><meshStandardMaterial color={seatColor} roughness={0.9} /></mesh>
      <mesh position={[-0.16, 0.22, dir * 0.15]} castShadow>
        <boxGeometry args={[0.03, 0.44, 0.03]} /><meshStandardMaterial color={legColor} roughness={0.6} metalness={0.05} /></mesh>
      <mesh position={[0.16, 0.22, dir * 0.15]} castShadow>
        <boxGeometry args={[0.03, 0.44, 0.03]} /><meshStandardMaterial color={legColor} roughness={0.6} metalness={0.05} /></mesh>
      <mesh position={[-0.16, 0.48, dir * -0.15]} castShadow>
        <boxGeometry args={[0.03, 0.96, 0.03]} /><meshStandardMaterial color={legColor} roughness={0.6} metalness={0.05} /></mesh>
      <mesh position={[0.16, 0.48, dir * -0.15]} castShadow>
        <boxGeometry args={[0.03, 0.96, 0.03]} /><meshStandardMaterial color={legColor} roughness={0.6} metalness={0.05} /></mesh>
      <mesh position={[0, 0.12, dir * 0.15]}>
        <boxGeometry args={[0.28, 0.02, 0.02]} /><meshStandardMaterial color={legColor} roughness={0.6} /></mesh>
    </group>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// HUMANOID FIGURES
// ═══════════════════════════════════════════════════════════════════════════════

function CustomerFigure({ customerRef, armSwingRef, legSwingRef }) {
  const skinMat = { color: '#C8956C', roughness: 0.45, metalness: 0.02 };
  const hairColor = '#1A1209';
  const shirtColor = '#1E3A5F';
  const shirtAccent = '#162D4A';
  const pantsColor = '#1A1A2E';
  const pantsAccent = '#141428';
  const shoeColor = '#1A1209';
  const beltColor = '#3A2215';

  return (
    <group ref={customerRef}>
      {/* ── HEAD ── */}
      <group position={[0, 1.62, 0]}>
        {/* Cranium - slightly elongated sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshPhysicalMaterial {...skinMat} clearcoat={0.15} clearcoatRoughness={0.6} />
        </mesh>
        {/* Jaw / chin definition */}
        <mesh position={[0, -0.04, 0.03]} castShadow>
          <sphereGeometry args={[0.065, 24, 16]} />
          <meshPhysicalMaterial {...skinMat} clearcoat={0.1} clearcoatRoughness={0.7} />
        </mesh>
        {/* Hair - full cap with volume */}
        <mesh position={[0, 0.04, -0.01]}>
          <sphereGeometry args={[0.108, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hairColor} roughness={0.85} />
        </mesh>
        {/* Side hair */}
        <mesh position={[-0.08, 0.01, -0.03]}>
          <sphereGeometry args={[0.05, 16, 12]} />
          <meshStandardMaterial color={hairColor} roughness={0.85} />
        </mesh>
        <mesh position={[0.08, 0.01, -0.03]}>
          <sphereGeometry args={[0.05, 16, 12]} />
          <meshStandardMaterial color={hairColor} roughness={0.85} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.1, -0.01, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        <mesh position={[0.1, -0.01, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.02, 0.1]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.012, 0.02, 8, 12]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        {/* Eyebrow ridges */}
        <mesh position={[-0.035, 0.02, 0.085]}>
          <boxGeometry args={[0.035, 0.008, 0.012]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        <mesh position={[0.035, 0.02, 0.085]}>
          <boxGeometry args={[0.035, 0.008, 0.012]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        {/* Eyes - subtle dark recesses */}
        <mesh position={[-0.035, 0.005, 0.09]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.3} />
        </mesh>
        <mesh position={[0.035, 0.005, 0.09]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.3} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.042, 0.1, 16]} />
        <meshPhysicalMaterial {...skinMat} />
      </mesh>

      {/* ── TORSO ── */}
      <group position={[0, 1.3, 0]}>
        {/* Upper torso - trapezoidal shape using scaled cylinder */}
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.12, 0.22, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        {/* Lower torso */}
        <mesh position={[0, -0.16, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.11, 0.12, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        {/* Shoulders - rounded caps */}
        <mesh position={[-0.15, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        <mesh position={[0.15, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.7} />
        </mesh>
        {/* Collar */}
        <mesh position={[0, 0.12, 0.04]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
          <meshStandardMaterial color={shirtAccent} roughness={0.6} />
        </mesh>
        {/* Shirt buttons (subtle line) */}
        {[-0.04, 0, 0.04, 0.08].map((yOff, i) => (
          <mesh key={i} position={[0, yOff, 0.075]}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshStandardMaterial color="#AAB0B8" metalness={0.3} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ── BELT ── */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.115, 0.115, 0.03, 16]} />
        <meshStandardMaterial color={beltColor} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 1.08, 0.1]}>
        <boxGeometry args={[0.025, 0.022, 0.005]} />
        <meshStandardMaterial color="#C0A060" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── HIPS / PANTS ── */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.14, 16]} />
        <meshStandardMaterial color={pantsColor} roughness={0.75} />
      </mesh>

      {/* ── ARMS ── */}
      <group ref={armSwingRef}>
        {/* Left arm */}
        <group position={[-0.18, 1.36, 0]} rotation={[0, 0, 0.08]}>
          {/* Upper arm */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.038, 0.18, 8, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.7} />
          </mesh>
          {/* Elbow joint */}
          <mesh position={[0, -0.22, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color={shirtColor} roughness={0.7} />
          </mesh>
          {/* Forearm (rolled sleeve look) */}
          <mesh position={[0, -0.34, 0.01]} castShadow>
            <capsuleGeometry args={[0.032, 0.16, 8, 16]} />
            <meshStandardMaterial color={shirtAccent} roughness={0.7} />
          </mesh>
          {/* Wrist */}
          <mesh position={[0, -0.44, 0.01]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshPhysicalMaterial {...skinMat} />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.48, 0.015]}>
            <boxGeometry args={[0.035, 0.05, 0.02]} />
            <meshPhysicalMaterial {...skinMat} />
          </mesh>
        </group>
        {/* Right arm */}
        <group position={[0.18, 1.36, 0]} rotation={[0, 0, -0.08]}>
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.038, 0.18, 8, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color={shirtColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.34, -0.01]} castShadow>
            <capsuleGeometry args={[0.032, 0.16, 8, 16]} />
            <meshStandardMaterial color={shirtAccent} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.44, -0.01]}>
            <sphereGeometry args={[0.022, 10, 10]} />
            <meshPhysicalMaterial {...skinMat} />
          </mesh>
          <mesh position={[0, -0.48, -0.015]}>
            <boxGeometry args={[0.035, 0.05, 0.02]} />
            <meshPhysicalMaterial {...skinMat} />
          </mesh>
        </group>
      </group>

      {/* ── LEGS ── */}
      <group ref={legSwingRef}>
        {/* Left leg */}
        <group position={[-0.06, 0.86, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.048, 0.22, 8, 16]} />
            <meshStandardMaterial color={pantsColor} roughness={0.75} />
          </mesh>
          {/* Knee */}
          <mesh position={[0, -0.26, 0]}>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshStandardMaterial color={pantsAccent} roughness={0.75} />
          </mesh>
          {/* Shin */}
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.24, 8, 16]} />
            <meshStandardMaterial color={pantsColor} roughness={0.75} />
          </mesh>
          {/* Ankle */}
          <mesh position={[0, -0.56, 0]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshStandardMaterial color={shoeColor} roughness={0.65} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.6, 0.025]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.12]} />
            <meshStandardMaterial color={shoeColor} roughness={0.6} metalness={0.05} />
          </mesh>
          {/* Shoe sole */}
          <mesh position={[0, -0.62, 0.025]}>
            <boxGeometry args={[0.065, 0.01, 0.125]} />
            <meshStandardMaterial color="#0A0A0A" roughness={0.9} />
          </mesh>
        </group>
        {/* Right leg */}
        <group position={[0.06, 0.86, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <capsuleGeometry args={[0.048, 0.22, 8, 16]} />
            <meshStandardMaterial color={pantsColor} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.26, 0]}>
            <sphereGeometry args={[0.042, 12, 12]} />
            <meshStandardMaterial color={pantsAccent} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.24, 8, 16]} />
            <meshStandardMaterial color={pantsColor} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.56, 0]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshStandardMaterial color={shoeColor} roughness={0.65} />
          </mesh>
          <mesh position={[0, -0.6, 0.025]} castShadow>
            <boxGeometry args={[0.06, 0.04, 0.12]} />
            <meshStandardMaterial color={shoeColor} roughness={0.6} metalness={0.05} />
          </mesh>
          <mesh position={[0, -0.62, 0.025]}>
            <boxGeometry args={[0.065, 0.01, 0.125]} />
            <meshStandardMaterial color="#0A0A0A" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function WaiterFigure({ waiterRef }) {
  const skinMat = { color: '#B8763A', roughness: 0.4, metalness: 0.02 };
  const shirtColor = '#F0EDE8';
  const shirtAccent = '#E4E0DA';
  const vestColor = '#141414';
  const vestAccent = '#1E1E1E';
  const pantsColor = '#111111';
  const pantsAccent = '#0A0A0A';
  const shoeColor = '#0D0D0D';
  const hairColor = '#0A0805';
  const apronColor = '#F5F2ED';

  return (
    <group ref={waiterRef}>
      {/* ── HEAD ── */}
      <group position={[0, 1.65, 0]}>
        {/* Cranium */}
        <mesh castShadow>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshPhysicalMaterial {...skinMat} clearcoat={0.15} clearcoatRoughness={0.6} />
        </mesh>
        {/* Jaw */}
        <mesh position={[0, -0.04, 0.025]} castShadow>
          <sphereGeometry args={[0.06, 24, 16]} />
          <meshPhysicalMaterial {...skinMat} clearcoat={0.1} clearcoatRoughness={0.7} />
        </mesh>
        {/* Hair - neat slicked cut */}
        <mesh position={[0, 0.035, -0.015]}>
          <sphereGeometry args={[0.107, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} metalness={0.05} />
        </mesh>
        {/* Side hair */}
        <mesh position={[-0.085, 0.01, -0.02]}>
          <sphereGeometry args={[0.04, 14, 10]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        <mesh position={[0.085, 0.01, -0.02]}>
          <sphereGeometry args={[0.04, 14, 10]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.1, -0.01, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        <mesh position={[0.1, -0.01, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.02, 0.1]} rotation={[0.3, 0, 0]}>
          <capsuleGeometry args={[0.011, 0.018, 8, 12]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        {/* Eyebrows */}
        <mesh position={[-0.035, 0.02, 0.085]}>
          <boxGeometry args={[0.035, 0.007, 0.01]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        <mesh position={[0.035, 0.02, 0.085]}>
          <boxGeometry args={[0.035, 0.007, 0.01]} />
          <meshStandardMaterial color={hairColor} roughness={0.9} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.035, 0.005, 0.09]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.3} />
        </mesh>
        <mesh position={[0.035, 0.005, 0.09]}>
          <sphereGeometry args={[0.012, 12, 12]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.3} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.53, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.042, 0.1, 16]} />
        <meshPhysicalMaterial {...skinMat} />
      </mesh>

      {/* ── TORSO ── */}
      <group position={[0, 1.32, 0]}>
        {/* White dress shirt - upper */}
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.13, 0.24, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        {/* White shirt - lower */}
        <mesh position={[0, -0.16, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.12, 0.12, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        {/* Shoulders */}
        <mesh position={[-0.15, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.052, 16, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        <mesh position={[0.15, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.052, 16, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        {/* Vest overlay - front */}
        <mesh position={[0, 0, 0.065]} castShadow>
          <boxGeometry args={[0.26, 0.32, 0.01]} />
          <meshStandardMaterial color={vestColor} roughness={0.8} />
        </mesh>
        {/* Vest - back */}
        <mesh position={[0, 0, -0.065]} castShadow>
          <boxGeometry args={[0.26, 0.32, 0.01]} />
          <meshStandardMaterial color={vestAccent} roughness={0.8} />
        </mesh>
        {/* Vest buttons */}
        {[-0.04, 0, 0.04].map((yOff, i) => (
          <mesh key={i} position={[0, yOff, 0.072]}>
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshStandardMaterial color="#C0A060" metalness={0.7} roughness={0.25} />
          </mesh>
        ))}
        {/* Collar notch (V-shape at top) */}
        <mesh position={[-0.03, 0.13, 0.072]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.04, 0.03, 0.008]} />
          <meshStandardMaterial color={shirtAccent} roughness={0.7} />
        </mesh>
        <mesh position={[0.03, 0.13, 0.072]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.04, 0.03, 0.008]} />
          <meshStandardMaterial color={shirtAccent} roughness={0.7} />
        </mesh>
      </group>

      {/* ── APRON (tied at waist, goes to knees) ── */}
      <mesh position={[0, 1.02, 0.07]} castShadow>
        <boxGeometry args={[0.24, 0.44, 0.01]} />
        <meshStandardMaterial color={apronColor} roughness={0.85} />
      </mesh>
      {/* Apron waist tie */}
      <mesh position={[0, 1.2, 0.075]}>
        <boxGeometry args={[0.28, 0.02, 0.005]} />
        <meshStandardMaterial color={apronColor} roughness={0.85} />
      </mesh>

      {/* ── BELT / WAIST ── */}
      <mesh position={[0, 1.08, 0]} castShadow>
        <cylinderGeometry args={[0.125, 0.125, 0.025, 16]} />
        <meshStandardMaterial color={vestColor} roughness={0.6} />
      </mesh>

      {/* ── PANTS ── */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.14, 16]} />
        <meshStandardMaterial color={pantsColor} roughness={0.75} />
      </mesh>

      {/* ── LEFT ARM (down by side) ── */}
      <group position={[-0.19, 1.38, 0]} rotation={[0, 0, 0.12]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.038, 0.18, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.34, 0]} castShadow>
          <capsuleGeometry args={[0.032, 0.16, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.44, 0]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        <mesh position={[0, -0.48, 0.01]}>
          <boxGeometry args={[0.035, 0.05, 0.02]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
      </group>

      {/* ── RIGHT ARM (holding tray up) ── */}
      <group position={[0.19, 1.38, 0.05]} rotation={[-0.8, 0, -0.25]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.038, 0.18, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        <mesh position={[0.08, 0.12, 0.14]} rotation={[-1.2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.032, 0.14, 8, 16]} />
          <meshStandardMaterial color={shirtColor} roughness={0.75} />
        </mesh>
        <mesh position={[0.1, 0.22, 0.22]}>
          <sphereGeometry args={[0.022, 10, 10]} />
          <meshPhysicalMaterial {...skinMat} />
        </mesh>
        {/* Tray in hand */}
        <mesh position={[0.1, 0.24, 0.22]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.012, 24]} />
          <meshPhysicalMaterial color="#C0C0C0" metalness={0.85} roughness={0.1} clearcoat={0.5} />
        </mesh>
      </group>

      {/* ── LEGS ── */}
      {/* Left leg */}
      <group position={[-0.06, 0.86, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.048, 0.22, 8, 16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshStandardMaterial color={pantsAccent} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.24, 8, 16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshStandardMaterial color={shoeColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.6, 0.025]} castShadow>
          <boxGeometry args={[0.06, 0.04, 0.12]} />
          <meshStandardMaterial color={shoeColor} roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.62, 0.025]}>
          <boxGeometry args={[0.065, 0.01, 0.125]} />
          <meshStandardMaterial color="#050505" roughness={0.9} />
        </mesh>
      </group>
      {/* Right leg */}
      <group position={[0.06, 0.86, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow>
          <capsuleGeometry args={[0.048, 0.22, 8, 16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.042, 12, 12]} />
          <meshStandardMaterial color={pantsAccent} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.42, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.24, 8, 16]} />
          <meshStandardMaterial color={pantsColor} roughness={0.75} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshStandardMaterial color={shoeColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.6, 0.025]} castShadow>
          <boxGeometry args={[0.06, 0.04, 0.12]} />
          <meshStandardMaterial color={shoeColor} roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.62, 0.025]}>
          <boxGeometry args={[0.065, 0.01, 0.125]} />
          <meshStandardMaterial color="#050505" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// FOOD PLATE — Vegetarian Thali
// ═══════════════════════════════════════════════════════════════════════════════

function FoodPlate({ foodRef }) {
  return (
    <group ref={foodRef}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.018, 36]} />
        <meshPhysicalMaterial color="#FFFFFF" roughness={0.06} metalness={0.02} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <torusGeometry args={[0.18, 0.005, 8, 36]} /><meshStandardMaterial color="#E8E0D8" roughness={0.15} /></mesh>
      <mesh position={[0.02, 0.03, 0]} castShadow>
        <sphereGeometry args={[0.07, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><meshStandardMaterial color="#FFFDD0" roughness={0.7} /></mesh>
      <mesh position={[-0.08, 0.02, -0.05]} castShadow>
        <sphereGeometry args={[0.045, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.45]} /><meshStandardMaterial color="#E8960C" roughness={0.5} /></mesh>
      <mesh position={[0.08, 0.02, -0.06]} castShadow>
        <sphereGeometry args={[0.04, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.45]} /><meshStandardMaterial color="#4CAF50" roughness={0.55} /></mesh>
      <mesh position={[-0.06, 0.015, 0.07]} rotation={[-0.1, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.008, 20]} /><meshStandardMaterial color="#C68E4E" roughness={0.75} /></mesh>
      <mesh position={[-0.04, 0.02, 0.065]}><sphereGeometry args={[0.008, 6, 6]} /><meshStandardMaterial color="#8B6233" roughness={0.9} /></mesh>
      <mesh position={[-0.07, 0.02, 0.08]}><sphereGeometry args={[0.006, 6, 6]} /><meshStandardMaterial color="#8B6233" roughness={0.9} /></mesh>
      <mesh position={[0.1, 0.015, 0.04]}><sphereGeometry args={[0.015, 8, 8]} /><meshStandardMaterial color="#C62828" roughness={0.6} /></mesh>
      <mesh position={[0.08, 0.015, 0.06]}><sphereGeometry args={[0.012, 8, 8]} /><meshStandardMaterial color="#2E7D32" roughness={0.6} /></mesh>
      <mesh position={[0.12, 0.015, -0.02]} rotation={[0, 0.4, 0.3]}>
        <sphereGeometry args={[0.018, 8, 8, 0, Math.PI]} /><meshStandardMaterial color="#FDD835" roughness={0.5} /></mesh>
      <spotLight position={[0, 3, 0]} angle={0.25} penumbra={0.7} intensity={3} color="#FFF0D4" castShadow />
    </group>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// STEAM PARTICLE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

function SteamParticles({ position = [0, 0, 0], active = false }) {
  const count = 24;
  const refs = useRef([]);
  const particles = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 0.12, z: (Math.random() - 0.5) * 0.12,
      speed: 0.15 + Math.random() * 0.35, phase: Math.random() * Math.PI * 2,
      drift: 0.01 + Math.random() * 0.02, life: Math.random(),
    })),
  []);

  useFrame((_, delta) => {
    particles.forEach((p, i) => {
      const ref = refs.current[i];
      if (!ref) return;
      if (!active) { ref.material.opacity = 0; return; }
      p.life += delta * p.speed * 0.4;
      if (p.life > 1) { p.life = 0; p.x = (Math.random() - 0.5) * 0.12; p.z = (Math.random() - 0.5) * 0.12; }
      ref.position.x = position[0] + p.x + Math.sin(p.phase + p.life * 4) * p.drift * 2;
      ref.position.y = position[1] + p.life * 0.8;
      ref.position.z = position[2] + p.z + Math.cos(p.phase + p.life * 3) * p.drift * 2;
      const opacity = p.life < 0.2 ? (p.life / 0.2) * 0.25 : (1.0 - (p.life - 0.2) / 0.8) * 0.25;
      ref.material.opacity = Math.max(0, opacity);
      ref.scale.setScalar(0.01 + p.life * 0.03);
    });
  });

  return (
    <group>
      {particles.map((_, i) => (
        <mesh key={i} ref={el => (refs.current[i] = el)}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// RESTAURANT LIGHTING
// ═══════════════════════════════════════════════════════════════════════════════

function RestaurantLighting({ heroIntensity = 0 }) {
  const candleRef = useRef();
  useFrame(({ clock }) => {
    if (candleRef.current) {
      const t = clock.getElapsedTime();
      candleRef.current.intensity = 0.6 + Math.sin(t * 8) * 0.1 + Math.sin(t * 13) * 0.05;
    }
  });
  return (
    <group>
      <ambientLight intensity={0.18} color="#FFF0D4" />
      <directionalLight position={[3, 8, 4]} intensity={0.7} color="#FFE8C0" castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-far={30}
        shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0002} />
      <directionalLight position={[-4, 5, -3]} intensity={0.2} color="#A0B8D0" />
      <spotLight position={[0, 3.4, 0]} angle={0.5} penumbra={0.9} intensity={1.8} color="#FFE0B0" castShadow distance={6} />
      <spotLight position={[-3, 3.4, -2]} angle={0.6} penumbra={1} intensity={0.5} color="#FFD8A0" distance={5} />
      <spotLight position={[3, 3.4, 2]} angle={0.6} penumbra={1} intensity={0.5} color="#FFD8A0" distance={5} />
      <spotLight position={[-2, 4, -5]} angle={0.4} penumbra={0.5} intensity={0.8} color="#FFDAB0" distance={12} />
      <pointLight ref={candleRef} position={[0, 0.95, 0]} intensity={0.6} distance={3} color="#FF9933" />
      <spotLight position={[0, 3, 0.5]} angle={0.3} penumbra={0.6} intensity={heroIntensity * 4} color="#FFF5E0" castShadow distance={5} />
    </group>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN STORY SCENE — Animation Orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

export function StoryScene({ scrollYProgress }) {
  const { camera } = useThree();
  const groupRef = useRef();
  const tableRef = useRef();
  const chair1Ref = useRef();
  const chair2Ref = useRef();
  const customerRef = useRef();
  const custArmRef = useRef();
  const custLegRef = useRef();
  const waiterRef = useRef();
  const foodRef = useRef();
  const heroIntensityRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth scroll input with inertia
    if (groupRef.current.userData.smooth === undefined) groupRef.current.userData.smooth = 0;
    const target = scrollYProgress.current;
    const p = THREE.MathUtils.damp(groupRef.current.userData.smooth, target, 3.5, delta);
    groupRef.current.userData.smooth = p;

    // SCENE 1 & 2: Table arranges (0.0 → 0.30)
    const tP = easeInOutQuad(remap(p, 0.0, 0.30));
    if (tableRef.current) {
      tableRef.current.rotation.y = THREE.MathUtils.lerp(0.12, 0, tP);
      tableRef.current.position.x = THREE.MathUtils.lerp(0.15, 0, tP);
    }
    if (chair1Ref.current) {
      chair1Ref.current.position.set(THREE.MathUtils.lerp(-0.2, 0, tP), 0, THREE.MathUtils.lerp(-1.3, -0.7, tP));
      chair1Ref.current.rotation.y = THREE.MathUtils.lerp(0.4, 0, tP);
    }
    if (chair2Ref.current) {
      chair2Ref.current.position.set(THREE.MathUtils.lerp(0.25, 0, tP), 0, THREE.MathUtils.lerp(1.2, 0.7, tP));
      chair2Ref.current.rotation.y = THREE.MathUtils.lerp(-0.3, 0, tP);
    }

    // SCENE 3: Customer walks in and sits (0.28 → 0.58)
    const walkP = remap(p, 0.28, 0.50);
    const sitP  = remap(p, 0.50, 0.58);
    const walkEase = easeInOutQuad(walkP);
    const sitEase  = easeOutQuart(sitP);

    if (customerRef.current) {
      customerRef.current.visible = p > 0.22;
      if (p <= 0.50) {
        const cx = THREE.MathUtils.lerp(6, 0, walkEase);
        const cz = THREE.MathUtils.lerp(2, -0.7, walkEase);
        const bob = walkP > 0 && walkP < 1 ? Math.abs(Math.sin(walkP * Math.PI * 8)) * 0.04 : 0;
        customerRef.current.position.set(cx, bob, cz);
        const turnP = remap(walkP, 0.6, 1.0);
        customerRef.current.rotation.y = THREE.MathUtils.lerp(-Math.PI / 2, 0, easeInOutCubic(turnP));
      } else {
        const sitY = THREE.MathUtils.lerp(0, -0.28, sitEase);
        customerRef.current.position.set(0, sitY, -0.7);
        customerRef.current.rotation.y = 0;
        customerRef.current.rotation.x = THREE.MathUtils.lerp(0, 0.05, sitEase);
      }
      if (custArmRef.current) {
        if (walkP > 0 && walkP < 1 && p <= 0.50) {
          custArmRef.current.rotation.x = Math.sin(walkP * Math.PI * 8) * 0.25;
        } else {
          custArmRef.current.rotation.x = THREE.MathUtils.lerp(custArmRef.current.rotation.x, 0, 0.1);
        }
      }
      if (custLegRef.current) {
        if (walkP > 0 && walkP < 1 && p <= 0.50) {
          custLegRef.current.rotation.x = Math.sin(walkP * Math.PI * 8) * 0.3;
        } else {
          const legBend = THREE.MathUtils.lerp(0, -0.5, sitEase);
          custLegRef.current.rotation.x = THREE.MathUtils.lerp(custLegRef.current.rotation.x, legBend, 0.1);
        }
      }
    }

    // SCENE 4: Waiter approaches with food (0.55 → 0.82)
    const waiterWalkP = remap(p, 0.55, 0.72);
    const waiterServeP = remap(p, 0.72, 0.82);
    const waiterWalkEase = easeInOutQuad(waiterWalkP);
    const waiterServeEase = easeOutQuart(waiterServeP);

    if (waiterRef.current) {
      waiterRef.current.visible = p > 0.50;
      const wx = THREE.MathUtils.lerp(-6, -1, waiterWalkEase);
      const wz = THREE.MathUtils.lerp(-4, -0.2, waiterWalkEase);
      const wBob = waiterWalkP > 0 && waiterWalkP < 1 ? Math.abs(Math.sin(waiterWalkP * Math.PI * 7)) * 0.03 : 0;
      waiterRef.current.position.set(wx, wBob, wz);
      const wTurn = remap(waiterWalkP, 0.5, 1.0);
      waiterRef.current.rotation.y = THREE.MathUtils.lerp(Math.PI / 3, Math.PI / 2, easeInOutCubic(wTurn));
    }

    // Food: follows waiter tray → placed on table
    if (foodRef.current) {
      foodRef.current.visible = p > 0.55;
      if (p <= 0.72) {
        const wx = THREE.MathUtils.lerp(-6, -1, waiterWalkEase);
        const wz = THREE.MathUtils.lerp(-4, -0.2, waiterWalkEase);
        foodRef.current.position.set(wx + 0.32, 1.65, wz + 0.25);
      } else {
        foodRef.current.position.set(
          THREE.MathUtils.lerp(-1 + 0.32, 0, waiterServeEase),
          THREE.MathUtils.lerp(1.65, 0.79, waiterServeEase),
          THREE.MathUtils.lerp(-0.2 + 0.25, -0.3, waiterServeEase),
        );
      }
    }

    // SCENE 5: Hero state (0.82 → 1.0)
    heroIntensityRef.current = easeInOutCubic(remap(p, 0.82, 1.0));

    // CAMERA
    const cam = interpCam(CAM_KF, p);
    camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
    camera.lookAt(cam.look[0], cam.look[1], cam.look[2]);
  });

  return (
    <group ref={groupRef}>
      <fog attach="fog" args={['#0D0A06', 7, 18]} />
      <WoodFloor />
      <Walls />
      <Ceiling />
      <WallDecor />
      <BackgroundTables />
      <DiningTable tableRef={tableRef} />
      <DiningChair chairRef={chair1Ref} mirror={false} />
      <DiningChair chairRef={chair2Ref} mirror={true} />
      <CustomerFigure customerRef={customerRef} armSwingRef={custArmRef} legSwingRef={custLegRef} />
      <WaiterFigure waiterRef={waiterRef} />
      <FoodPlate foodRef={foodRef} />
      <SteamParticles position={[0, 0.85, -0.3]} active={heroIntensityRef.current > 0.1} />
      <RestaurantLighting heroIntensity={heroIntensityRef.current} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} /><shadowMaterial transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

export default StoryScene;

