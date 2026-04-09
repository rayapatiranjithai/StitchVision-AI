"use client";

import { useState } from "react";

interface CalibrationFormProps {
  onCalibrate: (heightCm: number, gender: string) => void;
}

export default function CalibrationForm({ onCalibrate }: CalibrationFormProps) {
  const [height, setHeight] = useState("");
  const [unit, setUnit] = useState<"cm" | "ft">("cm");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [gender, setGender] = useState("male");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let heightCm: number;
    if (unit === "cm") {
      heightCm = parseFloat(height);
    } else {
      heightCm = (parseFloat(feet) * 12 + parseFloat(inches || "0")) * 2.54;
    }
    if (isNaN(heightCm) || heightCm < 100 || heightCm > 250) {
      alert("Please enter a valid height (100-250 cm)");
      return;
    }
    onCalibrate(heightCm, gender);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 space-y-5">
      <h2 className="text-xl font-semibold text-white">Calibration</h2>
      <p className="text-gray-400 text-sm">
        Stand straight facing the camera. Provide your height for accurate scaling.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Height</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setUnit("cm")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              unit === "cm"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            cm
          </button>
          <button
            type="button"
            onClick={() => setUnit("ft")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              unit === "ft"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            ft/in
          </button>
        </div>

        {unit === "cm" ? (
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g. 175"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            min={100}
            max={250}
            required
          />
        ) : (
          <div className="flex gap-2">
            <input
              type="number"
              value={feet}
              onChange={(e) => setFeet(e.target.value)}
              placeholder="Feet"
              className="w-1/2 bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              min={3}
              max={8}
              required
            />
            <input
              type="number"
              value={inches}
              onChange={(e) => setInches(e.target.value)}
              placeholder="Inches"
              className="w-1/2 bg-gray-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              min={0}
              max={11}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Gender (for proportions)</label>
        <div className="flex gap-2">
          {["male", "female"].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium capitalize transition ${
                gender === g
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
      >
        Set Calibration
      </button>
    </form>
  );
}
