"use client";

import { useState, useMemo } from "react";
import type { BodyMeasurements, StyleInfo } from "../lib/types";

interface GarmentPreview3DProps {
  measurements: BodyMeasurements;
  style: StyleInfo | null;
  gender: string;
}

function norm(m: BodyMeasurements) {
  const base = 500;
  const scale = base / (m.shoulder_width_cm * 2.8);
  return {
    sh: m.shoulder_width_cm * scale,
    ch: (m.chest_circumference_cm / Math.PI) * scale,
    wa: (m.waist_cm / Math.PI) * scale,
    len: m.shirt_length_cm * scale,
    slv: m.sleeve_length_cm * scale,
    nk: (m.neck_size_cm / Math.PI) * scale * 0.5,
  };
}

function GarmentSVG({ n, m, style, gender, angle }: {
  n: ReturnType<typeof norm>; m: BodyMeasurements; style: StyleInfo | null; gender: string; angle: number;
}) {
  const cx = 280;
  const topY = 70;
  const isFemale = gender === "female";
  const neckType = style?.neck_type || "collar";
  const sleeveType = style?.sleeve_type || "full";
  const lenFactor = style?.length_factor || 1.0;
  const slvF = sleeveType === "half" ? 0.42 : sleeveType === "3-quarter" ? 0.72 : sleeveType === "sleeveless" ? 0 : 1;
  const sleeveLen = n.slv * slvF;
  const isLong = lenFactor > 1.2;

  const shY = topY + 25;
  const chY = shY + n.len * 0.28;
  const waY = shY + n.len * 0.62;
  const hmY = shY + n.len * lenFactor;

  const chW = n.ch * 1.05;
  const waW = n.wa * (isFemale ? 0.85 : 0.97);
  const hmW = isLong ? n.wa * 1.3 : n.wa * 0.99;

  // 3D depth effect based on angle
  const depth = Math.sin(angle * Math.PI / 180) * 0.15;
  const skewX = depth * 20;
  const scaleX = 1 - Math.abs(depth) * 0.3;

  // Fabric
  const fb = isFemale
    ? (isLong ? { m: "#f0d0e0", d: "#c080a0", l: "#f8e8f0", a: "#d4618c" } : { m: "#e0d0f0", d: "#9878c0", l: "#f0e8f8", a: "#7b5ea7" })
    : (neckType === "mandarin" ? { m: "#f5ead6", d: "#c4a97d", l: "#faf3e8", a: "#b8965a" } : { m: "#cfe2f3", d: "#5b8db8", l: "#e8f0f8", a: "#3b82f6" });

  const slvA = 0.35;
  const slvEX = n.sh + sleeveLen * Math.cos(slvA);
  const slvEY = shY + sleeveLen * Math.sin(slvA);
  const slvW = n.ch * 0.28;

  return (
    <g transform={`translate(${skewX}, 0) scale(${scaleX}, 1)`} style={{ transformOrigin: `${cx}px ${(shY + hmY) / 2}px` }}>
      <defs>
        <linearGradient id="g3d" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor={fb.l} />
          <stop offset="40%" stopColor={fb.m} />
          <stop offset="80%" stopColor={fb.d} />
        </linearGradient>
        <filter id="sh3d"><feDropShadow dx="3" dy="4" stdDeviation="5" floodOpacity="0.2" /></filter>
        <pattern id="tx3d" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="transparent" />
          <line x1="0" y1="2.5" x2="5" y2="2.5" stroke={fb.d} strokeWidth="0.2" opacity="0.1" />
        </pattern>
      </defs>

      {/* Sleeves */}
      {sleeveType !== "sleeveless" && (
        <>
          <path d={`M ${cx - n.sh} ${shY}
            L ${cx - slvEX} ${slvEY - slvW * 0.2}
            Q ${cx - slvEX - 3} ${slvEY + slvW * 0.35} ${cx - slvEX + slvW * 0.4} ${slvEY + slvW * 0.7}
            L ${cx - n.sh + 5} ${shY + n.len * 0.18} Z`}
            fill="url(#g3d)" stroke={fb.d} strokeWidth="0.8" filter="url(#sh3d)" />
          <path d={`M ${cx + n.sh} ${shY}
            L ${cx + slvEX} ${slvEY - slvW * 0.2}
            Q ${cx + slvEX + 3} ${slvEY + slvW * 0.35} ${cx + slvEX - slvW * 0.4} ${slvEY + slvW * 0.7}
            L ${cx + n.sh - 5} ${shY + n.len * 0.18} Z`}
            fill="url(#g3d)" stroke={fb.d} strokeWidth="0.8" filter="url(#sh3d)" />
        </>
      )}

      {/* Body */}
      <path d={`M ${cx - n.nk * 0.8} ${topY + 15}
        Q ${cx - n.sh * 0.5} ${topY + 5} ${cx - n.sh} ${shY}
        L ${cx - n.sh + 3} ${shY + n.len * 0.12}
        C ${cx - chW - 2} ${chY - 10} ${cx - chW} ${chY - 3} ${cx - chW} ${chY}
        ${isFemale
          ? `C ${cx - chW + 8} ${(chY + waY) / 2} ${cx - waW - 3} ${waY - 10} ${cx - waW} ${waY}
             C ${cx - hmW} ${(waY + hmY) / 2} ${cx - hmW} ${hmY - 5} ${cx - hmW} ${hmY}`
          : `C ${cx - chW} ${(chY + waY) / 2} ${cx - waW} ${waY - 5} ${cx - waW} ${waY}
             C ${cx - waW} ${(waY + hmY) / 2} ${cx - hmW} ${hmY - 5} ${cx - hmW} ${hmY}`}
        Q ${cx} ${hmY + 4} ${cx + hmW} ${hmY}
        ${isFemale
          ? `C ${cx + hmW} ${hmY - 5} ${cx + hmW} ${(waY + hmY) / 2} ${cx + waW} ${waY}
             C ${cx + waW + 3} ${waY - 10} ${cx + chW - 8} ${(chY + waY) / 2} ${cx + chW} ${chY}`
          : `C ${cx + hmW} ${hmY - 5} ${cx + waW} ${(waY + hmY) / 2} ${cx + waW} ${waY}
             C ${cx + waW} ${waY - 5} ${cx + chW} ${(chY + waY) / 2} ${cx + chW} ${chY}`}
        C ${cx + chW} ${chY - 3} ${cx + chW + 2} ${chY - 10} ${cx + n.sh - 3} ${shY + n.len * 0.12}
        L ${cx + n.sh} ${shY}
        Q ${cx + n.sh * 0.5} ${topY + 5} ${cx + n.nk * 0.8} ${topY + 15} Z`}
        fill="url(#g3d)" stroke={fb.d} strokeWidth="1" filter="url(#sh3d)" />
      {/* Texture overlay */}
      <path d={`M ${cx - n.nk * 0.8} ${topY + 15}
        Q ${cx - n.sh * 0.5} ${topY + 5} ${cx - n.sh} ${shY}
        L ${cx - n.sh + 3} ${shY + n.len * 0.12}
        C ${cx - chW - 2} ${chY - 10} ${cx - chW} ${chY - 3} ${cx - chW} ${chY}
        C ${cx - chW} ${(chY + waY) / 2} ${cx - waW} ${waY - 5} ${cx - waW} ${waY}
        C ${cx - waW} ${(waY + hmY) / 2} ${cx - hmW} ${hmY - 5} ${cx - hmW} ${hmY}
        Q ${cx} ${hmY + 4} ${cx + hmW} ${hmY}
        C ${cx + hmW} ${hmY - 5} ${cx + waW} ${(waY + hmY) / 2} ${cx + waW} ${waY}
        C ${cx + waW} ${waY - 5} ${cx + chW} ${(chY + waY) / 2} ${cx + chW} ${chY}
        C ${cx + chW} ${chY - 3} ${cx + chW + 2} ${chY - 10} ${cx + n.sh - 3} ${shY + n.len * 0.12}
        L ${cx + n.sh} ${shY}
        Q ${cx + n.sh * 0.5} ${topY + 5} ${cx + n.nk * 0.8} ${topY + 15} Z`}
        fill="url(#tx3d)" />

      {/* Placket + buttons */}
      {(neckType === "collar" || neckType === "mandarin") && (
        <g>
          <line x1={cx} y1={topY + 28} x2={cx} y2={hmY - 3} stroke={fb.d} strokeWidth="0.5" opacity="0.2" />
          {[0.1, 0.22, 0.34, 0.46, 0.58, 0.7, 0.84].map((p, i) => (
            <g key={i}>
              <circle cx={cx} cy={shY + n.len * p} r={3} fill="#f1f3f5" stroke="#ccc" strokeWidth="0.5" />
              <circle cx={cx - 1} cy={shY + n.len * p - 1} r={0.5} fill="#aaa" />
              <circle cx={cx + 1} cy={shY + n.len * p + 1} r={0.5} fill="#aaa" />
            </g>
          ))}
        </g>
      )}

      {/* Collar */}
      {neckType === "collar" && (
        <g>
          <path d={`M ${cx - n.nk} ${topY + 12} Q ${cx} ${topY - 5} ${cx + n.nk} ${topY + 12}`}
            fill={fb.l} stroke={fb.d} strokeWidth="0.8" />
          <path d={`M ${cx - n.nk * 0.5} ${topY + 9} L ${cx - n.sh * 0.5} ${topY + 28} L ${cx - n.nk * 0.1} ${topY + 22} Z`}
            fill={fb.l} stroke={fb.d} strokeWidth="0.6" />
          <path d={`M ${cx + n.nk * 0.5} ${topY + 9} L ${cx + n.sh * 0.5} ${topY + 28} L ${cx + n.nk * 0.1} ${topY + 22} Z`}
            fill={fb.l} stroke={fb.d} strokeWidth="0.6" />
        </g>
      )}
      {neckType === "mandarin" && (
        <path d={`M ${cx - n.nk * 0.7} ${topY + 14} Q ${cx} ${topY - 5} ${cx + n.nk * 0.7} ${topY + 14}`}
          fill={fb.l} stroke={fb.d} strokeWidth="1" />
      )}
      {neckType === "round" && (
        <path d={`M ${cx - n.nk * 0.8} ${topY + 15} Q ${cx} ${topY - 10} ${cx + n.nk * 0.8} ${topY + 15}`}
          fill="none" stroke={fb.d} strokeWidth="2.5" />
      )}
      {neckType === "v-neck" && (
        <path d={`M ${cx - n.nk * 0.8} ${topY + 15} L ${cx} ${topY + 50} L ${cx + n.nk * 0.8} ${topY + 15}`}
          fill="none" stroke={fb.d} strokeWidth="2" />
      )}

      {/* Embroidery for long styles */}
      {isLong && (
        <g opacity="0.25">
          <line x1={cx - hmW + 5} y1={hmY - 8} x2={cx + hmW - 5} y2={hmY - 8}
            stroke={fb.a} strokeWidth="2" strokeDasharray="5,3" />
          <line x1={cx - hmW + 5} y1={hmY - 3} x2={cx + hmW - 5} y2={hmY - 3}
            stroke={fb.a} strokeWidth="1" />
        </g>
      )}

      {/* Measurement annotations */}
      <g fontFamily="system-ui, sans-serif" opacity="0.85">
        {/* Shoulder */}
        <line x1={cx - n.sh} y1={shY - 8} x2={cx + n.sh} y2={shY - 8} stroke="#22c55e" strokeWidth="1.5" />
        <rect x={cx - 28} y={shY - 24} width="56" height="14" rx="3" fill="#0d1117ee" />
        <text x={cx} y={shY - 14} textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="600">{m.shoulder_width_cm} cm</text>

        {/* Chest */}
        <line x1={cx - chW} y1={chY} x2={cx + chW} y2={chY} stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" />
        <rect x={cx + chW + 5} y={chY - 9} width="62" height="14" rx="3" fill="#0d1117ee" />
        <text x={cx + chW + 10} y={chY + 2} fill="#ef4444" fontSize="8" fontWeight="600">Chest {m.chest_circumference_cm}</text>

        {/* Waist */}
        <line x1={cx - waW} y1={waY} x2={cx + waW} y2={waY} stroke="#a855f7" strokeWidth="1" strokeDasharray="4,3" />
        <rect x={cx + waW + 5} y={waY - 9} width="58" height="14" rx="3" fill="#0d1117ee" />
        <text x={cx + waW + 10} y={waY + 2} fill="#a855f7" fontSize="8" fontWeight="600">Waist {m.waist_cm}</text>

        {/* Length */}
        <line x1={cx - n.sh - 16} y1={shY} x2={cx - n.sh - 16} y2={hmY} stroke="#06b6d4" strokeWidth="1.5" />
        <line x1={cx - n.sh - 20} y1={shY} x2={cx - n.sh - 12} y2={shY} stroke="#06b6d4" strokeWidth="1" />
        <line x1={cx - n.sh - 20} y1={hmY} x2={cx - n.sh - 12} y2={hmY} stroke="#06b6d4" strokeWidth="1" />
        <rect x={cx - n.sh - 58} y={(shY + hmY) / 2 - 9} width="40" height="14" rx="3" fill="#0d1117ee" />
        <text x={cx - n.sh - 38} y={(shY + hmY) / 2 + 2} textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="600">{m.shirt_length_cm}</text>

        {/* Sleeve */}
        {sleeveType !== "sleeveless" && (
          <>
            <line x1={cx + n.sh} y1={shY} x2={cx + slvEX} y2={slvEY} stroke="#f97316" strokeWidth="1.5" />
            <rect x={cx + slvEX - 30} y={slvEY + 6} width="60" height="14" rx="3" fill="#0d1117ee" />
            <text x={cx + slvEX} y={slvEY + 16} textAnchor="middle" fill="#f97316" fontSize="8" fontWeight="600">{m.sleeve_length_cm} cm</text>
          </>
        )}

        {/* Neck */}
        <rect x={cx - 32} y={topY - 18} width="64" height="14" rx="3" fill="#0d1117ee" />
        <text x={cx} y={topY - 8} textAnchor="middle" fill="#eab308" fontSize="8" fontWeight="600">Neck {m.neck_size_cm} cm</text>
      </g>
    </g>
  );
}

export default function GarmentPreview3D({ measurements, style, gender }: GarmentPreview3DProps) {
  const n = useMemo(() => norm(measurements), [measurements]);
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lastX, setLastX] = useState(0);
  const styleName = style?.name || (gender === "female" ? "Blouse" : "Shirt");

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setLastX(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientX - lastX;
    setAngle((a) => Math.max(-45, Math.min(45, a + delta * 0.5)));
    setLastX(e.clientX);
  };
  const handlePointerUp = () => setDragging(false);

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div>
          <h3 className="text-sm font-medium text-white">3D Garment View</h3>
          <p className="text-[10px] text-gray-500">{styleName} — drag to rotate</p>
        </div>
        <div className="flex gap-1 items-center text-[9px] text-gray-500">
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Shoulder</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Chest</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Waist</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />Length</span>
          <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Sleeve</span>
        </div>
      </div>
      <div
        className="cursor-grab active:cursor-grabbing select-none"
        style={{ perspective: "800px" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div style={{ transform: `rotateY(${angle}deg)`, transformStyle: "preserve-3d", transition: dragging ? "none" : "transform 0.3s ease" }}>
          <svg viewBox="0 0 560 460" className="w-full" style={{ maxHeight: 420 }}>
            <rect width="560" height="460" fill="#1a1a2e" />
            <radialGradient id="bg3d" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#111827" />
            </radialGradient>
            <rect width="560" height="460" fill="url(#bg3d)" />
            <GarmentSVG n={n} m={measurements} style={style} gender={gender} angle={angle} />
          </svg>
        </div>
      </div>

      {/* Angle indicator */}
      <div className="px-4 py-2 flex items-center gap-2 border-t border-gray-700/30">
        <span className="text-[10px] text-gray-500">Rotate</span>
        <input type="range" min="-45" max="45" value={angle} onChange={(e) => setAngle(Number(e.target.value))}
          className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
        <button onClick={() => setAngle(0)} className="text-[10px] text-gray-500 hover:text-white transition bg-gray-700 px-2 py-0.5 rounded">
          Reset
        </button>
      </div>
    </div>
  );
}
