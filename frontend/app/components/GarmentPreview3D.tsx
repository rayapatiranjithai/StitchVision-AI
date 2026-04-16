"use client";

import { useMemo } from "react";
import type { BodyMeasurements, StyleInfo } from "../lib/types";

interface GarmentPreview3DProps {
  measurements: BodyMeasurements;
  style: StyleInfo | null;
  gender: string;
}

function normalize(m: BodyMeasurements) {
  const base = 540;
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

/* ------------------------------------------------------------------ */
/*  MALE SHIRT                                                         */
/* ------------------------------------------------------------------ */
function MaleShirt({ n, style }: { n: ReturnType<typeof normalize>; style: StyleInfo | null }) {
  const cx = 300;
  const topY = 90;
  const neckType = style?.neck_type || "collar";
  const sleeveType = style?.sleeve_type || "full";
  const sf = sleeveType === "half" ? 0.4 : sleeveType === "3-quarter" ? 0.72 : 1;
  const sleeveLen = n.sleeve * sf;

  const shY = topY + 28;
  const chY = shY + n.length * 0.28;
  const waY = shY + n.length * 0.62;
  const hmY = shY + n.length;
  const chW = n.chest * 1.05;
  const waW = n.waist * 0.97;
  const hmW = n.waist * 0.99;

  const isKurta = neckType === "mandarin" && (style?.length_factor || 1) > 1.2;

  // Fabric colors per style
  const fabric = isKurta
    ? { main: "#f5ead6", mid: "#e8d5b7", dark: "#c4a97d", light: "#faf3e8", accent: "#b8965a" }
    : neckType === "mandarin"
    ? { main: "#e8ddd0", mid: "#d4c4b0", dark: "#a89070", light: "#f5efe8", accent: "#8a7050" }
    : { main: "#cfe2f3", mid: "#b4cfe6", dark: "#7da7cc", light: "#e8f0f8", accent: "#5b8db8" };

  const slvA = 0.35;
  const slvEX = n.shoulder + sleeveLen * Math.cos(slvA);
  const slvEY = shY + sleeveLen * Math.sin(slvA);
  const slvW = n.chest * 0.3;

  return (
    <g>
      <defs>
        {/* Main fabric gradient */}
        <linearGradient id="mfg" x1="35%" y1="0%" x2="65%" y2="100%">
          <stop offset="0%" stopColor={fabric.light} />
          <stop offset="30%" stopColor={fabric.main} />
          <stop offset="70%" stopColor={fabric.mid} />
          <stop offset="100%" stopColor={fabric.dark} />
        </linearGradient>
        {/* Sleeve gradient */}
        <linearGradient id="msg" x1="0%" y1="0%" x2="100%" y2="60%">
          <stop offset="0%" stopColor={fabric.main} />
          <stop offset="60%" stopColor={fabric.mid} />
          <stop offset="100%" stopColor={fabric.dark} />
        </linearGradient>
        {/* Collar gradient */}
        <linearGradient id="mcg" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#f8f9fa" />
          <stop offset="100%" stopColor="#e9ecef" />
        </linearGradient>
        {/* Fabric weave texture */}
        <pattern id="mweave" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="transparent" />
          <line x1="0" y1="3" x2="6" y2="3" stroke={fabric.dark} strokeWidth="0.2" opacity="0.08" />
          <line x1="3" y1="0" x2="3" y2="6" stroke={fabric.dark} strokeWidth="0.15" opacity="0.05" />
        </pattern>
        {/* Shadow filter */}
        <filter id="msh">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dx="3" dy="5" />
          <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Inner shadow for depth */}
        <filter id="mdepth">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="2" />
          <feComponentTransfer><feFuncA type="linear" slope="0.1" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* === LEFT SLEEVE === */}
      <path d={`M ${cx - n.shoulder} ${shY}
        C ${cx - n.shoulder - sleeveLen * 0.3} ${shY + sleeveLen * 0.05},
          ${cx - slvEX + 5} ${slvEY - slvW * 0.5},
          ${cx - slvEX} ${slvEY - slvW * 0.15}
        Q ${cx - slvEX - 4} ${slvEY + slvW * 0.4},
          ${cx - slvEX + slvW * 0.5} ${slvEY + slvW * 0.75}
        C ${cx - slvEX + slvW * 0.7} ${slvEY + slvW * 0.3},
          ${cx - n.shoulder + 8} ${shY + n.length * 0.18},
          ${cx - n.shoulder + 4} ${shY + n.length * 0.15}
        Z`}
        fill="url(#msg)" stroke={fabric.dark} strokeWidth="0.8" filter="url(#msh)" />
      {/* Sleeve fold lines */}
      <path d={`M ${cx - n.shoulder - sleeveLen * 0.15} ${shY + sleeveLen * 0.06}
        Q ${cx - n.shoulder - sleeveLen * 0.4} ${shY + sleeveLen * 0.2},
          ${cx - slvEX + slvW * 0.3} ${slvEY + slvW * 0.3}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.6" opacity="0.15" />
      <path d={`M ${cx - n.shoulder - sleeveLen * 0.1} ${shY + sleeveLen * 0.12}
        Q ${cx - n.shoulder - sleeveLen * 0.35} ${shY + sleeveLen * 0.25},
          ${cx - slvEX + slvW * 0.1} ${slvEY + slvW * 0.5}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.4" opacity="0.1" />
      {/* Cuff */}
      {sleeveType === "full" && (
        <path d={`M ${cx - slvEX - 1} ${slvEY - slvW * 0.2}
          Q ${cx - slvEX - 5} ${slvEY + slvW * 0.35},
            ${cx - slvEX + slvW * 0.45} ${slvEY + slvW * 0.7}
          Q ${cx - slvEX + slvW * 0.5} ${slvEY + slvW * 0.6},
            ${cx - slvEX + slvW * 0.4} ${slvEY + slvW * 0.55}
          Q ${cx - slvEX - 2} ${slvEY + slvW * 0.2},
            ${cx - slvEX + 2} ${slvEY - slvW * 0.1} Z`}
          fill={fabric.light} stroke={fabric.dark} strokeWidth="0.5" opacity="0.6" />
      )}

      {/* === RIGHT SLEEVE === */}
      <path d={`M ${cx + n.shoulder} ${shY}
        C ${cx + n.shoulder + sleeveLen * 0.3} ${shY + sleeveLen * 0.05},
          ${cx + slvEX - 5} ${slvEY - slvW * 0.5},
          ${cx + slvEX} ${slvEY - slvW * 0.15}
        Q ${cx + slvEX + 4} ${slvEY + slvW * 0.4},
          ${cx + slvEX - slvW * 0.5} ${slvEY + slvW * 0.75}
        C ${cx + slvEX - slvW * 0.7} ${slvEY + slvW * 0.3},
          ${cx + n.shoulder - 8} ${shY + n.length * 0.18},
          ${cx + n.shoulder - 4} ${shY + n.length * 0.15}
        Z`}
        fill="url(#msg)" stroke={fabric.dark} strokeWidth="0.8" filter="url(#msh)" />
      <path d={`M ${cx + n.shoulder + sleeveLen * 0.15} ${shY + sleeveLen * 0.06}
        Q ${cx + n.shoulder + sleeveLen * 0.4} ${shY + sleeveLen * 0.2},
          ${cx + slvEX - slvW * 0.3} ${slvEY + slvW * 0.3}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.6" opacity="0.15" />
      {sleeveType === "full" && (
        <path d={`M ${cx + slvEX + 1} ${slvEY - slvW * 0.2}
          Q ${cx + slvEX + 5} ${slvEY + slvW * 0.35},
            ${cx + slvEX - slvW * 0.45} ${slvEY + slvW * 0.7}
          Q ${cx + slvEX - slvW * 0.5} ${slvEY + slvW * 0.6},
            ${cx + slvEX - slvW * 0.4} ${slvEY + slvW * 0.55}
          Q ${cx + slvEX + 2} ${slvEY + slvW * 0.2},
            ${cx + slvEX - 2} ${slvEY - slvW * 0.1} Z`}
          fill={fabric.light} stroke={fabric.dark} strokeWidth="0.5" opacity="0.6" />
      )}

      {/* === MAIN BODY === */}
      <path d={`M ${cx - n.neck * 0.8} ${topY + 18}
        C ${cx - n.shoulder * 0.6} ${topY + 6}, ${cx - n.shoulder + 5} ${shY - 3}, ${cx - n.shoulder} ${shY}
        L ${cx - n.shoulder + 3} ${shY + n.length * 0.12}
        C ${cx - chW - 3} ${chY - 15}, ${cx - chW - 1} ${chY - 5}, ${cx - chW} ${chY}
        C ${cx - chW + 5} ${chY + 15}, ${cx - waW - 3} ${waY - 15}, ${cx - waW} ${waY}
        C ${cx - waW + 2} ${waY + 15}, ${cx - hmW - 2} ${hmY - 20}, ${cx - hmW} ${hmY}
        Q ${cx} ${hmY + 5} ${cx + hmW} ${hmY}
        C ${cx + hmW + 2} ${hmY - 20}, ${cx + waW - 2} ${waY + 15}, ${cx + waW} ${waY}
        C ${cx + waW + 3} ${waY - 15}, ${cx + chW - 5} ${chY + 15}, ${cx + chW} ${chY}
        C ${cx + chW + 1} ${chY - 5}, ${cx + chW + 3} ${chY - 15}, ${cx + n.shoulder - 3} ${shY + n.length * 0.12}
        L ${cx + n.shoulder} ${shY}
        C ${cx + n.shoulder - 5} ${shY - 3}, ${cx + n.shoulder * 0.6} ${topY + 6}, ${cx + n.neck * 0.8} ${topY + 18}
        Z`}
        fill="url(#mfg)" stroke={fabric.dark} strokeWidth="1" filter="url(#msh)" />
      {/* Fabric texture overlay */}
      <path d={`M ${cx - n.neck * 0.8} ${topY + 18}
        C ${cx - n.shoulder * 0.6} ${topY + 6}, ${cx - n.shoulder + 5} ${shY - 3}, ${cx - n.shoulder} ${shY}
        L ${cx - n.shoulder + 3} ${shY + n.length * 0.12}
        C ${cx - chW - 3} ${chY - 15}, ${cx - chW - 1} ${chY - 5}, ${cx - chW} ${chY}
        C ${cx - chW + 5} ${chY + 15}, ${cx - waW - 3} ${waY - 15}, ${cx - waW} ${waY}
        C ${cx - waW + 2} ${waY + 15}, ${cx - hmW - 2} ${hmY - 20}, ${cx - hmW} ${hmY}
        Q ${cx} ${hmY + 5} ${cx + hmW} ${hmY}
        C ${cx + hmW + 2} ${hmY - 20}, ${cx + waW - 2} ${waY + 15}, ${cx + waW} ${waY}
        C ${cx + waW + 3} ${waY - 15}, ${cx + chW - 5} ${chY + 15}, ${cx + chW} ${chY}
        C ${cx + chW + 1} ${chY - 5}, ${cx + chW + 3} ${chY - 15}, ${cx + n.shoulder - 3} ${shY + n.length * 0.12}
        L ${cx + n.shoulder} ${shY}
        C ${cx + n.shoulder - 5} ${shY - 3}, ${cx + n.shoulder * 0.6} ${topY + 6}, ${cx + n.neck * 0.8} ${topY + 18}
        Z`}
        fill="url(#mweave)" />

      {/* Body fold/wrinkle lines */}
      <path d={`M ${cx - 8} ${chY + 10} Q ${cx - 12} ${(chY + waY) / 2} ${cx - 6} ${waY - 5}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.1" />
      <path d={`M ${cx + 10} ${chY + 15} Q ${cx + 15} ${(chY + waY) / 2} ${cx + 8} ${waY}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.4" opacity="0.08" />
      <path d={`M ${cx - chW + 15} ${chY + 5} Q ${cx - waW + 10} ${(chY + waY) / 2} ${cx - waW + 8} ${waY - 10}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.1" />
      <path d={`M ${cx + chW - 15} ${chY + 5} Q ${cx + waW - 10} ${(chY + waY) / 2} ${cx + waW - 8} ${waY - 10}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.1" />

      {/* Side seam topstitching */}
      <path d={`M ${cx - n.shoulder + 4} ${shY + 8}
        C ${cx - chW + 2} ${chY - 10}, ${cx - chW + 2} ${chY}, ${cx - waW + 2} ${waY}
        C ${cx - waW + 1} ${waY + 10}, ${cx - hmW + 2} ${hmY - 15}, ${cx - hmW + 1} ${hmY}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.6" opacity="0.12" strokeDasharray="2,4" />
      <path d={`M ${cx + n.shoulder - 4} ${shY + 8}
        C ${cx + chW - 2} ${chY - 10}, ${cx + chW - 2} ${chY}, ${cx + waW - 2} ${waY}
        C ${cx + waW - 1} ${waY + 10}, ${cx + hmW - 2} ${hmY - 15}, ${cx + hmW - 1} ${hmY}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.6" opacity="0.12" strokeDasharray="2,4" />

      {/* === PLACKET (center front) === */}
      <rect x={cx - 5} y={topY + 30} width={10} height={hmY - topY - 35} fill={fabric.light} opacity="0.3" rx="1" />
      <line x1={cx - 5} y1={topY + 30} x2={cx - 5} y2={hmY - 5} stroke={fabric.dark} strokeWidth="0.5" opacity="0.2" />
      <line x1={cx + 5} y1={topY + 30} x2={cx + 5} y2={hmY - 5} stroke={fabric.dark} strokeWidth="0.5" opacity="0.2" />

      {/* === BUTTONS === */}
      {[0.08, 0.2, 0.33, 0.46, 0.6, 0.74, 0.88].map((pct, i) => {
        const by = shY + n.length * pct;
        return (
          <g key={i}>
            {/* Button shadow */}
            <circle cx={cx + 0.5} cy={by + 0.5} r={4} fill="#000" opacity="0.08" />
            {/* Button body */}
            <circle cx={cx} cy={by} r={3.8} fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.6" />
            {/* Button rim */}
            <circle cx={cx} cy={by} r={3} fill="none" stroke="#dee2e6" strokeWidth="0.3" />
            {/* 4-hole pattern */}
            <circle cx={cx - 1.2} cy={by - 1.2} r={0.6} fill="#adb5bd" />
            <circle cx={cx + 1.2} cy={by - 1.2} r={0.6} fill="#adb5bd" />
            <circle cx={cx - 1.2} cy={by + 1.2} r={0.6} fill="#adb5bd" />
            <circle cx={cx + 1.2} cy={by + 1.2} r={0.6} fill="#adb5bd" />
            {/* Thread cross */}
            <line x1={cx - 1.2} y1={by - 1.2} x2={cx + 1.2} y2={by + 1.2} stroke="#adb5bd" strokeWidth="0.3" />
            <line x1={cx + 1.2} y1={by - 1.2} x2={cx - 1.2} y2={by + 1.2} stroke="#adb5bd" strokeWidth="0.3" />
            {/* Buttonhole on opposite side */}
            <ellipse cx={cx - 12} cy={by} rx={4} ry={1.2} fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.2" />
          </g>
        );
      })}

      {/* === COLLAR === */}
      {neckType === "collar" && (
        <g filter="url(#mdepth)">
          {/* Collar band */}
          <path d={`M ${cx - n.neck} ${topY + 14}
            Q ${cx - n.neck * 0.5} ${topY + 2}, ${cx} ${topY}
            Q ${cx + n.neck * 0.5} ${topY + 2}, ${cx + n.neck} ${topY + 14}
            Q ${cx + n.neck * 0.5} ${topY + 8}, ${cx} ${topY + 7}
            Q ${cx - n.neck * 0.5} ${topY + 8}, ${cx - n.neck} ${topY + 14} Z`}
            fill="url(#mcg)" stroke="#ccc" strokeWidth="0.6" />
          {/* Left collar leaf */}
          <path d={`M ${cx - n.neck * 0.6} ${topY + 10}
            C ${cx - n.neck * 0.8} ${topY + 12}, ${cx - n.shoulder * 0.65} ${topY + 18}, ${cx - n.shoulder * 0.55} ${topY + 35}
            L ${cx - n.neck * 0.08} ${topY + 26}
            Q ${cx - n.neck * 0.3} ${topY + 16}, ${cx - n.neck * 0.6} ${topY + 10} Z`}
            fill="url(#mcg)" stroke="#ccc" strokeWidth="0.6" />
          {/* Collar fold shadow */}
          <path d={`M ${cx - n.neck * 0.55} ${topY + 12}
            Q ${cx - n.shoulder * 0.4} ${topY + 22}, ${cx - n.neck * 0.1} ${topY + 25}`}
            fill="none" stroke="#bbb" strokeWidth="0.4" opacity="0.3" />
          {/* Right collar leaf */}
          <path d={`M ${cx + n.neck * 0.6} ${topY + 10}
            C ${cx + n.neck * 0.8} ${topY + 12}, ${cx + n.shoulder * 0.65} ${topY + 18}, ${cx + n.shoulder * 0.55} ${topY + 35}
            L ${cx + n.neck * 0.08} ${topY + 26}
            Q ${cx + n.neck * 0.3} ${topY + 16}, ${cx + n.neck * 0.6} ${topY + 10} Z`}
            fill="url(#mcg)" stroke="#ccc" strokeWidth="0.6" />
          <path d={`M ${cx + n.neck * 0.55} ${topY + 12}
            Q ${cx + n.shoulder * 0.4} ${topY + 22}, ${cx + n.neck * 0.1} ${topY + 25}`}
            fill="none" stroke="#bbb" strokeWidth="0.4" opacity="0.3" />
        </g>
      )}
      {neckType === "mandarin" && (
        <g filter="url(#mdepth)">
          <path d={`M ${cx - n.neck * 0.75} ${topY + 16}
            Q ${cx - n.neck * 0.75} ${topY - 4}, ${cx} ${topY - 6}
            Q ${cx + n.neck * 0.75} ${topY - 4}, ${cx + n.neck * 0.75} ${topY + 16}
            Q ${cx + n.neck * 0.4} ${topY + 12}, ${cx} ${topY + 11}
            Q ${cx - n.neck * 0.4} ${topY + 12}, ${cx - n.neck * 0.75} ${topY + 16} Z`}
            fill={fabric.light} stroke={fabric.dark} strokeWidth="0.8" />
          <line x1={cx} y1={topY - 5} x2={cx} y2={topY + 11} stroke={fabric.dark} strokeWidth="0.4" opacity="0.3" />
          {/* Hook/eye closure */}
          <circle cx={cx - 2} cy={topY + 3} r={1} fill={fabric.accent} opacity="0.4" />
          <circle cx={cx + 2} cy={topY + 3} r={1} fill={fabric.accent} opacity="0.4" />
        </g>
      )}

      {/* Breast pocket */}
      <path d={`M ${cx + chW * 0.18} ${chY - 18}
        L ${cx + chW * 0.18} ${chY - 3}
        Q ${cx + chW * 0.35} ${chY - 2}, ${cx + chW * 0.5} ${chY - 3}
        L ${cx + chW * 0.5} ${chY - 18} Z`}
        fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.2" />
      {/* Pocket flap shadow */}
      <line x1={cx + chW * 0.19} y1={chY - 17} x2={cx + chW * 0.49} y2={chY - 17}
        stroke={fabric.dark} strokeWidth="0.4" opacity="0.1" />

      {/* Hem stitching */}
      <path d={`M ${cx - hmW + 3} ${hmY - 2} Q ${cx} ${hmY + 3} ${cx + hmW - 3} ${hmY - 2}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.4" opacity="0.15" strokeDasharray="2,2" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  FEMALE BLOUSE / KURTI                                              */
/* ------------------------------------------------------------------ */
function FemaleBlouse({ n, style }: { n: ReturnType<typeof normalize>; style: StyleInfo | null }) {
  const cx = 300;
  const topY = 90;
  const neckType = style?.neck_type || "round";
  const sleeveType = style?.sleeve_type || "full";
  const sf = sleeveType === "half" ? 0.4 : sleeveType === "3-quarter" ? 0.72 : sleeveType === "sleeveless" ? 0 : 1;
  const sleeveLen = n.sleeve * sf;
  const isLong = (style?.length_factor || 1) > 1.2;

  const shY = topY + 22;
  const buY = shY + n.length * 0.22;
  const waY = shY + n.length * 0.5;
  const hiY = shY + n.length * 0.72;
  const hmY = shY + n.length;

  const shW = n.shoulder * 0.95;
  const buW = n.chest * 1.08;
  const waW = n.waist * (isLong ? 0.82 : 0.85);
  const hiW = isLong ? n.waist * 1.15 : n.waist * 1.0;
  const hmW = isLong ? n.waist * 1.35 : n.waist * 1.0;

  const fabric = isLong
    ? { main: "#f0d0e0", mid: "#e0b0c8", dark: "#c080a0", light: "#f8e8f0", accent: "#d4618c" }
    : { main: "#e0d0f0", mid: "#c8b0e0", dark: "#9878c0", light: "#f0e8f8", accent: "#7b5ea7" };

  const slvA = 0.4;
  const slvEX = shW + sleeveLen * Math.cos(slvA);
  const slvEY = shY + sleeveLen * Math.sin(slvA);
  const slvW = n.chest * 0.24;

  return (
    <g>
      <defs>
        <linearGradient id="ffg" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor={fabric.light} />
          <stop offset="35%" stopColor={fabric.main} />
          <stop offset="65%" stopColor={fabric.mid} />
          <stop offset="100%" stopColor={fabric.dark} />
        </linearGradient>
        <linearGradient id="fsg" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={fabric.main} />
          <stop offset="100%" stopColor={fabric.dark} />
        </linearGradient>
        <pattern id="fweave" patternUnits="userSpaceOnUse" width="5" height="5">
          <rect width="5" height="5" fill="transparent" />
          <circle cx="2.5" cy="2.5" r="0.4" fill={fabric.dark} opacity="0.06" />
        </pattern>
        <filter id="fsh">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dx="3" dy="5" />
          <feComponentTransfer><feFuncA type="linear" slope="0.18" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* === SLEEVES === */}
      {sleeveType !== "sleeveless" && (
        <>
          <path d={`M ${cx - shW} ${shY}
            C ${cx - shW - sleeveLen * 0.3} ${shY + sleeveLen * 0.04},
              ${cx - slvEX + 5} ${slvEY - slvW * 0.4},
              ${cx - slvEX} ${slvEY - slvW * 0.1}
            Q ${cx - slvEX - 3} ${slvEY + slvW * 0.35},
              ${cx - slvEX + slvW * 0.4} ${slvEY + slvW * 0.65}
            C ${cx - slvEX + slvW * 0.6} ${slvEY + slvW * 0.3},
              ${cx - shW + 6} ${shY + n.length * 0.14},
              ${cx - shW + 4} ${shY + n.length * 0.12} Z`}
            fill="url(#fsg)" stroke={fabric.dark} strokeWidth="0.8" filter="url(#fsh)" />
          {/* Puff gather at shoulder */}
          {sleeveType === "half" && (
            <>
              <path d={`M ${cx - shW - 2} ${shY + 3} Q ${cx - shW - 8} ${shY + 8} ${cx - shW - 3} ${shY + 14}`}
                fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.15" />
              <path d={`M ${cx - shW - 5} ${shY + 5} Q ${cx - shW - 12} ${shY + 10} ${cx - shW - 6} ${shY + 16}`}
                fill="none" stroke={fabric.dark} strokeWidth="0.4" opacity="0.1" />
            </>
          )}
          <path d={`M ${cx + shW} ${shY}
            C ${cx + shW + sleeveLen * 0.3} ${shY + sleeveLen * 0.04},
              ${cx + slvEX - 5} ${slvEY - slvW * 0.4},
              ${cx + slvEX} ${slvEY - slvW * 0.1}
            Q ${cx + slvEX + 3} ${slvEY + slvW * 0.35},
              ${cx + slvEX - slvW * 0.4} ${slvEY + slvW * 0.65}
            C ${cx + slvEX - slvW * 0.6} ${slvEY + slvW * 0.3},
              ${cx + shW - 6} ${shY + n.length * 0.14},
              ${cx + shW - 4} ${shY + n.length * 0.12} Z`}
            fill="url(#fsg)" stroke={fabric.dark} strokeWidth="0.8" filter="url(#fsh)" />
          {sleeveType === "half" && (
            <>
              <path d={`M ${cx + shW + 2} ${shY + 3} Q ${cx + shW + 8} ${shY + 8} ${cx + shW + 3} ${shY + 14}`}
                fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.15" />
            </>
          )}
        </>
      )}

      {/* === MAIN BODY === */}
      <path d={`M ${cx - n.neck * 0.7} ${topY + 14}
        C ${cx - shW * 0.6} ${topY + 4}, ${cx - shW + 4} ${shY - 3}, ${cx - shW} ${shY}
        L ${cx - shW + 3} ${shY + 8}
        C ${cx - buW - 4} ${buY - 12}, ${cx - buW - 2} ${buY - 4}, ${cx - buW} ${buY}
        C ${cx - buW + 10} ${buY + 18}, ${cx - waW - 5} ${waY - 18}, ${cx - waW} ${waY}
        C ${cx - hiW - 3} ${(waY + hiY) / 2}, ${cx - hiW - 1} ${hiY - 5}, ${cx - hiW} ${hiY}
        C ${cx - hmW + 2} ${(hiY + hmY) / 2}, ${cx - hmW} ${hmY - 8}, ${cx - hmW} ${hmY}
        Q ${cx} ${hmY + (isLong ? 10 : 4)} ${cx + hmW} ${hmY}
        C ${cx + hmW} ${hmY - 8}, ${cx + hmW - 2} ${(hiY + hmY) / 2}, ${cx + hiW} ${hiY}
        C ${cx + hiW + 1} ${hiY - 5}, ${cx + hiW + 3} ${(waY + hiY) / 2}, ${cx + waW} ${waY}
        C ${cx + waW + 5} ${waY - 18}, ${cx + buW - 10} ${buY + 18}, ${cx + buW} ${buY}
        C ${cx + buW + 2} ${buY - 4}, ${cx + buW + 4} ${buY - 12}, ${cx + shW - 3} ${shY + 8}
        L ${cx + shW} ${shY}
        C ${cx + shW - 4} ${shY - 3}, ${cx + shW * 0.6} ${topY + 4}, ${cx + n.neck * 0.7} ${topY + 14}
        Z`}
        fill="url(#ffg)" stroke={fabric.dark} strokeWidth="1" filter="url(#fsh)" />
      <path d={`M ${cx - n.neck * 0.7} ${topY + 14}
        C ${cx - shW * 0.6} ${topY + 4}, ${cx - shW + 4} ${shY - 3}, ${cx - shW} ${shY}
        L ${cx - shW + 3} ${shY + 8}
        C ${cx - buW - 4} ${buY - 12}, ${cx - buW - 2} ${buY - 4}, ${cx - buW} ${buY}
        C ${cx - buW + 10} ${buY + 18}, ${cx - waW - 5} ${waY - 18}, ${cx - waW} ${waY}
        C ${cx - hiW - 3} ${(waY + hiY) / 2}, ${cx - hiW - 1} ${hiY - 5}, ${cx - hiW} ${hiY}
        C ${cx - hmW + 2} ${(hiY + hmY) / 2}, ${cx - hmW} ${hmY - 8}, ${cx - hmW} ${hmY}
        Q ${cx} ${hmY + (isLong ? 10 : 4)} ${cx + hmW} ${hmY}
        C ${cx + hmW} ${hmY - 8}, ${cx + hmW - 2} ${(hiY + hmY) / 2}, ${cx + hiW} ${hiY}
        C ${cx + hiW + 1} ${hiY - 5}, ${cx + hiW + 3} ${(waY + hiY) / 2}, ${cx + waW} ${waY}
        C ${cx + waW + 5} ${waY - 18}, ${cx + buW - 10} ${buY + 18}, ${cx + buW} ${buY}
        C ${cx + buW + 2} ${buY - 4}, ${cx + buW + 4} ${buY - 12}, ${cx + shW - 3} ${shY + 8}
        L ${cx + shW} ${shY}
        C ${cx + shW - 4} ${shY - 3}, ${cx + shW * 0.6} ${topY + 4}, ${cx + n.neck * 0.7} ${topY + 14}
        Z`}
        fill="url(#fweave)" />

      {/* Bust dart lines */}
      <path d={`M ${cx - buW * 0.45} ${buY} Q ${cx - waW * 0.45} ${(buY + waY) / 2} ${cx - waW * 0.5} ${waY - 5}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.12" />
      <path d={`M ${cx + buW * 0.45} ${buY} Q ${cx + waW * 0.45} ${(buY + waY) / 2} ${cx + waW * 0.5} ${waY - 5}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.5" opacity="0.12" />
      {/* Waist gather folds */}
      <path d={`M ${cx - 6} ${waY - 8} Q ${cx - 10} ${waY} ${cx - 5} ${waY + 12}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.4" opacity="0.08" />
      <path d={`M ${cx + 8} ${waY - 5} Q ${cx + 12} ${waY + 3} ${cx + 6} ${waY + 15}`}
        fill="none" stroke={fabric.dark} strokeWidth="0.4" opacity="0.08" />

      {/* === NECKLINE === */}
      {neckType === "round" && (
        <g>
          <path d={`M ${cx - n.neck * 0.7} ${topY + 14}
            Q ${cx - n.neck * 0.3} ${topY - 6}, ${cx} ${topY - 10}
            Q ${cx + n.neck * 0.3} ${topY - 6}, ${cx + n.neck * 0.7} ${topY + 14}`}
            fill="none" stroke={fabric.dark} strokeWidth="2.5" />
          <path d={`M ${cx - n.neck * 0.65} ${topY + 12}
            Q ${cx - n.neck * 0.25} ${topY - 3}, ${cx} ${topY - 7}
            Q ${cx + n.neck * 0.25} ${topY - 3}, ${cx + n.neck * 0.65} ${topY + 12}`}
            fill="none" stroke={fabric.accent} strokeWidth="1" opacity="0.4" />
          {/* Embroidery dots around neckline */}
          {isLong && Array.from({ length: 16 }).map((_, i) => {
            const t = i / 15;
            const angle = Math.PI * (0.15 + t * 0.7);
            const rx = n.neck * 0.85;
            const ry = n.neck * 0.55;
            const px = cx + Math.cos(angle) * rx;
            const py = topY + 3 - Math.sin(angle) * ry;
            return <circle key={i} cx={px} cy={py} r={1.5} fill={fabric.accent} opacity="0.25" />;
          })}
        </g>
      )}
      {neckType === "v-neck" && (
        <g>
          <path d={`M ${cx - n.neck * 0.7} ${topY + 14}
            L ${cx} ${topY + 55}
            L ${cx + n.neck * 0.7} ${topY + 14}`}
            fill="none" stroke={fabric.dark} strokeWidth="2" />
          <path d={`M ${cx - n.neck * 0.65} ${topY + 15}
            L ${cx} ${topY + 52}
            L ${cx + n.neck * 0.65} ${topY + 15}`}
            fill="none" stroke={fabric.accent} strokeWidth="0.8" opacity="0.3" />
        </g>
      )}
      {neckType === "collar" && (
        <g>
          <path d={`M ${cx - n.neck * 0.8} ${topY + 10}
            Q ${cx} ${topY - 10} ${cx + n.neck * 0.8} ${topY + 10}
            Q ${cx} ${topY + 4} ${cx - n.neck * 0.8} ${topY + 10} Z`}
            fill="#f8f9fa" stroke="#ccc" strokeWidth="0.6" />
          <path d={`M ${cx - n.neck * 0.4} ${topY + 7}
            L ${cx - shW * 0.42} ${topY + 24} L ${cx - n.neck * 0.08} ${topY + 19} Z`}
            fill="#f8f9fa" stroke="#ccc" strokeWidth="0.5" />
          <path d={`M ${cx + n.neck * 0.4} ${topY + 7}
            L ${cx + shW * 0.42} ${topY + 24} L ${cx + n.neck * 0.08} ${topY + 19} Z`}
            fill="#f8f9fa" stroke="#ccc" strokeWidth="0.5" />
          <line x1={cx} y1={topY + 20} x2={cx} y2={hmY - 5} stroke={fabric.dark} strokeWidth="0.5" opacity="0.15" />
          {[0.15, 0.3, 0.45, 0.6, 0.75].map((p, i) => (
            <g key={i}>
              <circle cx={cx} cy={shY + n.length * p} r={2.5} fill="#f1f3f5" stroke="#ced4da" strokeWidth="0.5" />
              <circle cx={cx - 0.8} cy={shY + n.length * p - 0.8} r={0.4} fill="#adb5bd" />
              <circle cx={cx + 0.8} cy={shY + n.length * p + 0.8} r={0.4} fill="#adb5bd" />
            </g>
          ))}
        </g>
      )}

      {/* Border at hem for long styles */}
      {isLong && (
        <g opacity="0.25">
          <path d={`M ${cx - hmW + 5} ${hmY - 12} Q ${cx} ${hmY - 8} ${cx + hmW - 5} ${hmY - 12}`}
            fill="none" stroke={fabric.accent} strokeWidth="2.5" />
          <path d={`M ${cx - hmW + 5} ${hmY - 6} Q ${cx} ${hmY - 2} ${cx + hmW - 5} ${hmY - 6}`}
            fill="none" stroke={fabric.accent} strokeWidth="1.5" />
          <path d={`M ${cx - hmW + 5} ${hmY - 2} Q ${cx} ${hmY + 2} ${cx + hmW - 5} ${hmY - 2}`}
            fill="none" stroke={fabric.accent} strokeWidth="0.8" />
        </g>
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  MEASUREMENT ANNOTATIONS                                            */
/* ------------------------------------------------------------------ */
function Annotations({ m, n, gender, style }: {
  m: BodyMeasurements; n: ReturnType<typeof normalize>; gender: string; style: StyleInfo | null;
}) {
  const cx = 300;
  const topY = 90;
  const shY = topY + (gender === "female" ? 22 : 28);
  const chY = shY + n.length * (gender === "female" ? 0.22 : 0.28);
  const waY = shY + n.length * (gender === "female" ? 0.5 : 0.62);
  const hmY = shY + n.length;
  const shW = gender === "female" ? n.shoulder * 0.95 : n.shoulder;
  const slvType = style?.sleeve_type || "full";
  const slvF = slvType === "half" ? 0.4 : slvType === "3-quarter" ? 0.72 : 1;
  const aSlv = n.sleeve * slvF;

  return (
    <g fontFamily="system-ui, sans-serif">
      <defs>
        <marker id="arr" markerWidth="6" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L6,2 L0,4" fill="none" stroke="#22c55e" strokeWidth="0.8" />
        </marker>
      </defs>

      {/* Shoulder */}
      <line x1={cx - shW} y1={shY - 10} x2={cx + shW} y2={shY - 10}
        stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arr)" markerStart="url(#arr)" />
      <rect x={cx - 35} y={shY - 30} width="70" height="18" rx="4" fill="#0d1117" fillOpacity="0.85" />
      <text x={cx} y={shY - 16} textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="600">
        {m.shoulder_width_cm} cm
      </text>

      {/* Chest */}
      <line x1={cx - n.chest * 1.1} y1={chY} x2={cx + n.chest * 1.1} y2={chY}
        stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
      <rect x={cx + n.chest * 1.1 + 6} y={chY - 14} width="72" height="26" rx="4" fill="#0d1117" fillOpacity="0.9" />
      <text x={cx + n.chest * 1.1 + 12} y={chY - 1} fill="#ef4444" fontSize="9" fontWeight="600">Chest</text>
      <text x={cx + n.chest * 1.1 + 12} y={chY + 9} fill="#ef4444" fontSize="10">{m.chest_circumference_cm} cm</text>

      {/* Waist */}
      <line x1={cx - n.waist * 1.0} y1={waY} x2={cx + n.waist * 1.0} y2={waY}
        stroke="#a855f7" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
      <rect x={cx + n.waist * 1.0 + 6} y={waY - 14} width="68" height="26" rx="4" fill="#0d1117" fillOpacity="0.9" />
      <text x={cx + n.waist * 1.0 + 12} y={waY - 1} fill="#a855f7" fontSize="9" fontWeight="600">Waist</text>
      <text x={cx + n.waist * 1.0 + 12} y={waY + 9} fill="#a855f7" fontSize="10">{m.waist_cm} cm</text>

      {/* Length */}
      <line x1={cx - shW - 22} y1={shY} x2={cx - shW - 22} y2={hmY} stroke="#06b6d4" strokeWidth="1.5" />
      <line x1={cx - shW - 27} y1={shY} x2={cx - shW - 17} y2={shY} stroke="#06b6d4" strokeWidth="0.8" />
      <line x1={cx - shW - 27} y1={hmY} x2={cx - shW - 17} y2={hmY} stroke="#06b6d4" strokeWidth="0.8" />
      <rect x={cx - shW - 70} y={(shY + hmY) / 2 - 14} width="46" height="26" rx="4" fill="#0d1117" fillOpacity="0.9" />
      <text x={cx - shW - 47} y={(shY + hmY) / 2 - 1} fill="#06b6d4" fontSize="9" fontWeight="600" textAnchor="middle">Length</text>
      <text x={cx - shW - 47} y={(shY + hmY) / 2 + 9} fill="#06b6d4" fontSize="10" textAnchor="middle">{m.shirt_length_cm}</text>

      {/* Sleeve */}
      {slvType !== "sleeveless" && (
        <>
          <line x1={cx + shW + 3} y1={shY}
            x2={cx + shW + aSlv * 0.7 + 3} y2={shY + aSlv * 0.4}
            stroke="#f97316" strokeWidth="1.5" />
          <rect x={cx + shW + aSlv * 0.25} y={shY + aSlv * 0.12 - 24} width="72" height="26" rx="4" fill="#0d1117" fillOpacity="0.9" />
          <text x={cx + shW + aSlv * 0.25 + 6} y={shY + aSlv * 0.12 - 11} fill="#f97316" fontSize="9" fontWeight="600">Sleeve</text>
          <text x={cx + shW + aSlv * 0.25 + 6} y={shY + aSlv * 0.12 - 1} fill="#f97316" fontSize="10">{m.sleeve_length_cm} cm</text>
        </>
      )}

      {/* Neck */}
      <rect x={cx - 38} y={topY - 42} width="76" height="20" rx="4" fill="#0d1117" fillOpacity="0.9" />
      <text x={cx} y={topY - 27} textAnchor="middle" fill="#eab308" fontSize="10" fontWeight="600">
        Neck {m.neck_size_cm} cm
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPONENT                                                     */
/* ------------------------------------------------------------------ */
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
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Shoulder</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Chest</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />Waist</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />Length</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Sleeve</span>
        </div>
      </div>
      <svg viewBox="0 0 600 520" className="w-full" style={{ maxHeight: 480 }}>
        <rect width="600" height="520" fill="#111827" />
        {/* Subtle radial light */}
        <radialGradient id="bglight" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>
        <rect width="600" height="520" fill="url(#bglight)" />

        {gender === "female"
          ? <FemaleBlouse n={n} style={style} />
          : <MaleShirt n={n} style={style} />
        }
        <Annotations m={measurements} n={n} gender={gender} style={style} />
      </svg>
    </div>
  );
}
