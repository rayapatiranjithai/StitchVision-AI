"use client";

import { useState, useEffect } from "react";
import { fetchStyles } from "../lib/api";
import type { StyleInfo } from "../lib/types";

interface StyleSelectorProps {
  gender: string;
  selectedStyle: string | null;
  onStyleSelect: (styleId: string | null) => void;
}

const SLEEVE_ICONS: Record<string, string> = {
  full: "\u{1F9E5}",
  "3-quarter": "\u00BE",
  half: "\u00BD",
  sleeveless: "\u2205",
};

const NECK_LABELS: Record<string, string> = {
  collar: "Collar",
  mandarin: "Mandarin",
  round: "Round Neck",
  "v-neck": "V-Neck",
  band: "Band",
  boat: "Boat Neck",
  square: "Square Neck",
};

export default function StyleSelector({ gender, selectedStyle, onStyleSelect }: StyleSelectorProps) {
  const [styles, setStyles] = useState<StyleInfo[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchStyles(gender).then(setStyles);
  }, [gender]);

  if (styles.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Stitching Style</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a style to get tailor-ready measurements with proper ease
          </p>
        </div>
        {selectedStyle && (
          <button
            onClick={() => onStyleSelect(null)}
            className="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded bg-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-2">
        {styles.map((style) => {
          const isSelected = selectedStyle === style.id;
          const isExpanded = expanded === style.id;

          return (
            <div key={style.id}>
              {/* Style Card */}
              <button
                onClick={() => onStyleSelect(isSelected ? null : style.id)}
                className={`w-full text-left rounded-xl p-3 transition-all border ${
                  isSelected
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-gray-700 bg-gray-700/30 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{style.name}</span>
                      {isSelected && (
                        <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{style.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                      {NECK_LABELS[style.neck_type] || style.neck_type}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
                      {SLEEVE_ICONS[style.sleeve_type] || ""} {style.sleeve_type} sleeve
                    </span>
                  </div>
                </div>

                {/* Ease tags */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded">
                    Chest +{style.ease.chest_cm}cm
                  </span>
                  <span className="text-[10px] text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
                    Waist +{style.ease.waist_cm}cm
                  </span>
                  {style.length_factor !== 1.0 && (
                    <span className="text-[10px] text-cyan-400 bg-cyan-900/30 px-1.5 py-0.5 rounded">
                      Length x{style.length_factor}
                    </span>
                  )}
                  {style.sleeve_factor !== 1.0 && (
                    <span className="text-[10px] text-orange-400 bg-orange-900/30 px-1.5 py-0.5 rounded">
                      Sleeve x{style.sleeve_factor}
                    </span>
                  )}
                </div>
              </button>

              {/* Expand/collapse standards */}
              {isSelected && (
                <div className="mt-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(isExpanded ? null : style.id);
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 transition"
                  >
                    {isExpanded ? "Hide" : "View"} size standards
                  </button>

                  {isExpanded && style.standards && (
                    <div className="mt-2 bg-gray-900/50 rounded-lg p-3 overflow-x-auto">
                      <table className="w-full text-[10px] text-gray-400">
                        <thead>
                          <tr className="text-gray-500 border-b border-gray-700">
                            <th className="text-left py-1 pr-2 font-medium">Size</th>
                            <th className="text-left py-1 pr-2 font-medium">Chest</th>
                            <th className="text-left py-1 pr-2 font-medium">Shoulder</th>
                            <th className="text-left py-1 pr-2 font-medium">Sleeve</th>
                            <th className="text-left py-1 pr-2 font-medium">Length</th>
                            <th className="text-left py-1 font-medium">Neck</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(style.standards).map(([size, values]) => (
                            <tr key={size} className="border-b border-gray-800/50">
                              <td className="py-1 pr-2 text-white font-medium">{size}</td>
                              <td className="py-1 pr-2">{values.chest}</td>
                              <td className="py-1 pr-2">{values.shoulder}</td>
                              <td className="py-1 pr-2">{values.sleeve}</td>
                              <td className="py-1 pr-2">{values.length}</td>
                              <td className="py-1">{values.neck}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-[9px] text-gray-600 mt-1.5">All values in cm (finished garment)</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
