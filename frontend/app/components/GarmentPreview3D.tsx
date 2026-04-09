"use client";

import { useMemo } from "react";
import type { BodyMeasurements, StyleInfo } from "../lib/types";

interface GarmentPreview3DProps {
  measurements: BodyMeasurements;
  style: StyleInfo | null;
  gender: string;
}

// Normalize measurements to SVG viewport (600x800)
function normalize(m: BodyMeasurements) {
  const base = 600;
  const scale = base / (m.shoulder_width_cm * 2.8);
  return {
    shoulder: m.shoulder_width_cm * scale,
    chest: (m.chest_circumference_cm / Math.PI) * scale,
    waist: (m.waist_cm / Math.PI) * scale,
    length: m.shirt_length_cm * scale,
    sleeve: m.sleeve_length_cm * scale,
    neck: (m.neck_size_cm / Math.PI) * scale * 0.5,
  };
}

function MaleShirt({
  n,
  style,
}: {
  m: BodyMeasurements;
  n: ReturnType<typeof normalize>;
  style: StyleInfo | null;
}) {
  const cx = 300;
  const topY = 100;
  const neckType = style?.neck_type || "collar";
  const sleeveType = style?.sleeve_type || "full";
  const sleeveFactor = sleeveType === "half" ? 0.4 : sleeveType === "3-quarter" ? 0.72 : 1;
  const sleeveLen = n.sleeve * sleeveFactor;

  const shoulderY = topY + 25;
  const chestY = shoulderY + n.length * 0.28;
  const waistY = shoulderY + n.length * 0.62;
  const hemY = shoulderY + n.length;

  // Body slightly wider than shoulder at chest
  const bodyWidthChest = n.chest * 1.05;
  const bodyWidthWaist = n.waist * 0.97;
  const hemWidth = n.waist * 0.99;

  // Fabric color
  const fabricMain = style?.neck_type === "mandarin" ? "#e8d5b7" : "#d4e6f1";
  const fabricDark = style?.neck_type === "mandarin" ? "#c4a97d" : "#a9cce3";
  const fabricLight = style?.neck_type === "mandarin" ? "#f5ecd7" : "#eaf2f8";

  // Sleeve angle
  const sleeveAngle = 0.35;
  const sleeveEndX = n.shoulder + sleeveLen * Math.cos(sleeveAngle);
  const sleeveEndY = shoulderY + sleeveLen * Math.sin(sleeveAngle);
  const sleeveWidth = n.chest * 0.28;

  return (
    <g>
      {/* Definitions */}
      <defs>
        <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fabricLight} />
          <stop offset="50%" stopColor={fabricMain} />
          <stop offset="100%" stopColor={fabricDark} />
        </linearGradient>
        <linearGradient id="sleeveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fabricMain} />
          <stop offset="100%" stopColor={fabricDark} />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodOpacity="0.15" />
        </filter>
        <pattern id="fabric-texture" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="4" fill={fabricMain} />
          <line x1="0" y1="0" x2="4" y2="4" stroke={fabricDark} strokeWidth="0.3" opacity="0.15" />
          <line x1="4" y1="0" x2="0" y2="4" stroke={fabricLight} strokeWidth="0.3" opacity="0.1" />
        </pattern>
      </defs>

      {/* Left Sleeve */}
      <path
        d={`M ${cx - n.shoulder} ${shoulderY}
            L ${cx - sleeveEndX} ${sleeveEndY - sleeveWidth * 0.3}
            Q ${cx - sleeveEndX - 3} ${sleeveEndY + sleeveWidth * 0.5} ${cx - sleeveEndX + sleeveWidth * 0.5} ${sleeveEndY + sleeveWidth * 0.8}
            L ${cx - n.shoulder + 5} ${shoulderY + n.length * 0.2}
            Z`}
        fill="url(#sleeveGrad)"
        stroke={fabricDark}
        strokeWidth="1"
        filter="url(#shadow)"
      />
      {/* Sleeve fold line */}
      <line
        x1={cx - n.shoulder - sleeveLen * 0.2} y1={shoulderY + sleeveLen * 0.08}
        x2={cx - sleeveEndX + sleeveWidth * 0.3} y2={sleeveEndY + sleeveWidth * 0.4}
        stroke={fabricDark} strokeWidth="0.5" opacity="0.3"
      />

      {/* Right Sleeve */}
      <path
        d={`M ${cx + n.shoulder} ${shoulderY}
            L ${cx + sleeveEndX} ${sleeveEndY - sleeveWidth * 0.3}
            Q ${cx + sleeveEndX + 3} ${sleeveEndY + sleeveWidth * 0.5} ${cx + sleeveEndX - sleeveWidth * 0.5} ${sleeveEndY + sleeveWidth * 0.8}
            L ${cx + n.shoulder - 5} ${shoulderY + n.length * 0.2}
            Z`}
        fill="url(#sleeveGrad)"
        stroke={fabricDark}
        strokeWidth="1"
        filter="url(#shadow)"
      />
      <line
        x1={cx + n.shoulder + sleeveLen * 0.2} y1={shoulderY + sleeveLen * 0.08}
        x2={cx + sleeveEndX - sleeveWidth * 0.3} y2={sleeveEndY + sleeveWidth * 0.4}
        stroke={fabricDark} strokeWidth="0.5" opacity="0.3"
      />

      {/* Main Body */}
      <path
        d={`M ${cx - n.neck * 0.8} ${topY + 15}
            Q ${cx - n.shoulder * 0.5} ${topY + 5} ${cx - n.shoulder} ${shoulderY}
            L ${cx - n.shoulder + 3} ${shoulderY + n.length * 0.15}
            Q ${cx - bodyWidthChest - 2} ${chestY - 10} ${cx - bodyWidthChest} ${chestY}
            Q ${cx - bodyWidthWaist + 3} ${(chestY + waistY) / 2} ${cx - bodyWidthWaist} ${waistY}
            Q ${cx - hemWidth} ${(waistY + hemY) / 2} ${cx - hemWidth} ${hemY}
            Q ${cx} ${hemY + 4} ${cx + hemWidth} ${hemY}
            Q ${cx + hemWidth} ${(waistY + hemY) / 2} ${cx + bodyWidthWaist} ${waistY}
            Q ${cx + bodyWidthWaist - 3} ${(chestY + waistY) / 2} ${cx + bodyWidthChest} ${chestY}
            Q ${cx + bodyWidthChest + 2} ${chestY - 10} ${cx + n.shoulder - 3} ${shoulderY + n.length * 0.15}
            L ${cx + n.shoulder} ${shoulderY}
            Q ${cx + n.shoulder * 0.5} ${topY + 5} ${cx + n.neck * 0.8} ${topY + 15}
            Z`}
        fill="url(#fabric-texture)"
        stroke={fabricDark}
        strokeWidth="1.2"
        filter="url(#shadow)"
      />

      {/* Side seam lines */}
      <path
        d={`M ${cx - n.shoulder + 3} ${shoulderY + 10} Q ${cx - bodyWidthChest} ${chestY} ${cx - bodyWidthWaist} ${waistY}`}
        fill="none" stroke={fabricDark} strokeWidth="0.5" opacity="0.2" strokeDasharray="3,3"
      />
      <path
        d={`M ${cx + n.shoulder - 3} ${shoulderY + 10} Q ${cx + bodyWidthChest} ${chestY} ${cx + bodyWidthWaist} ${waistY}`}
        fill="none" stroke={fabricDark} strokeWidth="0.5" opacity="0.2" strokeDasharray="3,3"
      />

      {/* Center placket line */}
      <line x1={cx} y1={topY + 25} x2={cx} y2={hemY - 5} stroke={fabricDark} strokeWidth="0.8" opacity="0.3" />
      <line x1={cx + 3} y1={topY + 25} x2={cx + 3} y2={hemY - 5} stroke={fabricDark} strokeWidth="0.4" opacity="0.15" />

      {/* Buttons */}
      {[0.12, 0.25, 0.38, 0.52, 0.66, 0.8].map((pct, i) => {
        const by = shoulderY + n.length * pct;
        return (
          <g key={i}>
            <circle cx={cx} cy={by} r={3.5} fill="#f8f9fa" stroke="#adb5bd" strokeWidth="0.8" />
            <circle cx={cx - 1} cy={by - 1} r={0.8} fill="#adb5bd" />
            <circle cx={cx + 1} cy={by - 1} r={0.8} fill="#adb5bd" />
            <circle cx={cx - 1} cy={by + 1} r={0.8} fill="#adb5bd" />
            <circle cx={cx + 1} cy={by + 1} r={0.8} fill="#adb5bd" />
          </g>
        );
      })}

      {/* Collar / Neck */}
      {neckType === "collar" && (
        <g>
          {/* Collar band */}
          <path
            d={`M ${cx - n.neck * 0.9} ${topY + 10}
                Q ${cx} ${topY - 5} ${cx + n.neck * 0.9} ${topY + 10}`}
            fill={fabricLight} stroke={fabricDark} strokeWidth="1"
          />
          {/* Left collar leaf */}
          <path
            d={`M ${cx - n.neck * 0.5} ${topY + 8}
                L ${cx - n.shoulder * 0.55} ${topY + 30}
                L ${cx - n.neck * 0.15} ${topY + 22}
                Z`}
            fill={fabricLight} stroke={fabricDark} strokeWidth="0.8"
          />
          {/* Right collar leaf */}
          <path
            d={`M ${cx + n.neck * 0.5} ${topY + 8}
                L ${cx + n.shoulder * 0.55} ${topY + 30}
                L ${cx + n.neck * 0.15} ${topY + 22}
                Z`}
            fill={fabricLight} stroke={fabricDark} strokeWidth="0.8"
          />
        </g>
      )}
      {neckType === "mandarin" && (
        <g>
          <path
            d={`M ${cx - n.neck * 0.7} ${topY + 14}
                Q ${cx - n.neck * 0.7} ${topY - 2} ${cx} ${topY - 5}
                Q ${cx + n.neck * 0.7} ${topY - 2} ${cx + n.neck * 0.7} ${topY + 14}`}
            fill={fabricLight} stroke={fabricDark} strokeWidth="1.2"
          />
          <line x1={cx} y1={topY - 4} x2={cx} y2={topY + 14} stroke={fabricDark} strokeWidth="0.5" />
        </g>
      )}
      {neckType === "round" && (
        <path
          d={`M ${cx - n.neck * 0.8} ${topY + 15}
              Q ${cx} ${topY - 8} ${cx + n.neck * 0.8} ${topY + 15}`}
          fill="none" stroke={fabricDark} strokeWidth="2"
        />
      )}

      {/* Breast pocket */}
      <rect x={cx + n.chest * 0.2} y={chestY - 15} width={n.chest * 0.3} height={n.chest * 0.25}
        fill="none" stroke={fabricDark} strokeWidth="0.6" opacity="0.25" rx="1" />
    </g>
  );
}

function FemaleBlouse({
  n,
  style,
}: {
  m: BodyMeasurements;
  n: ReturnType<typeof normalize>;
  style: StyleInfo | null;
}) {
  const cx = 300;
  const topY = 100;
  const neckType = style?.neck_type || "round";
  const sleeveType = style?.sleeve_type || "full";
  const sleeveFactor = sleeveType === "half" ? 0.4 : sleeveType === "3-quarter" ? 0.72 : sleeveType === "sleeveless" ? 0 : 1;
  const sleeveLen = n.sleeve * sleeveFactor;
  const isLong = (style?.length_factor || 1) > 1.2;

  const shoulderY = topY + 20;
  const bustY = shoulderY + n.length * 0.22;
  const waistY = shoulderY + n.length * 0.5;
  const hipY = shoulderY + n.length * 0.72;
  const hemY = shoulderY + n.length;

  const shoulderW = n.shoulder * 0.95;
  const bustW = n.chest * 1.08;
  const waistW = n.waist * 0.85;
  const hipW = isLong ? n.waist * 1.15 : n.waist * 1.0;
  const hemW = isLong ? n.waist * 1.3 : n.waist * 1.0;

  const fabricMain = neckType === "round" && isLong ? "#f0d4e8" : "#e8d0f0";
  const fabricDark = neckType === "round" && isLong ? "#c9a2b8" : "#b89cc8";
  const fabricLight = neckType === "round" && isLong ? "#f8eaf4" : "#f3eaf8";

  const sleeveAngle = 0.4;
  const sleeveEndX = shoulderW + sleeveLen * Math.cos(sleeveAngle);
  const sleeveEndY = shoulderY + sleeveLen * Math.sin(sleeveAngle);
  const slvW = n.chest * 0.22;

  return (
    <g>
      <defs>
        <linearGradient id="fFabric" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fabricLight} />
          <stop offset="50%" stopColor={fabricMain} />
          <stop offset="100%" stopColor={fabricDark} />
        </linearGradient>
        <pattern id="f-texture" patternUnits="userSpaceOnUse" width="3" height="3">
          <rect width="3" height="3" fill={fabricMain} />
          <circle cx="1.5" cy="1.5" r="0.3" fill={fabricDark} opacity="0.08" />
        </pattern>
        <filter id="fShadow">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Sleeves */}
      {sleeveType !== "sleeveless" && (
        <>
          {/* Left Sleeve */}
          <path
            d={`M ${cx - shoulderW} ${shoulderY}
                L ${cx - sleeveEndX} ${sleeveEndY - slvW * 0.2}
                Q ${cx - sleeveEndX - 2} ${sleeveEndY + slvW * 0.4} ${cx - sleeveEndX + slvW * 0.4} ${sleeveEndY + slvW * 0.7}
                L ${cx - shoulderW + 5} ${shoulderY + n.length * 0.16}
                Z`}
            fill={fabricMain} stroke={fabricDark} strokeWidth="1" filter="url(#fShadow)"
          />
          {/* Right Sleeve */}
          <path
            d={`M ${cx + shoulderW} ${shoulderY}
                L ${cx + sleeveEndX} ${sleeveEndY - slvW * 0.2}
                Q ${cx + sleeveEndX + 2} ${sleeveEndY + slvW * 0.4} ${cx + sleeveEndX - slvW * 0.4} ${sleeveEndY + slvW * 0.7}
                L ${cx + shoulderW - 5} ${shoulderY + n.length * 0.16}
                Z`}
            fill={fabricMain} stroke={fabricDark} strokeWidth="1" filter="url(#fShadow)"
          />
          {/* Sleeve gather/puff lines */}
          {sleeveType === "half" && (
            <>
              <path d={`M ${cx - sleeveEndX + 5} ${sleeveEndY + slvW * 0.2} Q ${cx - sleeveEndX} ${sleeveEndY + slvW * 0.55} ${cx - sleeveEndX + slvW * 0.3} ${sleeveEndY + slvW * 0.65}`}
                fill="none" stroke={fabricDark} strokeWidth="0.5" opacity="0.3" />
              <path d={`M ${cx + sleeveEndX - 5} ${sleeveEndY + slvW * 0.2} Q ${cx + sleeveEndX} ${sleeveEndY + slvW * 0.55} ${cx + sleeveEndX - slvW * 0.3} ${sleeveEndY + slvW * 0.65}`}
                fill="none" stroke={fabricDark} strokeWidth="0.5" opacity="0.3" />
            </>
          )}
        </>
      )}

      {/* Main Body */}
      <path
        d={`M ${cx - n.neck * 0.7} ${topY + 12}
            Q ${cx - shoulderW * 0.5} ${topY + 3} ${cx - shoulderW} ${shoulderY}
            L ${cx - shoulderW + 3} ${shoulderY + 10}
            Q ${cx - bustW - 3} ${bustY - 8} ${cx - bustW} ${bustY}
            Q ${cx - bustW + 8} ${(bustY + waistY) / 2} ${cx - waistW} ${waistY}
            Q ${cx - hipW - 2} ${(waistY + hipY) / 2} ${cx - hipW} ${hipY}
            Q ${cx - hemW} ${(hipY + hemY) / 2} ${cx - hemW} ${hemY}
            Q ${cx} ${hemY + (isLong ? 8 : 3)} ${cx + hemW} ${hemY}
            Q ${cx + hemW} ${(hipY + hemY) / 2} ${cx + hipW} ${hipY}
            Q ${cx + hipW + 2} ${(waistY + hipY) / 2} ${cx + waistW} ${waistY}
            Q ${cx + bustW - 8} ${(bustY + waistY) / 2} ${cx + bustW} ${bustY}
            Q ${cx + bustW + 3} ${bustY - 8} ${cx + shoulderW - 3} ${shoulderY + 10}
            L ${cx + shoulderW} ${shoulderY}
            Q ${cx + shoulderW * 0.5} ${topY + 3} ${cx + n.neck * 0.7} ${topY + 12}
            Z`}
        fill="url(#f-texture)"
        stroke={fabricDark}
        strokeWidth="1.2"
        filter="url(#fShadow)"
      />

      {/* Waist definition - dart lines */}
      <path d={`M ${cx - bustW * 0.5} ${bustY + 5} Q ${cx - waistW * 0.5} ${waistY} ${cx - hipW * 0.5} ${hipY - 5}`}
        fill="none" stroke={fabricDark} strokeWidth="0.5" opacity="0.2" strokeDasharray="4,3" />
      <path d={`M ${cx + bustW * 0.5} ${bustY + 5} Q ${cx + waistW * 0.5} ${waistY} ${cx + hipW * 0.5} ${hipY - 5}`}
        fill="none" stroke={fabricDark} strokeWidth="0.5" opacity="0.2" strokeDasharray="4,3" />

      {/* Neckline */}
      {neckType === "round" && (
        <path
          d={`M ${cx - n.neck * 0.7} ${topY + 12}
              Q ${cx} ${topY - 12} ${cx + n.neck * 0.7} ${topY + 12}`}
          fill="none" stroke={fabricDark} strokeWidth="2.5"
        />
      )}
      {neckType === "v-neck" && (
        <>
          <line x1={cx - n.neck * 0.7} y1={topY + 12} x2={cx} y2={topY + 50} stroke={fabricDark} strokeWidth="2" />
          <line x1={cx + n.neck * 0.7} y1={topY + 12} x2={cx} y2={topY + 50} stroke={fabricDark} strokeWidth="2" />
        </>
      )}
      {neckType === "collar" && (
        <g>
          <path d={`M ${cx - n.neck * 0.8} ${topY + 8} Q ${cx} ${topY - 8} ${cx + n.neck * 0.8} ${topY + 8}`}
            fill={fabricLight} stroke={fabricDark} strokeWidth="1" />
          <path d={`M ${cx - n.neck * 0.4} ${topY + 6} L ${cx - shoulderW * 0.45} ${topY + 24} L ${cx - n.neck * 0.1} ${topY + 18} Z`}
            fill={fabricLight} stroke={fabricDark} strokeWidth="0.6" />
          <path d={`M ${cx + n.neck * 0.4} ${topY + 6} L ${cx + shoulderW * 0.45} ${topY + 24} L ${cx + n.neck * 0.1} ${topY + 18} Z`}
            fill={fabricLight} stroke={fabricDark} strokeWidth="0.6" />
          <line x1={cx} y1={topY + 20} x2={cx} y2={hemY - 5} stroke={fabricDark} strokeWidth="0.6" opacity="0.25" />
          {[0.15, 0.3, 0.45, 0.6, 0.75].map((p, i) => (
            <circle key={i} cx={cx} cy={shoulderY + n.length * p} r={2.5} fill="#f8f9fa" stroke="#ccc" strokeWidth="0.6" />
          ))}
        </g>
      )}

      {/* Decorative elements for Indian styles */}
      {isLong && neckType === "round" && (
        <g opacity="0.3">
          {/* Embroidery pattern at neckline */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (Math.PI / 12) * i + Math.PI / 12;
            const r = n.neck * 0.85;
            const px = cx + Math.cos(angle - Math.PI / 2) * r * 1.1;
            const py = topY + 3 + Math.sin(angle - Math.PI / 2) * r * 0.6;
            return <circle key={i} cx={px} cy={py} r={1.5} fill={fabricDark} />;
          })}
          {/* Border at hem */}
          <path d={`M ${cx - hemW + 5} ${hemY - 8} L ${cx + hemW - 5} ${hemY - 8}`}
            stroke={fabricDark} strokeWidth="2" strokeDasharray="6,3" />
          <path d={`M ${cx - hemW + 5} ${hemY - 4} L ${cx + hemW - 5} ${hemY - 4}`}
            stroke={fabricDark} strokeWidth="1" />
        </g>
      )}
    </g>
  );
}

function MeasurementAnnotations({
  m,
  n,
  gender,
  style,
}: {
  m: BodyMeasurements;
  n: ReturnType<typeof normalize>;
  gender: string;
  style: StyleInfo | null;
}) {
  const cx = 300;
  const topY = 100;
  const shoulderY = topY + (gender === "female" ? 20 : 25);
  const chestY = shoulderY + n.length * (gender === "female" ? 0.22 : 0.28);
  const waistY = shoulderY + n.length * (gender === "female" ? 0.5 : 0.62);
  const hemY = shoulderY + n.length;
  const shoulderW = gender === "female" ? n.shoulder * 0.95 : n.shoulder;

  const sleeveType = style?.sleeve_type || "full";
  const sleeveFactor = sleeveType === "half" ? 0.4 : sleeveType === "3-quarter" ? 0.72 : 1;
  const actualSleeve = n.sleeve * sleeveFactor;

  return (
    <g>
      {/* Shoulder width */}
      <line x1={cx - shoulderW} y1={shoulderY - 8} x2={cx + shoulderW} y2={shoulderY - 8}
        stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arrowG)" markerStart="url(#arrowG)" />
      <text x={cx} y={shoulderY - 14} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="600">
        {m.shoulder_width_cm} cm
      </text>
      <text x={cx} y={shoulderY - 24} textAnchor="middle" fill="#22c55e" fontSize="9" opacity="0.7">
        Shoulder
      </text>

      {/* Chest */}
      <line x1={cx - n.chest * 1.15} y1={chestY} x2={cx + n.chest * 1.15} y2={chestY}
        stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,2" />
      <rect x={cx + n.chest * 1.15 + 4} y={chestY - 16} width="80" height="28" rx="4" fill="#1f1f1f" fillOpacity="0.85" />
      <text x={cx + n.chest * 1.15 + 10} y={chestY - 2} fill="#ef4444" fontSize="10" fontWeight="600">
        Chest
      </text>
      <text x={cx + n.chest * 1.15 + 10} y={chestY + 9} fill="#ef4444" fontSize="9">
        {m.chest_circumference_cm} cm
      </text>

      {/* Waist */}
      <line x1={cx - n.waist * 1.05} y1={waistY} x2={cx + n.waist * 1.05} y2={waistY}
        stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4,2" />
      <rect x={cx + n.waist * 1.05 + 4} y={waistY - 16} width="74" height="28" rx="4" fill="#1f1f1f" fillOpacity="0.85" />
      <text x={cx + n.waist * 1.05 + 10} y={waistY - 2} fill="#a855f7" fontSize="10" fontWeight="600">
        Waist
      </text>
      <text x={cx + n.waist * 1.05 + 10} y={waistY + 9} fill="#a855f7" fontSize="9">
        {m.waist_cm} cm
      </text>

      {/* Length */}
      <line x1={cx - shoulderW - 20} y1={shoulderY} x2={cx - shoulderW - 20} y2={hemY}
        stroke="#06b6d4" strokeWidth="1.5" />
      <line x1={cx - shoulderW - 25} y1={shoulderY} x2={cx - shoulderW - 15} y2={shoulderY}
        stroke="#06b6d4" strokeWidth="1" />
      <line x1={cx - shoulderW - 25} y1={hemY} x2={cx - shoulderW - 15} y2={hemY}
        stroke="#06b6d4" strokeWidth="1" />
      <text x={cx - shoulderW - 24} y={(shoulderY + hemY) / 2} fill="#06b6d4" fontSize="10"
        fontWeight="600" textAnchor="end" dominantBaseline="middle">
        {m.shirt_length_cm} cm
      </text>
      <text x={cx - shoulderW - 24} y={(shoulderY + hemY) / 2 + 12} fill="#06b6d4" fontSize="8"
        textAnchor="end" opacity="0.7">
        Length
      </text>

      {/* Sleeve */}
      {sleeveType !== "sleeveless" && (
        <>
          <line x1={cx + shoulderW + 3} y1={shoulderY}
            x2={cx + shoulderW + actualSleeve * 0.7 + 3} y2={shoulderY + actualSleeve * 0.4}
            stroke="#f97316" strokeWidth="1.5" />
          <rect x={cx + shoulderW + actualSleeve * 0.3} y={shoulderY + actualSleeve * 0.15 - 22}
            width="80" height="28" rx="4" fill="#1f1f1f" fillOpacity="0.85" />
          <text x={cx + shoulderW + actualSleeve * 0.3 + 6} y={shoulderY + actualSleeve * 0.15 - 8}
            fill="#f97316" fontSize="10" fontWeight="600">
            Sleeve
          </text>
          <text x={cx + shoulderW + actualSleeve * 0.3 + 6} y={shoulderY + actualSleeve * 0.15 + 3}
            fill="#f97316" fontSize="9">
            {m.sleeve_length_cm} cm
          </text>
        </>
      )}

      {/* Neck */}
      <rect x={cx - 40} y={topY - 42} width="80" height="22" rx="4" fill="#1f1f1f" fillOpacity="0.85" />
      <text x={cx} y={topY - 26} textAnchor="middle" fill="#eab308" fontSize="10" fontWeight="600">
        Neck {m.neck_size_cm} cm
      </text>

      {/* Arrow marker */}
      <defs>
        <marker id="arrowG" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="#22c55e" strokeWidth="1" />
        </marker>
      </defs>
    </g>
  );
}

export default function GarmentPreview3D({ measurements, style, gender }: GarmentPreview3DProps) {
  const n = useMemo(() => normalize(measurements), [measurements]);
  const styleName = style?.name || (gender === "female" ? "Blouse" : "Shirt");

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <div>
          <h3 className="text-sm font-medium text-white">Garment Preview</h3>
          <p className="text-[10px] text-gray-500">{styleName} — proportional to your measurements</p>
        </div>
        <div className="flex gap-1.5 items-center text-[9px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Shoulder</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Chest</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />Waist</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" />Length</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Sleeve</span>
        </div>
      </div>
      <svg viewBox="0 0 600 550" className="w-full" style={{ maxHeight: 450 }}>
        {/* Background */}
        <rect width="600" height="550" fill="#1a1a2e" rx="0" />
        <rect x="50" y="30" width="500" height="490" fill="#16213e" rx="12" opacity="0.5" />

        {/* Garment */}
        {gender === "female" ? (
          <FemaleBlouse m={measurements} n={n} style={style} />
        ) : (
          <MaleShirt m={measurements} n={n} style={style} />
        )}

        {/* Measurement annotations */}
        <MeasurementAnnotations m={measurements} n={n} gender={gender} style={style} />
      </svg>
    </div>
  );
}
