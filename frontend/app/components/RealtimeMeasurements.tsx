"use client";

import type { FrameResponse } from "../lib/types";

interface RealtimeMeasurementsProps {
  data: FrameResponse | null;
}

const LABELS: Record<string, string> = {
  shoulder_width_cm: "Shoulders",
  chest_circumference_cm: "Chest",
  sleeve_length_cm: "Sleeve",
  shirt_length_cm: "Shirt Length",
  neck_size_cm: "Neck",
  waist_cm: "Waist",
};

export default function RealtimeMeasurements({ data }: RealtimeMeasurementsProps) {
  if (!data?.detected || !data.measurements) {
    return (
      <div className="bg-gray-800 rounded-2xl p-4">
        <p className="text-gray-500 text-sm text-center">
          {data ? "No body detected" : "Waiting for camera data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Live Measurements</h3>
        {data.recommended_size && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            {data.recommended_size}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(LABELS).map(([key, label]) => (
          <div key={key} className="bg-gray-700/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-white">
              {data.measurements![key]?.toFixed(1) ?? "—"}
              <span className="text-[10px] text-gray-500 ml-0.5">cm</span>
            </p>
          </div>
        ))}
      </div>
      {data.confidence !== undefined && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Confidence:</span>
          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-green-500"
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
          <span>{Math.round(data.confidence * 100)}%</span>
        </div>
      )}
    </div>
  );
}
