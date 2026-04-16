"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { BodyMeasurements, StyleInfo } from "../lib/types";

interface GarmentPreview3DProps {
  measurements: BodyMeasurements;
  style: StyleInfo | null;
  gender: string;
}

const S = 0.01; // cm to 3D units

interface Params {
  shoulderW: number;
  chestW: number;
  waistW: number;
  length: number;
  sleeveLen: number;
  neckW: number;
  neckType: string;
  sleeveType: string;
  gender: string;
  lengthFactor: number;
}

function buildParams(m: BodyMeasurements, style: StyleInfo | null, gender: string): Params {
  const sleeveType = style?.sleeve_type || "full";
  const slvF = sleeveType === "half" ? 0.42 : sleeveType === "3-quarter" ? 0.72 : sleeveType === "sleeveless" ? 0 : 1;
  return {
    shoulderW: m.shoulder_width_cm * S,
    chestW: (m.chest_circumference_cm / Math.PI) * S,
    waistW: (m.waist_cm / Math.PI) * S,
    length: m.shirt_length_cm * S,
    sleeveLen: m.sleeve_length_cm * S * slvF,
    neckW: (m.neck_size_cm / Math.PI) * S * 0.5,
    neckType: style?.neck_type || "collar",
    sleeveType,
    gender,
    lengthFactor: style?.length_factor || 1,
  };
}

function GarmentBody({ p }: { p: Params }) {
  const isFemale = p.gender === "female";

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const hemW = p.lengthFactor > 1.2 ? p.waistW * 1.2 : p.waistW;

    s.moveTo(-p.neckW, 0);
    s.quadraticCurveTo(-p.neckW - 0.01, -0.02, -p.shoulderW, -0.04);

    const chY = -p.length * 0.3;
    s.quadraticCurveTo(-p.shoulderW - 0.005, chY * 0.5, -p.chestW, chY);

    const waY = -p.length * 0.65;
    if (isFemale) {
      s.quadraticCurveTo(-p.chestW + 0.015, (chY + waY) / 2, -p.waistW * 0.85, waY);
    } else {
      s.quadraticCurveTo(-p.chestW, (chY + waY) / 2, -p.waistW * 0.95, waY);
    }

    const hmY = -p.length;
    if (isFemale) {
      s.quadraticCurveTo(-hemW * 1.05, (waY + hmY) / 2, -hemW * 1.05, hmY);
    } else {
      s.quadraticCurveTo(-p.waistW, (waY + hmY) / 2, -p.waistW * 0.98, hmY);
    }

    if (isFemale) {
      s.quadraticCurveTo(0, hmY - 0.008, hemW * 1.05, hmY);
      s.quadraticCurveTo(hemW * 1.05, (waY + hmY) / 2, p.waistW * 0.85, waY);
    } else {
      s.lineTo(p.waistW * 0.98, hmY);
      s.quadraticCurveTo(p.waistW, (waY + hmY) / 2, p.waistW * 0.95, waY);
    }

    if (isFemale) {
      s.quadraticCurveTo(p.chestW - 0.015, (chY + waY) / 2, p.chestW, chY);
    } else {
      s.quadraticCurveTo(p.chestW, (chY + waY) / 2, p.chestW, chY);
    }

    s.quadraticCurveTo(p.shoulderW + 0.005, chY * 0.5, p.shoulderW, -0.04);
    s.quadraticCurveTo(p.neckW + 0.01, -0.02, p.neckW, 0);
    s.quadraticCurveTo(0, 0.015, -p.neckW, 0);

    return s;
  }, [p, isFemale]);

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: p.chestW * 0.55,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
      curveSegments: 24,
    });
    geo.center();
    return geo;
  }, [shape, p.chestW]);

  const color = isFemale ? "#9b59b6" : "#3498db";

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Sleeve({ p, side }: { p: Params; side: "left" | "right" }) {
  if (p.sleeveType === "sleeveless" || p.sleeveLen <= 0) return null;

  const dir = side === "left" ? -1 : 1;
  const topW = p.chestW * 0.32;
  const bottomW = p.chestW * 0.22;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0, -p.sleeveLen);
    s.quadraticCurveTo(bottomW * 0.5, -p.sleeveLen - 0.003, bottomW, -p.sleeveLen);
    s.lineTo(topW, 0);
    s.quadraticCurveTo(topW * 0.5, 0.003, 0, 0);
    return s;
  }, [p.sleeveLen, topW, bottomW]);

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: topW * 0.7,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
      curveSegments: 16,
    });
    geo.center();
    return geo;
  }, [shape, topW]);

  const color = p.gender === "female" ? "#8e44ad" : "#2980b9";

  return (
    <mesh geometry={geometry}
      position={[dir * (p.shoulderW + topW * 0.25), 0, 0]}
      rotation={[0, 0, dir * 0.25]}
      castShadow>
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
}

function NeckDetail({ p }: { p: Params }) {
  const isFemale = p.gender === "female";
  if (p.neckType === "collar") {
    return (
      <group position={[0, 0.025, 0]}>
        <mesh>
          <torusGeometry args={[p.neckW * 1.1, 0.01, 8, 24, Math.PI]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[-p.neckW * 0.6, -0.015, 0.015]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[p.neckW * 0.45, 0.025, 0.003]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </mesh>
        <mesh position={[p.neckW * 0.6, -0.015, 0.015]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[p.neckW * 0.45, 0.025, 0.003]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </mesh>
      </group>
    );
  }
  if (p.neckType === "mandarin") {
    return (
      <mesh position={[0, 0.02, 0]}>
        <torusGeometry args={[p.neckW * 1.05, 0.013, 8, 24, Math.PI]} />
        <meshStandardMaterial color={isFemale ? "#a78bfa" : "#e8d5b7"} roughness={0.5} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 0.012, 0]}>
      <torusGeometry args={[p.neckW, 0.006, 8, 24, Math.PI]} />
      <meshStandardMaterial color="#d4d4d8" roughness={0.6} />
    </mesh>
  );
}

function MeasurementLine({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) {
  const geo = useMemo(() => new THREE.BufferGeometry().setFromPoints([from, to]), [from, to]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color }), [color]);
  const line = useMemo(() => new THREE.Line(geo, mat), [geo, mat]);
  return <primitive object={line} />;
}

function Labels({ p }: { p: Params }) {
  const chY = -p.length * 0.3;
  const waY = -p.length * 0.65;
  const z = p.chestW * 0.3;

  return (
    <group>
      {/* Shoulder */}
      <MeasurementLine
        from={new THREE.Vector3(-p.shoulderW, -0.04, z)}
        to={new THREE.Vector3(p.shoulderW, -0.04, z)}
        color="#22c55e"
      />
      <Text position={[0, -0.02, z + 0.02]} fontSize={0.018} color="#22c55e" anchorX="center">
        Shoulder
      </Text>

      {/* Chest */}
      <MeasurementLine
        from={new THREE.Vector3(-p.chestW, chY, z)}
        to={new THREE.Vector3(p.chestW, chY, z)}
        color="#ef4444"
      />
      <Text position={[p.chestW + 0.03, chY, z]} fontSize={0.016} color="#ef4444" anchorX="left">
        Chest
      </Text>

      {/* Waist */}
      <MeasurementLine
        from={new THREE.Vector3(-p.waistW * 0.95, waY, z)}
        to={new THREE.Vector3(p.waistW * 0.95, waY, z)}
        color="#a855f7"
      />
      <Text position={[p.waistW + 0.03, waY, z]} fontSize={0.016} color="#a855f7" anchorX="left">
        Waist
      </Text>

      {/* Length */}
      <MeasurementLine
        from={new THREE.Vector3(p.shoulderW + 0.03, 0, z)}
        to={new THREE.Vector3(p.shoulderW + 0.03, -p.length, z)}
        color="#06b6d4"
      />
      <Text position={[p.shoulderW + 0.05, -p.length * 0.5, z]} fontSize={0.016} color="#06b6d4" anchorX="left">
        Length
      </Text>

      {/* Sleeve */}
      {p.sleeveLen > 0 && (
        <>
          <MeasurementLine
            from={new THREE.Vector3(-p.shoulderW, -0.04, z)}
            to={new THREE.Vector3(-p.shoulderW - p.sleeveLen * 0.7, -p.sleeveLen * 0.7, z)}
            color="#f97316"
          />
          <Text position={[-p.shoulderW - p.sleeveLen * 0.35, -p.sleeveLen * 0.3, z + 0.02]}
            fontSize={0.016} color="#f97316" anchorX="center">
            Sleeve
          </Text>
        </>
      )}
    </group>
  );
}

function RotatingGarment({ p }: { p: Params }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={ref} position={[0, p.length * 0.5, 0]}>
      <GarmentBody p={p} />
      <Sleeve p={p} side="left" />
      <Sleeve p={p} side="right" />
      <NeckDetail p={p} />
      <Labels p={p} />
    </group>
  );
}

export default function GarmentPreview3D({ measurements, style, gender }: GarmentPreview3DProps) {
  const p = useMemo(() => buildParams(measurements, style, gender), [measurements, style, gender]);
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
      <div className="h-[320px] w-full">
        <Canvas camera={{ position: [0, 0, 1.1], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[3, 5, 4]} intensity={1} castShadow />
          <directionalLight position={[-3, 3, -2]} intensity={0.3} />
          <Environment preset="studio" />
          <RotatingGarment p={p} />
          <OrbitControls enablePan={false} enableZoom minDistance={0.5} maxDistance={3}
            minPolarAngle={Math.PI * 0.2} maxPolarAngle={Math.PI * 0.8} />
        </Canvas>
      </div>
    </div>
  );
}
