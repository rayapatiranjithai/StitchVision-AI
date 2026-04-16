"use client";

import { useRef, useState, useEffect, useMemo } from "react";
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

type OverlayMode = "tryon" | "skeleton" | "points";

// Fabric colors per style
function getFabricColors(gender: string, style: StyleInfo | null) {
  const neckType = style?.neck_type || "collar";
  const isLong = (style?.length_factor || 1) > 1.2;
  if (gender === "female") {
    if (isLong) return { fill: "rgba(236,180,215,0.55)", stroke: "#c080a0", label: "#f0d0e0" };
    return { fill: "rgba(210,180,240,0.55)", stroke: "#9878c0", label: "#e0d0f0" };
  }
  if (neckType === "mandarin") return { fill: "rgba(232,213,183,0.55)", stroke: "#c4a97d", label: "#f5ead6" };
  return { fill: "rgba(180,207,230,0.55)", stroke: "#5b8db8", label: "#cfe2f3" };
}

// Measurement annotation config
const ANNOTATIONS = [
  { key: "shoulder_width_cm", label: "Shoulder", color: "#22c55e", unit: "cm" },
  { key: "chest_circumference_cm", label: "Chest", color: "#ef4444", unit: "cm" },
  { key: "waist_cm", label: "Waist", color: "#a855f7", unit: "cm" },
  { key: "shirt_length_cm", label: "Length", color: "#06b6d4", unit: "cm" },
  { key: "sleeve_length_cm", label: "Sleeve", color: "#f97316", unit: "cm" },
  { key: "neck_size_cm", label: "Neck", color: "#eab308", unit: "cm" },
];

export default function VirtualTryOn({
  imageUrl,
  landmarks,
  measurements,
  style,
  gender,
  isDemoMode,
}: VirtualTryOnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 400, h: 600 });
  const [opacity, setOpacity] = useState(0.55);
  const [mode, setMode] = useState<OverlayMode>("tryon");

  // Observe container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fabric = useMemo(() => getFabricColors(gender, style), [gender, style]);

  if (!landmarks) return null;

  // Convert normalized landmarks to pixel positions
  const px = (name: string) => {
    const lm = landmarks[name];
    if (!lm) return { x: 0, y: 0 };
    return { x: lm.x * dims.w, y: lm.y * dims.h };
  };

  const lSh = px("left_shoulder");
  const rSh = px("right_shoulder");
  const lHip = px("left_hip");
  const rHip = px("right_hip");
  const lElb = px("left_elbow");
  const rElb = px("right_elbow");
  const lWri = px("left_wrist");
  const rWri = px("right_wrist");
  const nose = px("nose");

  const midShX = (lSh.x + rSh.x) / 2;
  const midShY = (lSh.y + rSh.y) / 2;
  const midHipX = (lHip.x + rHip.x) / 2;
  const midHipY = (lHip.y + rHip.y) / 2;
  const torsoH = midHipY - midShY;
  const shoulderW = rSh.x - lSh.x;

  // Style factors
  const sleeveType = style?.sleeve_type || "full";
  const neckType = style?.neck_type || "collar";
  const lengthFactor = style?.length_factor || 1.0;
  const sleeveFactor = sleeveType === "half" ? 0.45 : sleeveType === "3-quarter" ? 0.72 : sleeveType === "sleeveless" ? 0 : 1;

  // Garment dimensions
  const chestY = midShY + torsoH * 0.3;
  const waistY = midShY + torsoH * 0.65;
  const hemY = midShY + torsoH * lengthFactor + torsoH * 0.15;
  const easeX = shoulderW * 0.08;
  const chestW = shoulderW * 0.55;
  const waistW = shoulderW * (gender === "female" ? 0.42 : 0.48);
  const hemW = shoulderW * (lengthFactor > 1.2 ? 0.65 : 0.5);

  // Sleeve endpoints (interpolate between shoulder and wrist based on factor)
  const slvLX = lSh.x + (lWri.x - lSh.x) * sleeveFactor;
  const slvLY = lSh.y + (lWri.y - lSh.y) * sleeveFactor;
  const slvRX = rSh.x + (rWri.x - rSh.x) * sleeveFactor;
  const slvRY = rSh.y + (rWri.y - rSh.y) * sleeveFactor;
  const slvW = shoulderW * 0.12;

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-medium text-white">
          {mode === "tryon" ? "Virtual Try-On" : mode === "skeleton" ? "Skeleton View" : "Measurement Points"}
        </h3>
        <div className="flex bg-gray-700 rounded-lg overflow-hidden text-[10px]">
          {(["tryon", "skeleton", "points"] as OverlayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 font-medium transition capitalize ${
                mode === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "tryon" ? "Try-On" : m === "skeleton" ? "Skeleton" : "Points"}
            </button>
          ))}
        </div>
      </div>

      {/* Image container */}
      <div ref={containerRef} className="relative aspect-[4/5] bg-gray-900 overflow-hidden">
        {/* Base image or silhouette */}
        {imageUrl ? (
          <img src={imageUrl} alt="Body" className="w-full h-full object-cover" />
        ) : isDemoMode ? (
          <DemoSilhouette gender={gender} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
            No image
          </div>
        )}

        {/* SVG Overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          preserveAspectRatio="none"
        >
          {/* ===== GARMENT OVERLAY (Try-On mode) ===== */}
          {mode === "tryon" && sleeveType !== "sleeveless" && (
            <>
              {/* Left Sleeve */}
              <path
                d={`M ${lSh.x} ${lSh.y}
                  L ${slvLX - slvW * 0.3} ${slvLY - slvW}
                  Q ${slvLX - slvW * 0.5} ${slvLY} ${slvLX + slvW * 0.3} ${slvLY + slvW * 0.5}
                  L ${lSh.x + shoulderW * 0.05} ${lSh.y + torsoH * 0.15}
                  Z`}
                fill={fabric.fill}
                stroke={fabric.stroke}
                strokeWidth="1.5"
                style={{ opacity }}
              />
              {/* Right Sleeve */}
              <path
                d={`M ${rSh.x} ${rSh.y}
                  L ${slvRX + slvW * 0.3} ${slvRY - slvW}
                  Q ${slvRX + slvW * 0.5} ${slvRY} ${slvRX - slvW * 0.3} ${slvRY + slvW * 0.5}
                  L ${rSh.x - shoulderW * 0.05} ${rSh.y + torsoH * 0.15}
                  Z`}
                fill={fabric.fill}
                stroke={fabric.stroke}
                strokeWidth="1.5"
                style={{ opacity }}
              />
            </>
          )}

          {mode === "tryon" && (
            <>
              {/* Main Body */}
              <path
                d={`M ${midShX} ${nose.y + (midShY - nose.y) * 0.6}
                  Q ${lSh.x + easeX} ${midShY - 5} ${lSh.x - easeX} ${midShY}
                  C ${lSh.x - easeX - 3} ${chestY - 10} ${midShX - chestW - 5} ${chestY - 5} ${midShX - chestW} ${chestY}
                  C ${midShX - chestW + 5} ${(chestY + waistY) / 2} ${midShX - waistW - 3} ${waistY - 10} ${midShX - waistW} ${waistY}
                  C ${midShX - waistW} ${(waistY + hemY) / 2} ${midShX - hemW} ${hemY - 10} ${midShX - hemW} ${hemY}
                  Q ${midShX} ${hemY + 5} ${midShX + hemW} ${hemY}
                  C ${midShX + hemW} ${hemY - 10} ${midShX + waistW} ${(waistY + hemY) / 2} ${midShX + waistW} ${waistY}
                  C ${midShX + waistW + 3} ${waistY - 10} ${midShX + chestW - 5} ${(chestY + waistY) / 2} ${midShX + chestW} ${chestY}
                  C ${midShX + chestW + 5} ${chestY - 5} ${rSh.x + easeX + 3} ${chestY - 10} ${rSh.x + easeX} ${midShY}
                  Q ${rSh.x - easeX} ${midShY - 5} ${midShX} ${nose.y + (midShY - nose.y) * 0.6}
                  Z`}
                fill={fabric.fill}
                stroke={fabric.stroke}
                strokeWidth="1.5"
                style={{ opacity }}
              />

              {/* Neckline details */}
              {neckType === "collar" && (
                <g style={{ opacity: opacity + 0.15 }}>
                  <path
                    d={`M ${midShX - shoulderW * 0.12} ${midShY - 5}
                      L ${midShX - shoulderW * 0.25} ${midShY + 12}
                      L ${midShX - 2} ${midShY + 5} Z`}
                    fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8"
                  />
                  <path
                    d={`M ${midShX + shoulderW * 0.12} ${midShY - 5}
                      L ${midShX + shoulderW * 0.25} ${midShY + 12}
                      L ${midShX + 2} ${midShY + 5} Z`}
                    fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8"
                  />
                </g>
              )}
              {neckType === "mandarin" && (
                <path
                  d={`M ${midShX - shoulderW * 0.08} ${midShY - 8}
                    Q ${midShX} ${midShY - 18} ${midShX + shoulderW * 0.08} ${midShY - 8}`}
                  fill="none" stroke={fabric.stroke} strokeWidth="3" style={{ opacity: opacity + 0.2 }}
                />
              )}
              {neckType === "v-neck" && (
                <path
                  d={`M ${midShX - shoulderW * 0.1} ${midShY - 3}
                    L ${midShX} ${midShY + torsoH * 0.2}
                    L ${midShX + shoulderW * 0.1} ${midShY - 3}`}
                  fill="none" stroke={fabric.stroke} strokeWidth="2" style={{ opacity: opacity + 0.2 }}
                />
              )}

              {/* Center line + buttons for collar/shirt styles */}
              {(neckType === "collar" || neckType === "mandarin") && (
                <g style={{ opacity: opacity * 0.7 }}>
                  <line x1={midShX} y1={midShY + 10} x2={midShX} y2={hemY - 5}
                    stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  {[0.12, 0.25, 0.38, 0.52, 0.66, 0.8].map((p, i) => (
                    <circle key={i} cx={midShX} cy={midShY + torsoH * p}
                      r={2} fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                  ))}
                </g>
              )}
            </>
          )}

          {/* ===== SKELETON OVERLAY ===== */}
          {mode === "skeleton" && (
            <g>
              {[
                ["left_shoulder", "right_shoulder"],
                ["left_shoulder", "left_elbow"], ["left_elbow", "left_wrist"],
                ["right_shoulder", "right_elbow"], ["right_elbow", "right_wrist"],
                ["left_shoulder", "left_hip"], ["right_shoulder", "right_hip"],
                ["left_hip", "right_hip"],
                ["left_hip", "left_knee"], ["left_knee", "left_ankle"],
                ["right_hip", "right_knee"], ["right_knee", "right_ankle"],
              ].map(([a, b], i) => {
                const pa = px(a);
                const pb = px(b);
                return (
                  <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                    stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                );
              })}
              {Object.entries(landmarks).map(([name, lm]) => {
                if (lm.visibility < 0.5) return null;
                const p = px(name);
                return (
                  <g key={name}>
                    <circle cx={p.x} cy={p.y} r="5" fill="#ff4444" stroke="#fff" strokeWidth="1.5" />
                  </g>
                );
              })}
            </g>
          )}

          {/* ===== POSTER-POINT ANNOTATIONS (shown in all modes) ===== */}
          {(mode === "points" || mode === "tryon") && (
            <g fontFamily="system-ui, sans-serif">
              {/* Shoulder line + label */}
              <line x1={lSh.x} y1={lSh.y} x2={rSh.x} y2={rSh.y}
                stroke="#22c55e" strokeWidth="2" strokeDasharray="6,3" />
              <circle cx={lSh.x} cy={lSh.y} r="6" fill="#22c55e" opacity="0.8">
                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={rSh.x} cy={rSh.y} r="6" fill="#22c55e" opacity="0.8">
                <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
              </circle>
              <rect x={midShX - 40} y={lSh.y - 28} width="80" height="20" rx="4" fill="#0d1117" fillOpacity="0.9" />
              <text x={midShX} y={lSh.y - 14} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="600">
                {measurements.shoulder_width_cm} cm
              </text>

              {/* Chest line + label */}
              <line x1={midShX - chestW - 5} y1={chestY} x2={midShX + chestW + 5} y2={chestY}
                stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
              <circle cx={midShX - chestW - 5} cy={chestY} r="4" fill="#ef4444" opacity="0.7" />
              <circle cx={midShX + chestW + 5} cy={chestY} r="4" fill="#ef4444" opacity="0.7" />
              <rect x={midShX + chestW + 10} y={chestY - 14} width="78" height="22" rx="4" fill="#0d1117" fillOpacity="0.9" />
              <text x={midShX + chestW + 16} y={chestY + 1} fill="#ef4444" fontSize="10" fontWeight="600">
                Chest {measurements.chest_circumference_cm}
              </text>

              {/* Waist line + label */}
              <line x1={midShX - waistW - 5} y1={waistY} x2={midShX + waistW + 5} y2={waistY}
                stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4,3" />
              <circle cx={midShX - waistW - 5} cy={waistY} r="4" fill="#a855f7" opacity="0.7" />
              <circle cx={midShX + waistW + 5} cy={waistY} r="4" fill="#a855f7" opacity="0.7" />
              <rect x={midShX + waistW + 10} y={waistY - 14} width="72" height="22" rx="4" fill="#0d1117" fillOpacity="0.9" />
              <text x={midShX + waistW + 16} y={waistY + 1} fill="#a855f7" fontSize="10" fontWeight="600">
                Waist {measurements.waist_cm}
              </text>

              {/* Length bracket */}
              <line x1={lSh.x - 20} y1={midShY} x2={lSh.x - 20} y2={hemY}
                stroke="#06b6d4" strokeWidth="2" />
              <line x1={lSh.x - 25} y1={midShY} x2={lSh.x - 15} y2={midShY}
                stroke="#06b6d4" strokeWidth="1.5" />
              <line x1={lSh.x - 25} y1={hemY} x2={lSh.x - 15} y2={hemY}
                stroke="#06b6d4" strokeWidth="1.5" />
              <rect x={lSh.x - 72} y={(midShY + hemY) / 2 - 14} width="50" height="22" rx="4" fill="#0d1117" fillOpacity="0.9" />
              <text x={lSh.x - 47} y={(midShY + hemY) / 2 + 1} textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="600">
                {measurements.shirt_length_cm}
              </text>

              {/* Sleeve annotation */}
              {sleeveType !== "sleeveless" && (
                <>
                  <line x1={rSh.x} y1={rSh.y} x2={slvRX} y2={slvRY}
                    stroke="#f97316" strokeWidth="2" strokeDasharray="5,3" />
                  <circle cx={slvRX} cy={slvRY} r="5" fill="#f97316" opacity="0.8">
                    <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <rect x={slvRX + 8} y={slvRY - 14} width="78" height="22" rx="4" fill="#0d1117" fillOpacity="0.9" />
                  <text x={slvRX + 14} y={slvRY + 1} fill="#f97316" fontSize="10" fontWeight="600">
                    Sleeve {measurements.sleeve_length_cm}
                  </text>
                </>
              )}

              {/* Neck annotation */}
              <rect x={midShX - 38} y={nose.y - 2} width="76" height="18" rx="4" fill="#0d1117" fillOpacity="0.9" />
              <text x={midShX} y={nose.y + 12} textAnchor="middle" fill="#eab308" fontSize="10" fontWeight="600">
                Neck {measurements.neck_size_cm}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 flex items-center gap-4 border-t border-gray-700/50">
        {mode === "tryon" && (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] text-gray-500">Opacity</span>
            <input
              type="range"
              min="0.2"
              max="0.8"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}
        {style && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
              {style.name}
            </span>
            <span className="text-[10px] text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
              {style.sleeve_type}
            </span>
            <span className="text-[10px] text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
              {style.neck_type}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
