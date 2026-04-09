"use client";

import { useState } from "react";
import type { MeasurementResponse, MeasurementKey } from "../lib/types";

interface MeasurementDisplayProps {
  data: MeasurementResponse;
  onSaveProfile?: () => void;
}

const MEASUREMENT_LABELS: Record<MeasurementKey, { label: string; icon: string; color: string }> = {
  shoulder_width_cm: { label: "Shoulder Width", icon: "\u2194", color: "text-green-400" },
  chest_circumference_cm: { label: "Chest", icon: "\u25EF", color: "text-red-400" },
  sleeve_length_cm: { label: "Sleeve Length", icon: "\u27F6", color: "text-orange-400" },
  shirt_length_cm: { label: "Shirt Length", icon: "\u2195", color: "text-cyan-400" },
  neck_size_cm: { label: "Neck", icon: "\u25CB", color: "text-yellow-400" },
  waist_cm: { label: "Waist", icon: "\u25CE", color: "text-purple-400" },
};

const SIZE_COLORS: Record<string, string> = {
  XS: "bg-blue-600",
  S: "bg-blue-500",
  M: "bg-green-500",
  L: "bg-yellow-500",
  XL: "bg-orange-500",
  XXL: "bg-red-500",
  "3XL": "bg-red-700",
};

export default function MeasurementDisplay({ data, onSaveProfile }: MeasurementDisplayProps) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [showBody, setShowBody] = useState(false);

  const measurements = data.measurements;
  const inches = data.measurements_inches;
  const hasStyle = !!data.style;
  const bodyMeasurements = data.body_measurements;

  const confidenceColor =
    data.confidence >= 0.8
      ? "text-green-400"
      : data.confidence >= 0.6
      ? "text-yellow-400"
      : "text-red-400";

  const exportJSON = () => {
    const exportData = {
      style: data.style ? { name: data.style.name, id: data.style.id } : null,
      stitching_measurements_cm: {
        shoulder_width: measurements.shoulder_width_cm,
        chest_circumference: measurements.chest_circumference_cm,
        sleeve_length: measurements.sleeve_length_cm,
        shirt_length: measurements.shirt_length_cm,
        neck_size: measurements.neck_size_cm,
        waist: measurements.waist_cm,
      },
      stitching_measurements_inches: inches,
      body_measurements_cm: bodyMeasurements || null,
      recommended_size: data.recommended_size,
      confidence: data.confidence,
      warnings: data.warnings,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `measurements_${data.style?.id || "body"}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getValue = (key: MeasurementKey): number => {
    if (unit === "cm") {
      return measurements[key] as number;
    }
    return inches[key] ?? (measurements[key] as number) / 2.54;
  };

  const getBodyValue = (key: MeasurementKey): number | null => {
    if (!bodyMeasurements) return null;
    const val = bodyMeasurements[key];
    if (val === undefined) return null;
    return unit === "cm" ? val : val / 2.54;
  };

  const getEaseDiff = (key: MeasurementKey): number | null => {
    if (!bodyMeasurements || !hasStyle) return null;
    const stitching = measurements[key] as number;
    const body = bodyMeasurements[key];
    if (body === undefined) return null;
    return stitching - body;
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {hasStyle ? "Stitching Measurements" : "Measurements"}
          </h2>
          {data.style && (
            <p className="text-xs text-blue-400 mt-0.5">
              {data.style.name} — {data.style.neck_type} neck, {data.style.sleeve_type} sleeve
            </p>
          )}
        </div>
        <div className="flex bg-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setUnit("cm")}
            className={`px-3 py-1 text-sm font-medium transition ${
              unit === "cm" ? "bg-blue-600 text-white" : "text-gray-400"
            }`}
          >
            cm
          </button>
          <button
            onClick={() => setUnit("in")}
            className={`px-3 py-1 text-sm font-medium transition ${
              unit === "in" ? "bg-blue-600 text-white" : "text-gray-400"
            }`}
          >
            in
          </button>
        </div>
      </div>

      {/* Size Recommendation */}
      <div className="flex items-center gap-3 bg-gray-700/50 rounded-xl p-4">
        <div
          className={`${SIZE_COLORS[data.recommended_size] || "bg-gray-500"} text-white text-2xl font-bold px-4 py-2 rounded-lg min-w-[60px] text-center`}
        >
          {data.recommended_size}
        </div>
        <div>
          <p className="text-white font-medium">Recommended Size</p>
          <p className="text-sm text-gray-400">
            {hasStyle ? `For ${data.style!.name}` : "Based on chest measurement"}
          </p>
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Confidence:</span>
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              data.confidence >= 0.8 ? "bg-green-500" : data.confidence >= 0.6 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${data.confidence * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${confidenceColor}`}>
          {Math.round(data.confidence * 100)}%
        </span>
      </div>

      {/* Toggle body vs stitching */}
      {hasStyle && bodyMeasurements && (
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowBody(!showBody)}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            {showBody ? "Hide" : "Show"} body vs stitching comparison
          </button>
        </div>
      )}

      {/* Measurement Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(MEASUREMENT_LABELS) as [MeasurementKey, typeof MEASUREMENT_LABELS[MeasurementKey]][]).map(
          ([key, { label, icon, color }]) => {
            const value = getValue(key);
            const easeDiff = getEaseDiff(key);
            const bodyVal = getBodyValue(key);

            return (
              <div key={key} className="bg-gray-700/50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`${color} text-sm`}>{icon}</span>
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
                <p className="text-xl font-semibold text-white">
                  {value.toFixed(1)}
                  <span className="text-sm text-gray-400 ml-1">{unit}</span>
                </p>
                {/* Ease indicator */}
                {easeDiff !== null && Math.abs(easeDiff) > 0.05 && (
                  <p className="text-[10px] text-blue-400 mt-0.5">
                    {easeDiff > 0 ? "+" : ""}{(unit === "cm" ? easeDiff : easeDiff / 2.54).toFixed(1)} ease
                  </p>
                )}
                {/* Body measurement comparison */}
                {showBody && bodyVal !== null && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Body: {bodyVal.toFixed(1)} {unit}
                  </p>
                )}
              </div>
            );
          }
        )}
      </div>

      {/* Warnings */}
      {data.warnings.length > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-3 space-y-1">
          {data.warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-300 flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">!</span>
              {w}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={exportJSON}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          Export JSON
        </button>
        {onSaveProfile && (
          <button
            onClick={onSaveProfile}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            Save Profile
          </button>
        )}
      </div>
    </div>
  );
}
