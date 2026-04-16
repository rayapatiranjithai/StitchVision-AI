"use client";

import { Suspense, useRef, useMemo, useEffect, Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { BodyMeasurements, StyleInfo } from "../lib/types";

// ── Error Boundary ──────────────────────────────────────────────────
interface EBProps { children: ReactNode; fallback: ReactNode }
interface EBState { hasError: boolean }

class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// ── Types ───────────────────────────────────────────────────────────
interface GarmentPreview3DProps {
  measurements: BodyMeasurements;
  style: StyleInfo | null;
  gender: string;
}

const S = 0.01;

interface P {
  shW: number; chW: number; waW: number; len: number;
  slvLen: number; nkW: number; nkType: string; slvType: string;
  gender: string; lenFactor: number;
}

function buildP(m: BodyMeasurements, style: StyleInfo | null, gender: string): P {
  const st = style?.sleeve_type || "full";
  const sf = st === "half" ? 0.42 : st === "3-quarter" ? 0.72 : st === "sleeveless" ? 0 : 1;
  return {
    shW: m.shoulder_width_cm * S,
    chW: (m.chest_circumference_cm / Math.PI) * S,
    waW: (m.waist_cm / Math.PI) * S,
    len: m.shirt_length_cm * S,
    slvLen: m.sleeve_length_cm * S * sf,
    nkW: (m.neck_size_cm / Math.PI) * S * 0.5,
    nkType: style?.neck_type || "collar",
    slvType: st,
    gender,
    lenFactor: style?.length_factor || 1,
  };
}

// ── Body Mesh ───────────────────────────────────────────────────────
function Body({ p }: { p: P }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const isFemale = p.gender === "female";

  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const hW = p.lenFactor > 1.2 ? p.waW * 1.2 : p.waW;
    const chY = -p.len * 0.3;
    const waY = -p.len * 0.65;
    const hmY = -p.len;

    s.moveTo(-p.nkW, 0);
    s.quadraticCurveTo(-p.nkW - 0.01, -0.02, -p.shW, -0.04);
    s.quadraticCurveTo(-p.shW - 0.005, chY * 0.5, -p.chW, chY);
    if (isFemale) {
      s.quadraticCurveTo(-p.chW + 0.015, (chY + waY) / 2, -p.waW * 0.85, waY);
      s.quadraticCurveTo(-hW * 1.05, (waY + hmY) / 2, -hW * 1.05, hmY);
      s.quadraticCurveTo(0, hmY - 0.008, hW * 1.05, hmY);
      s.quadraticCurveTo(hW * 1.05, (waY + hmY) / 2, p.waW * 0.85, waY);
      s.quadraticCurveTo(p.chW - 0.015, (chY + waY) / 2, p.chW, chY);
    } else {
      s.quadraticCurveTo(-p.chW, (chY + waY) / 2, -p.waW * 0.95, waY);
      s.quadraticCurveTo(-p.waW, (waY + hmY) / 2, -p.waW * 0.98, hmY);
      s.lineTo(p.waW * 0.98, hmY);
      s.quadraticCurveTo(p.waW, (waY + hmY) / 2, p.waW * 0.95, waY);
      s.quadraticCurveTo(p.chW, (chY + waY) / 2, p.chW, chY);
    }
    s.quadraticCurveTo(p.shW + 0.005, chY * 0.5, p.shW, -0.04);
    s.quadraticCurveTo(p.nkW + 0.01, -0.02, p.nkW, 0);
    s.quadraticCurveTo(0, 0.015, -p.nkW, 0);

    const g = new THREE.ExtrudeGeometry(s, {
      depth: p.chW * 0.55, bevelEnabled: true,
      bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 20,
    });
    g.center();
    return g;
  }, [p, isFemale]);

  useEffect(() => () => { geo.dispose(); }, [geo]);

  return (
    <mesh ref={meshRef} geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial
        color={isFemale ? "#9b59b6" : "#3498db"}
        roughness={0.65} metalness={0.05} side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Sleeve Mesh ─────────────────────────────────────────────────────
function Sleeve({ p, side }: { p: P; side: "left" | "right" }) {
  if (p.slvType === "sleeveless" || p.slvLen <= 0) return null;
  const dir = side === "left" ? -1 : 1;
  const tW = p.chW * 0.32;
  const bW = p.chW * 0.22;

  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0, -p.slvLen);
    s.quadraticCurveTo(bW * 0.5, -p.slvLen - 0.003, bW, -p.slvLen);
    s.lineTo(tW, 0);
    s.quadraticCurveTo(tW * 0.5, 0.003, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: tW * 0.7, bevelEnabled: true,
      bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, curveSegments: 12,
    });
    g.center();
    return g;
  }, [p.slvLen, tW, bW]);

  useEffect(() => () => { geo.dispose(); }, [geo]);

  return (
    <mesh geometry={geo}
      position={[dir * (p.shW + tW * 0.25), 0, 0]}
      rotation={[0, 0, dir * 0.25]} castShadow>
      <meshStandardMaterial
        color={p.gender === "female" ? "#8e44ad" : "#2980b9"}
        roughness={0.65} metalness={0.05} side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ── Neck Detail ─────────────────────────────────────────────────────
function Neck({ p }: { p: P }) {
  if (p.nkType === "collar") {
    return (
      <group position={[0, 0.025, 0]}>
        <mesh><torusGeometry args={[p.nkW * 1.1, 0.01, 6, 20, Math.PI]} /><meshStandardMaterial color="#fff" roughness={0.4} /></mesh>
        <mesh position={[-p.nkW * 0.6, -0.015, 0.015]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[p.nkW * 0.45, 0.025, 0.003]} /><meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </mesh>
        <mesh position={[p.nkW * 0.6, -0.015, 0.015]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[p.nkW * 0.45, 0.025, 0.003]} /><meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </mesh>
      </group>
    );
  }
  if (p.nkType === "mandarin") {
    return (
      <mesh position={[0, 0.02, 0]}>
        <torusGeometry args={[p.nkW * 1.05, 0.013, 6, 20, Math.PI]} />
        <meshStandardMaterial color={p.gender === "female" ? "#a78bfa" : "#e8d5b7"} roughness={0.5} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 0.012, 0]}>
      <torusGeometry args={[p.nkW, 0.006, 6, 20, Math.PI]} />
      <meshStandardMaterial color="#d4d4d8" roughness={0.6} />
    </mesh>
  );
}

// ── Measurement Line (cylinder-based, no THREE.Line) ────────────────
function MLine({ a, b, color }: { a: [number, number, number]; b: [number, number, number]; color: string }) {
  const { pos, rot, len } = useMemo(() => {
    const s = new THREE.Vector3(...a);
    const e = new THREE.Vector3(...b);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    const dist = s.distanceTo(e);
    const dir = e.clone().sub(s).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const eu = new THREE.Euler().setFromQuaternion(q);
    return { pos: mid.toArray() as [number, number, number], rot: eu, len: dist };
  }, [a, b]);

  return (
    <mesh position={pos} rotation={rot}>
      <cylinderGeometry args={[0.0008, 0.0008, len, 4]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

// ── Labels ──────────────────────────────────────────────────────────
function Labels({ p }: { p: P }) {
  const chY = -p.len * 0.3;
  const waY = -p.len * 0.65;
  const z = p.chW * 0.32;

  return (
    <group>
      <MLine a={[-p.shW, -0.04, z]} b={[p.shW, -0.04, z]} color="#22c55e" />
      <Text position={[0, -0.015, z + 0.02]} fontSize={0.016} color="#22c55e" anchorX="center">Shoulder</Text>

      <MLine a={[-p.chW, chY, z]} b={[p.chW, chY, z]} color="#ef4444" />
      <Text position={[p.chW + 0.03, chY, z]} fontSize={0.014} color="#ef4444" anchorX="left">Chest</Text>

      <MLine a={[-p.waW * 0.95, waY, z]} b={[p.waW * 0.95, waY, z]} color="#a855f7" />
      <Text position={[p.waW + 0.03, waY, z]} fontSize={0.014} color="#a855f7" anchorX="left">Waist</Text>

      <MLine a={[p.shW + 0.03, 0, z]} b={[p.shW + 0.03, -p.len, z]} color="#06b6d4" />
      <Text position={[p.shW + 0.05, -p.len * 0.5, z]} fontSize={0.014} color="#06b6d4" anchorX="left">Length</Text>

      {p.slvLen > 0 && (
        <>
          <MLine a={[-p.shW, -0.04, z]} b={[-p.shW - p.slvLen * 0.65, -p.slvLen * 0.65, z]} color="#f97316" />
          <Text position={[-p.shW - p.slvLen * 0.33, -p.slvLen * 0.28, z + 0.02]} fontSize={0.014} color="#f97316" anchorX="center">Sleeve</Text>
        </>
      )}
    </group>
  );
}

// ── Rotating Scene ──────────────────────────────────────────────────
function Scene({ p }: { p: P }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.12; });

  return (
    <group ref={ref} position={[0, p.len * 0.5, 0]}>
      <Body p={p} />
      <Sleeve p={p} side="left" />
      <Sleeve p={p} side="right" />
      <Neck p={p} />
      <Labels p={p} />
    </group>
  );
}

// ── Fallback ────────────────────────────────────────────────────────
function Fallback() {
  return (
    <div className="bg-gray-800 rounded-2xl h-[340px] flex flex-col items-center justify-center">
      <p className="text-gray-400 text-sm">3D view unavailable</p>
      <p className="text-gray-600 text-xs mt-1">Your browser may not support WebGL</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="bg-gray-800 rounded-2xl h-[340px] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────
export default function GarmentPreview3D({ measurements, style, gender }: GarmentPreview3DProps) {
  const p = useMemo(() => buildP(measurements, style, gender), [measurements, style, gender]);
  const styleName = style?.name || (gender === "female" ? "Blouse" : "Shirt");

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div>
          <h3 className="text-sm font-medium text-white">3D Garment View</h3>
          <p className="text-[10px] text-gray-500">{styleName} — drag to rotate, scroll to zoom</p>
        </div>
        <div className="flex gap-1 items-center text-[9px] text-gray-500">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Shoulder</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Chest</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Waist</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />Length</span>
        </div>
      </div>
      <div className="h-[340px] w-full">
        <ErrorBoundary fallback={<Fallback />}>
          <Suspense fallback={<Loading />}>
            <Canvas
              camera={{ position: [0, 0, 1.1], fov: 45 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: false, powerPreference: "default" }}
              onCreated={({ gl }) => { gl.setClearColor("#1f2937"); }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[3, 5, 4]} intensity={0.9} />
              <directionalLight position={[-2, 3, -3]} intensity={0.3} />
              <Scene p={p} />
              <OrbitControls
                enablePan={false}
                enableZoom
                minDistance={0.5}
                maxDistance={2.5}
                minPolarAngle={Math.PI * 0.25}
                maxPolarAngle={Math.PI * 0.75}
              />
            </Canvas>
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
