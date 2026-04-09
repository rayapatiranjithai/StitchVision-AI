"use client";

import { useState, useCallback, useEffect } from "react";
import CalibrationForm from "./components/CalibrationForm";
import ImageUpload from "./components/ImageUpload";
import WebcamCapture from "./components/WebcamCapture";
import MeasurementDisplay from "./components/MeasurementDisplay";
import SkeletonOverlay from "./components/SkeletonOverlay";
import RealtimeMeasurements from "./components/RealtimeMeasurements";
import StyleSelector from "./components/StyleSelector";
import GarmentPreview3D from "./components/GarmentPreview3D";
import {
  measureImage,
  checkHealth,
  checkOllamaStatus,
  saveProfile,
} from "./lib/api";
import type { MeasurementResponse, FrameResponse, OllamaStatus } from "./lib/types";

type Mode = "upload" | "webcam";

export default function Home() {
  const [mode, setMode] = useState<Mode>("upload");
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [gender, setGender] = useState("male");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [useOllama, setUseOllama] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeasurementResponse | null>(null);
  const [realtimeData, setRealtimeData] = useState<FrameResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    checkHealth().then(setBackendOnline);
    checkOllamaStatus().then(setOllamaStatus);
  }, []);

  // Reset style when gender changes
  useEffect(() => {
    setSelectedStyle(null);
  }, [gender]);

  const handleCalibrate = useCallback((h: number, g: string) => {
    setHeightCm(h);
    setGender(g);
    setResult(null);
    setError(null);
  }, []);

  const processImage = useCallback(
    async (file: File | Blob) => {
      if (!heightCm) return;
      setLoading(true);
      setError(null);
      try {
        const data = await measureImage(
          file as File,
          heightCm,
          gender,
          useOllama,
          selectedStyle || undefined
        );
        setResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to process image");
      }
      setLoading(false);
    },
    [heightCm, gender, useOllama, selectedStyle]
  );

  const handleRealtimeMeasurement = useCallback((data: FrameResponse) => {
    setRealtimeData(data);
  }, []);

  const handleWebcamCapture = useCallback(
    (blob: Blob) => {
      processImage(blob);
    },
    [processImage]
  );

  const handleSaveProfile = useCallback(async () => {
    if (!result || !heightCm) return;
    const name = prompt("Enter a name for this profile:");
    if (!name) return;
    try {
      await saveProfile({
        name,
        height_cm: heightCm,
        gender,
        measurements: result.measurements as unknown as Record<string, unknown>,
        recommended_size: result.recommended_size,
      });
      setSaveMessage(`Profile "${name}" saved!`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage("Failed to save profile");
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }, [result, heightCm, gender]);

  const isCalibrated = heightCm !== null;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Body Measurement AI</h1>
            <p className="text-xs text-gray-500">Shirt stitching calculator</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  backendOnline === null ? "bg-gray-500" : backendOnline ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-gray-400">
                API {backendOnline ? "Online" : backendOnline === null ? "..." : "Offline"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus?.status === "connected" ? "bg-green-500" : "bg-gray-500"
                }`}
              />
              <span className="text-gray-400">
                Ollama {ollamaStatus?.status === "connected" ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {backendOnline === false && (
          <div className="mb-6 bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-sm text-red-300">
            Backend API is not running. Start it with:{" "}
            <code className="bg-red-900/50 px-2 py-0.5 rounded text-red-200">
              cd backend &amp;&amp; source venv/bin/activate &amp;&amp; uvicorn app.main:app --reload --port 8002
            </code>
          </div>
        )}

        {saveMessage && (
          <div className="mb-4 bg-green-900/30 border border-green-700/50 rounded-xl p-3 text-sm text-green-300 text-center">
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Controls + Style */}
          <div className="lg:col-span-3 space-y-5">
            {/* Step 1: Calibration */}
            <div className="relative">
              <div className="absolute -left-3 top-0 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                1
              </div>
              <CalibrationForm onCalibrate={handleCalibrate} />
            </div>

            {/* Step 1.5: Style Selection */}
            {isCalibrated && (
              <div className="relative">
                <div className="absolute -left-3 top-0 bg-violet-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                  S
                </div>
                <StyleSelector
                  gender={gender}
                  selectedStyle={selectedStyle}
                  onStyleSelect={setSelectedStyle}
                />
              </div>
            )}

            {/* Ollama toggle */}
            {ollamaStatus?.status === "connected" && (
              <div className="bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">AI Refinement</p>
                    <p className="text-xs text-gray-500">Use Ollama to improve accuracy</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={useOllama}
                    onClick={() => setUseOllama(!useOllama)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                      useOllama ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                        useOllama ? "translate-x-5 ml-0.5" : "translate-x-0 ml-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Calibration status */}
            {isCalibrated && (
              <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-3 text-sm text-green-300">
                <p>Calibrated: {heightCm} cm, {gender}</p>
                {selectedStyle && (
                  <p className="text-blue-400 mt-1">
                    Style: {selectedStyle.replace(/_/g, " ")}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Center Panel - Image/Camera */}
          <div className="lg:col-span-5 space-y-5">
            <div className="relative">
              <div className="absolute -left-3 top-0 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                2
              </div>
              <div className="bg-gray-800 rounded-2xl p-4">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMode("upload")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      mode === "upload"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Upload Image
                  </button>
                  <button
                    onClick={() => setMode("webcam")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      mode === "webcam"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    Webcam
                  </button>
                </div>

                {mode === "upload" ? (
                  <div className="space-y-4">
                    <ImageUpload
                      onImageSelected={processImage}
                      disabled={!isCalibrated || loading}
                    />
                    {!isCalibrated && (
                      <p className="text-xs text-yellow-400 text-center">
                        Complete calibration first (Step 1)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isCalibrated ? (
                      <WebcamCapture
                        heightCm={heightCm}
                        gender={gender}
                        onMeasurement={handleRealtimeMeasurement}
                        onCapture={handleWebcamCapture}
                      />
                    ) : (
                      <div className="bg-black rounded-2xl aspect-[4/3] flex items-center justify-center">
                        <p className="text-yellow-400 text-sm">Complete calibration first (Step 1)</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {mode === "webcam" && isCalibrated && (
              <RealtimeMeasurements data={realtimeData} />
            )}

            {result?.skeleton_image_base64 && (
              <SkeletonOverlay imageBase64={result.skeleton_image_base64} />
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-4 space-y-5">
            <div className="relative">
              <div className="absolute -left-3 top-0 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                3
              </div>

              {loading && (
                <div className="bg-gray-800 rounded-2xl p-12 flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">Analyzing body measurements...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center">
                  <p className="text-red-300 text-sm">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-xs text-gray-400 hover:text-white transition"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {result && !loading && (
                <MeasurementDisplay data={result} onSaveProfile={handleSaveProfile} />
              )}
            </div>

            {/* 3D Garment Preview */}
            {result && !loading && (
              <GarmentPreview3D
                measurements={result.measurements}
                style={result.style || null}
                gender={gender}
              />
            )}

            {/* This div replaces the closing div below - do not remove */}
            <div className="hidden">

              {!result && !loading && !error && (
                <div className="bg-gray-800 rounded-2xl p-8 text-center">
                  <p className="text-4xl mb-3 opacity-30">&#128455;</p>
                  <p className="text-gray-500 text-sm">
                    Your measurements will appear here
                  </p>
                  <div className="mt-4 text-left text-xs text-gray-600 space-y-1.5">
                    <p>For best results:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Stand straight, facing camera</li>
                      <li>Wear fitted clothing</li>
                      <li>Ensure full body is visible</li>
                      <li>Use good lighting</li>
                      <li>Arms slightly away from body</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gray-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Accuracy Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div className="flex gap-2">
              <span className="text-yellow-500 text-base shrink-0">!</span>
              <p>
                <span className="text-gray-400 font-medium">Loose clothing</span> can cause
                inaccurate chest/waist measurements. Wear form-fitting clothes for best results.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-500 text-base shrink-0">!</span>
              <p>
                <span className="text-gray-400 font-medium">Camera angle</span> matters.
                Position the camera at waist height, 2-3 meters away, facing directly forward.
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-500 text-base shrink-0">!</span>
              <p>
                <span className="text-gray-400 font-medium">Lighting</span> affects detection.
                Use even, front-facing light and avoid strong backlighting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
