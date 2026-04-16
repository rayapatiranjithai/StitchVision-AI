"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import DemoSilhouette from "./DemoSilhouette";
import type { BodyMeasurements, StyleInfo, LandmarkPoint } from "../lib/types";

interface VirtualTryOnProps {
  imageUrl: string | null;
  landmarks: Record<string, LandmarkPoint> | null;
  measurements: BodyMeasurements;
  style: StyleInfo | null;
  gender: string;
  isDemoMode?: boolean;
}

type ViewMode = "tryon" | "skeleton" | "points";

const REQUIRED_LANDMARKS = [
  "nose", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
  "left_wrist", "right_wrist", "left_hip", "right_hip",
];

function getFabric(gender: string, style: StyleInfo | null) {
  const nt = style?.neck_type || "collar";
  const isLong = (style?.length_factor || 1) > 1.2;
  if (gender === "female") {
    return isLong
      ? { fill: "rgba(240,180,210,0.5)", stroke: "#d4618c", glow: "rgba(240,180,210,0.15)" }
      : { fill: "rgba(200,170,235,0.5)", stroke: "#7b5ea7", glow: "rgba(200,170,235,0.15)" };
  }
  return nt === "mandarin"
    ? { fill: "rgba(235,215,180,0.5)", stroke: "#b8965a", glow: "rgba(235,215,180,0.15)" }
    : { fill: "rgba(160,200,240,0.5)", stroke: "#3b82f6", glow: "rgba(160,200,240,0.15)" };
}

export default function VirtualTryOn({
  imageUrl, landmarks, measurements, style, gender, isDemoMode,
}: VirtualTryOnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [opacity, setOpacity] = useState(0.5);
  const [mode, setMode] = useState<ViewMode>("tryon");

  // Measure container once mounted and on resize
  const measureContainer = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 0 && clientHeight > 0) {
        setDims({ w: clientWidth, h: clientHeight });
      }
    }
  }, []);

  useEffect(() => {
    measureContainer();
    const observer = new ResizeObserver(measureContainer);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measureContainer]);

  if (!landmarks || !dims) return null;

  // Validate required landmarks exist
  const hasAll = REQUIRED_LANDMARKS.every((k) => landmarks[k] && landmarks[k].visibility > 0.3);
  if (!hasAll) return null;

  const fabric = getFabric(gender, style);

  // Convert normalized (0-1) landmark to pixel position
  const pt = (name: string) => {
    const lm = landmarks[name];
    return { x: lm.x * dims.w, y: lm.y * dims.h };
  };

  // Key landmarks
  const lSh = pt("left_shoulder");
  const rSh = pt("right_shoulder");
  const lHip = pt("left_hip");
  const rHip = pt("right_hip");
  const lElb = pt("left_elbow");
  const rElb = pt("right_elbow");
  const lWri = pt("left_wrist");
  const rWri = pt("right_wrist");
  const nose = pt("nose");

  // Derived positions
  const midShX = (lSh.x + rSh.x) / 2;
  const midShY = (lSh.y + rSh.y) / 2;
  const midHipY = (lHip.y + rHip.y) / 2;
  const torsoH = midHipY - midShY;
  const shW = rSh.x - lSh.x; // shoulder span in px

  // Style
  const sleeveType = style?.sleeve_type || "full";
  const neckType = style?.neck_type || "collar";
  const lenFactor = style?.length_factor || 1.0;
  const slvFactor = sleeveType === "half" ? 0.42 : sleeveType === "3-quarter" ? 0.72 : sleeveType === "sleeveless" ? 0 : 1;

  // Garment proportional dimensions
  const ease = shW * 0.08;
  const chestY = midShY + torsoH * 0.3;
  const waistY = midShY + torsoH * 0.65;
  const hemY = midShY + torsoH * lenFactor + torsoH * 0.12;
  const chestHW = shW * 0.55; // half-width at chest
  const waistHW = shW * (gender === "female" ? 0.4 : 0.47);
  const hemHW = shW * (lenFactor > 1.2 ? 0.6 : 0.48);

  // Sleeve endpoints — interpolate from shoulder toward wrist
  const slvLEnd = { x: lSh.x + (lWri.x - lSh.x) * slvFactor, y: lSh.y + (lWri.y - lSh.y) * slvFactor };
  const slvREnd = { x: rSh.x + (rWri.x - rSh.x) * slvFactor, y: rSh.y + (rWri.y - rSh.y) * slvFactor };
  const slvW = shW * 0.12;

  // Neckline top
  const neckY = midShY - torsoH * 0.06;
  const neckHW = shW * 0.1;

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-medium text-white">
          {mode === "tryon" ? "Virtual Try-On" : mode === "skeleton" ? "Skeleton View" : "Measurement Points"}
        </h3>
        <div className="flex bg-gray-700 rounded-lg overflow-hidden text-[10px]">
          {(["tryon", "skeleton", "points"] as ViewMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2.5 py-1 font-medium transition ${mode === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
              {m === "tryon" ? "Try-On" : m === "skeleton" ? "Skeleton" : "Points"}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative" style={{ aspectRatio: "4/5" }}>
        {/* Base image */}
        {imageUrl ? (
          <img src={imageUrl} alt="Body" className="w-full h-full object-cover" />
        ) : isDemoMode ? (
          <DemoSilhouette gender={gender} className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center text-gray-600 text-sm">No image</div>
        )}

        {/* SVG Overlay */}
        {dims && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${dims.w} ${dims.h}`}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* ===== GARMENT (Try-On mode) ===== */}
            {mode === "tryon" && (
              <g style={{ opacity }}>
                {/* Glow behind garment */}
                <path
                  d={`M ${midShX} ${neckY}
                    L ${lSh.x - ease} ${midShY}
                    C ${lSh.x - ease} ${chestY * 0.7 + midShY * 0.3}, ${midShX - chestHW} ${chestY * 0.9 + midShY * 0.1}, ${midShX - chestHW} ${chestY}
                    Q ${midShX - waistHW} ${(chestY + waistY) / 2} ${midShX - waistHW} ${waistY}
                    Q ${midShX - hemHW} ${(waistY + hemY) / 2} ${midShX - hemHW} ${hemY}
                    L ${midShX + hemHW} ${hemY}
                    Q ${midShX + hemHW} ${(waistY + hemY) / 2} ${midShX + waistHW} ${waistY}
                    Q ${midShX + chestHW} ${(chestY + waistY) / 2} ${midShX + chestHW} ${chestY}
                    C ${midShX + chestHW} ${chestY * 0.9 + midShY * 0.1}, ${rSh.x + ease} ${chestY * 0.7 + midShY * 0.3}, ${rSh.x + ease} ${midShY}
                    L ${midShX} ${neckY} Z`}
                  fill={fabric.glow} filter="url(#glow)"
                />

                {/* Left sleeve */}
                {sleeveType !== "sleeveless" && (
                  <>
                    <path
                      d={`M ${lSh.x} ${midShY}
                        L ${slvLEnd.x - slvW} ${slvLEnd.y}
                        L ${slvLEnd.x + slvW * 0.5} ${slvLEnd.y + slvW}
                        L ${lSh.x + shW * 0.06} ${midShY + torsoH * 0.15} Z`}
                      fill={fabric.fill} stroke={fabric.stroke} strokeWidth="1"
                    />
                    {/* Right sleeve */}
                    <path
                      d={`M ${rSh.x} ${midShY}
                        L ${slvREnd.x + slvW} ${slvREnd.y}
                        L ${slvREnd.x - slvW * 0.5} ${slvREnd.y + slvW}
                        L ${rSh.x - shW * 0.06} ${midShY + torsoH * 0.15} Z`}
                      fill={fabric.fill} stroke={fabric.stroke} strokeWidth="1"
                    />
                  </>
                )}

                {/* Main body */}
                <path
                  d={`M ${midShX} ${neckY}
                    L ${lSh.x - ease} ${midShY}
                    C ${lSh.x - ease} ${chestY * 0.7 + midShY * 0.3}, ${midShX - chestHW} ${chestY * 0.9 + midShY * 0.1}, ${midShX - chestHW} ${chestY}
                    Q ${midShX - waistHW} ${(chestY + waistY) / 2} ${midShX - waistHW} ${waistY}
                    Q ${midShX - hemHW} ${(waistY + hemY) / 2} ${midShX - hemHW} ${hemY}
                    L ${midShX + hemHW} ${hemY}
                    Q ${midShX + hemHW} ${(waistY + hemY) / 2} ${midShX + waistHW} ${waistY}
                    Q ${midShX + chestHW} ${(chestY + waistY) / 2} ${midShX + chestHW} ${chestY}
                    C ${midShX + chestHW} ${chestY * 0.9 + midShY * 0.1}, ${rSh.x + ease} ${chestY * 0.7 + midShY * 0.3}, ${rSh.x + ease} ${midShY}
                    L ${midShX} ${neckY} Z`}
                  fill={fabric.fill} stroke={fabric.stroke} strokeWidth="1.5"
                />

                {/* Neckline */}
                {neckType === "collar" && (
                  <g>
                    <path d={`M ${midShX - neckHW * 1.5} ${neckY + torsoH * 0.02}
                      L ${midShX - shW * 0.2} ${neckY + torsoH * 0.1}
                      L ${midShX - neckHW * 0.3} ${neckY + torsoH * 0.07} Z`}
                      fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                    <path d={`M ${midShX + neckHW * 1.5} ${neckY + torsoH * 0.02}
                      L ${midShX + shW * 0.2} ${neckY + torsoH * 0.1}
                      L ${midShX + neckHW * 0.3} ${neckY + torsoH * 0.07} Z`}
                      fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                  </g>
                )}
                {neckType === "mandarin" && (
                  <path d={`M ${midShX - neckHW} ${neckY + torsoH * 0.01}
                    Q ${midShX} ${neckY - torsoH * 0.04} ${midShX + neckHW} ${neckY + torsoH * 0.01}`}
                    fill="none" stroke={fabric.stroke} strokeWidth="3" />
                )}
                {neckType === "round" && (
                  <path d={`M ${midShX - neckHW * 1.5} ${neckY + torsoH * 0.02}
                    Q ${midShX} ${neckY - torsoH * 0.06} ${midShX + neckHW * 1.5} ${neckY + torsoH * 0.02}`}
                    fill="none" stroke={fabric.stroke} strokeWidth="2.5" />
                )}
                {neckType === "v-neck" && (
                  <path d={`M ${midShX - neckHW * 1.5} ${neckY + torsoH * 0.02}
                    L ${midShX} ${chestY} L ${midShX + neckHW * 1.5} ${neckY + torsoH * 0.02}`}
                    fill="none" stroke={fabric.stroke} strokeWidth="1.5" />
                )}

                {/* Center line + buttons for shirt styles */}
                {(neckType === "collar" || neckType === "mandarin") && (
                  <g>
                    <line x1={midShX} y1={neckY + torsoH * 0.08} x2={midShX} y2={hemY}
                      stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    {[0.12, 0.24, 0.36, 0.48, 0.6, 0.72].map((p, i) => (
                      <circle key={i} cx={midShX} cy={midShY + torsoH * p}
                        r={torsoH * 0.008} fill="rgba(255,255,255,0.3)" />
                    ))}
                  </g>
                )}

                {/* Hem embroidery for long styles */}
                {lenFactor > 1.2 && (
                  <g opacity="0.3">
                    <line x1={midShX - hemHW + 5} y1={hemY - torsoH * 0.03}
                      x2={midShX + hemHW - 5} y2={hemY - torsoH * 0.03}
                      stroke={fabric.stroke} strokeWidth="2" strokeDasharray="4,3" />
                  </g>
                )}
              </g>
            )}

            {/* ===== SKELETON (Skeleton mode) ===== */}
            {mode === "skeleton" && (
              <g>
                {[
                  ["left_shoulder", "right_shoulder"], ["left_shoulder", "left_elbow"],
                  ["left_elbow", "left_wrist"], ["right_shoulder", "right_elbow"],
                  ["right_elbow", "right_wrist"], ["left_shoulder", "left_hip"],
                  ["right_shoulder", "right_hip"], ["left_hip", "right_hip"],
                  ["left_hip", "left_knee"], ["left_knee", "left_ankle"],
                  ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
                ].map(([a, b], i) => {
                  const pa = pt(a), pb = pt(b);
                  return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />;
                })}
                {Object.entries(landmarks).map(([name, lm]) => {
                  if (!lm || lm.visibility < 0.5) return null;
                  const p = pt(name);
                  return <circle key={name} cx={p.x} cy={p.y} r="5" fill="#ff4444" stroke="#fff" strokeWidth="1.5" />;
                })}
              </g>
            )}

            {/* ===== POSTER POINTS (Points mode + subtle in Try-On mode) ===== */}
            {(mode === "points" || mode === "tryon") && (
              <g fontFamily="system-ui, sans-serif" opacity={mode === "tryon" ? 0.7 : 1}>
                {/* Shoulder */}
                <line x1={lSh.x} y1={lSh.y} x2={rSh.x} y2={rSh.y} stroke="#22c55e" strokeWidth="2" strokeDasharray="5,3" />
                <circle cx={lSh.x} cy={lSh.y} r="5" fill="#22c55e">
                  <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={rSh.x} cy={rSh.y} r="5" fill="#22c55e">
                  <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                </circle>
                <rect x={midShX - 32} y={lSh.y - 22} width="64" height="16" rx="3" fill="#0d1117" fillOpacity="0.9" />
                <text x={midShX} y={lSh.y - 10} textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="600">
                  {measurements.shoulder_width_cm} cm
                </text>

                {/* Chest */}
                <line x1={midShX - chestHW} y1={chestY} x2={midShX + chestHW} y2={chestY}
                  stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
                <rect x={midShX + chestHW + 6} y={chestY - 10} width="68" height="16" rx="3" fill="#0d1117" fillOpacity="0.9" />
                <text x={midShX + chestHW + 10} y={chestY + 2} fill="#ef4444" fontSize="9" fontWeight="600">
                  Chest {measurements.chest_circumference_cm}
                </text>

                {/* Waist */}
                <line x1={midShX - waistHW} y1={waistY} x2={midShX + waistHW} y2={waistY}
                  stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4,3" />
                <rect x={midShX + waistHW + 6} y={waistY - 10} width="62" height="16" rx="3" fill="#0d1117" fillOpacity="0.9" />
                <text x={midShX + waistHW + 10} y={waistY + 2} fill="#a855f7" fontSize="9" fontWeight="600">
                  Waist {measurements.waist_cm}
                </text>

                {/* Length bracket */}
                <line x1={lSh.x - 16} y1={midShY} x2={lSh.x - 16} y2={hemY} stroke="#06b6d4" strokeWidth="1.5" />
                <line x1={lSh.x - 20} y1={midShY} x2={lSh.x - 12} y2={midShY} stroke="#06b6d4" strokeWidth="1" />
                <line x1={lSh.x - 20} y1={hemY} x2={lSh.x - 12} y2={hemY} stroke="#06b6d4" strokeWidth="1" />
                <rect x={lSh.x - 58} y={(midShY + hemY) / 2 - 10} width="40" height="16" rx="3" fill="#0d1117" fillOpacity="0.9" />
                <text x={lSh.x - 38} y={(midShY + hemY) / 2 + 2} textAnchor="middle" fill="#06b6d4" fontSize="9" fontWeight="600">
                  {measurements.shirt_length_cm}
                </text>

                {/* Sleeve */}
                {sleeveType !== "sleeveless" && (
                  <>
                    <line x1={rSh.x} y1={rSh.y} x2={slvREnd.x} y2={slvREnd.y}
                      stroke="#f97316" strokeWidth="2" strokeDasharray="5,3" />
                    <circle cx={slvREnd.x} cy={slvREnd.y} r="5" fill="#f97316">
                      <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <rect x={slvREnd.x + 8} y={slvREnd.y - 10} width="68" height="16" rx="3" fill="#0d1117" fillOpacity="0.9" />
                    <text x={slvREnd.x + 12} y={slvREnd.y + 2} fill="#f97316" fontSize="9" fontWeight="600">
                      Sleeve {measurements.sleeve_length_cm}
                    </text>
                  </>
                )}

                {/* Neck */}
                <rect x={midShX - 34} y={nose.y + 2} width="68" height="14" rx="3" fill="#0d1117" fillOpacity="0.9" />
                <text x={midShX} y={nose.y + 12} textAnchor="middle" fill="#eab308" fontSize="9" fontWeight="600">
                  Neck {measurements.neck_size_cm} cm
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-2.5 flex items-center gap-3 border-t border-gray-700/50">
        {mode === "tryon" && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-gray-500 shrink-0">Opacity</span>
            <input type="range" min="0.2" max="0.8" step="0.05" value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" />
          </div>
        )}
        {style && (
          <div className="flex items-center gap-1 shrink-0 text-[9px]">
            <span className="text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">{style.name}</span>
            <span className="text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">{style.sleeve_type}</span>
            <span className="text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">{style.neck_type}</span>
          </div>
        )}
      </div>
    </div>
  );
}
