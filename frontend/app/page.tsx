"use client";

import { useState, useCallback, useEffect } from "react";
import { ToastProvider, useToast } from "./components/Toast";
import CalibrationForm from "./components/CalibrationForm";
import ImageUpload from "./components/ImageUpload";
import WebcamCapture from "./components/WebcamCapture";
import MeasurementDisplay from "./components/MeasurementDisplay";
import SkeletonOverlay from "./components/SkeletonOverlay";
import RealtimeMeasurements from "./components/RealtimeMeasurements";
import StyleSelector from "./components/StyleSelector";
import dynamic from "next/dynamic";
const GarmentPreview3D = dynamic(() => import("./components/GarmentPreview3D"), {
  ssr: false,
  loading: () => <div className="bg-gray-800 rounded-2xl h-[320px] flex items-center justify-center"><p className="text-gray-500 text-sm">Loading 3D view...</p></div>,
});
import HeroSection from "./components/HeroSection";
import VirtualTryOn from "./components/VirtualTryOn";
import {
  measureImage,
  checkHealth,
  checkOllamaStatus,
  saveProfile,
  fetchDemoResult,
} from "./lib/api";
import type { MeasurementResponse, FrameResponse, OllamaStatus } from "./lib/types";

type Mode = "upload" | "webcam";

function AppContent() {
  const { showToast } = useToast();
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
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [showHero, setShowHero] = useState(true);

  useEffect(() => {
    checkHealth().then(setBackendOnline);
    checkOllamaStatus().then(setOllamaStatus);
  }, []);

  useEffect(() => { setSelectedStyle(null); }, [gender]);

  const handleCalibrate = useCallback((h: number, g: string) => {
    setHeightCm(h);
    setGender(g);
    setResult(null);
    setError(null);
    setShowHero(false);
  }, []);

  const processImage = useCallback(
    async (file: File | Blob) => {
      if (!heightCm) return;
      setLoading(true);
      setError(null);
      try {
        const data = await measureImage(file as File, heightCm, gender, useOllama, selectedStyle || undefined);
        setResult(data);
        setShowHero(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to process image";
        setError(msg);
        showToast(msg, "error");
      }
      setLoading(false);
    },
    [heightCm, gender, useOllama, selectedStyle, showToast]
  );

  const handleRealtimeMeasurement = useCallback((data: FrameResponse) => {
    setRealtimeData(data);
  }, []);

  const handleWebcamCapture = useCallback(
    (blob: Blob) => { processImage(blob); },
    [processImage]
  );

  const handleSaveProfile = useCallback(async () => {
    if (!result || !heightCm) return;
    const name = prompt("Enter a name for this profile:");
    if (!name) return;
    try {
      await saveProfile({
        name, height_cm: heightCm, gender,
        measurements: result.measurements as unknown as Record<string, unknown>,
        recommended_size: result.recommended_size,
      });
      showToast(`Profile "${name}" saved!`, "success");
    } catch {
      showToast("Failed to save profile", "error");
    }
  }, [result, heightCm, gender, showToast]);

  const handleTryDemo = useCallback(async (persona: string) => {
    setLoading(true);
    setShowHero(false);
    setDemoMode(true);
    const g = persona.startsWith("female") ? "female" : "male";
    const h = persona.includes("165") ? 165 : 175;
    setGender(g);
    setHeightCm(h);
    setSelectedStyle(g === "female" ? "classic_blouse" : "regular_fit_shirt");
    try {
      const data = await fetchDemoResult(persona, g === "female" ? "classic_blouse" : "regular_fit_shirt");
      setResult(data as MeasurementResponse);
    } catch {
      showToast("Could not load demo", "error");
    }
    setLoading(false);
  }, [showToast]);

  const exitDemo = useCallback(() => {
    setDemoMode(false);
    setResult(null);
    setShowHero(true);
    setHeightCm(null);
    setSelectedStyle(null);
  }, []);

  const isCalibrated = heightCm !== null;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">StitchVision AI</h1>
              <p className="text-[10px] text-gray-500">AI-Powered Custom Stitching</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${backendOnline === null ? "bg-gray-500" : backendOnline ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-gray-400">API {backendOnline ? "Online" : backendOnline === null ? "..." : "Offline"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${ollamaStatus?.status === "connected" ? "bg-green-500" : "bg-gray-500"}`} />
              <span className="text-gray-400">Ollama {ollamaStatus?.status === "connected" ? "On" : "Off"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Backend offline warning */}
        {backendOnline === false && !demoMode && (
          <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-sm text-red-300">
            Backend offline. Start: <code className="bg-red-900/50 px-1.5 py-0.5 rounded text-red-200 text-xs">cd backend &amp;&amp; source venv/bin/activate &amp;&amp; uvicorn app.main:app --reload --port 8002</code>
          </div>
        )}

        {/* Demo banner */}
        {demoMode && (
          <div className="mb-4 bg-blue-900/20 border border-blue-700/30 rounded-xl p-3 flex items-center justify-between">
            <p className="text-sm text-blue-300">Demo Mode &mdash; showing sample data. Upload your own photo for real measurements.</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={exitDemo} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition">
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        {showHero && !result && !loading && (
          <HeroSection onTryDemo={handleTryDemo} onGetStarted={() => setShowHero(false)} />
        )}

        {/* Main Grid (shown when hero is hidden or results exist) */}
        {(!showHero || result || loading) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel */}
            <div className="lg:col-span-3 space-y-5">
              <div className="relative">
                <div className="absolute -left-3 top-0 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</div>
                <CalibrationForm onCalibrate={handleCalibrate} />
              </div>

              {isCalibrated && (
                <div className="relative">
                  <div className="absolute -left-3 top-0 bg-violet-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">S</div>
                  <StyleSelector gender={gender} selectedStyle={selectedStyle} onStyleSelect={setSelectedStyle} />
                </div>
              )}

              {ollamaStatus?.status === "connected" && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">AI Refinement</p>
                      <p className="text-xs text-gray-500">Use Ollama to improve accuracy</p>
                    </div>
                    <button type="button" role="switch" aria-checked={useOllama} onClick={() => setUseOllama(!useOllama)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${useOllama ? "bg-blue-600" : "bg-gray-600"}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${useOllama ? "translate-x-5 ml-0.5" : "translate-x-0 ml-0.5"}`} />
                    </button>
                  </div>
                </div>
              )}

              {isCalibrated && (
                <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-3 text-sm text-green-300">
                  <p>Calibrated: {heightCm} cm, {gender}</p>
                  {selectedStyle && <p className="text-blue-400 mt-1">Style: {selectedStyle.replace(/_/g, " ")}</p>}
                  {demoMode && <p className="text-yellow-400 mt-1 text-xs">Demo mode</p>}
                </div>
              )}
            </div>

            {/* Center Panel */}
            <div className="lg:col-span-5 space-y-5">
              {!demoMode && (
                <div className="relative">
                  <div className="absolute -left-3 top-0 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
                  <div className="bg-gray-800 rounded-2xl p-4">
                    <div className="flex gap-2 mb-4">
                      <button onClick={() => setMode("upload")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${mode === "upload" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
                        Upload Image
                      </button>
                      <button onClick={() => setMode("webcam")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${mode === "webcam" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
                        Webcam
                      </button>
                    </div>

                    {mode === "upload" ? (
                      <div className="space-y-4">
                        <ImageUpload onImageSelected={processImage} onPreviewReady={setUploadedImageUrl} disabled={!isCalibrated || loading} />
                        {!isCalibrated && <p className="text-xs text-yellow-400 text-center">Complete calibration first (Step 1)</p>}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isCalibrated ? (
                          <WebcamCapture heightCm={heightCm} gender={gender} onMeasurement={handleRealtimeMeasurement} onCapture={handleWebcamCapture} />
                        ) : (
                          <div className="bg-black rounded-2xl aspect-[4/3] flex items-center justify-center">
                            <p className="text-yellow-400 text-sm">Complete calibration first (Step 1)</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mode === "webcam" && isCalibrated && !demoMode && <RealtimeMeasurements data={realtimeData} />}

              {/* Virtual Try-On */}
              {result && !loading && (
                <VirtualTryOn
                  imageUrl={demoMode ? null : uploadedImageUrl}
                  landmarks={result.landmarks}
                  measurements={result.measurements}
                  style={result.style || null}
                  gender={gender}
                  isDemoMode={demoMode}
                />
              )}

              {/* Garment flat illustration */}
              {result && !loading && (
                <GarmentPreview3D measurements={result.measurements} style={result.style || null} gender={gender} />
              )}
            </div>

            {/* Right Panel */}
            <div className="lg:col-span-4 space-y-5">
              <div className="relative">
                <div className="absolute -left-3 top-0 bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>

                {loading && (
                  <div className="bg-gray-800 rounded-2xl p-12 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Analyzing body measurements...</p>
                  </div>
                )}

                {error && !loading && (
                  <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6 text-center">
                    <p className="text-red-300 text-sm">{error}</p>
                    <button onClick={() => setError(null)} className="mt-3 text-xs text-gray-400 hover:text-white transition">Dismiss</button>
                  </div>
                )}

                {result && !loading && <MeasurementDisplay data={result} onSaveProfile={handleSaveProfile} />}

                {!result && !loading && !error && (
                  <div className="bg-gray-800 rounded-2xl p-8 text-center">
                    <p className="text-4xl mb-3 opacity-30">&#128455;</p>
                    <p className="text-gray-500 text-sm">Your measurements will appear here</p>
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
                    {!demoMode && (
                      <button onClick={() => handleTryDemo("male_175")}
                        className="mt-4 text-xs text-blue-400 hover:text-blue-300 transition">
                        or try a quick demo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-gray-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Accuracy Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
            <div className="flex gap-2">
              <span className="text-yellow-500 text-base shrink-0">!</span>
              <p><span className="text-gray-400 font-medium">Loose clothing</span> can cause inaccurate chest/waist. Wear fitted clothes.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-500 text-base shrink-0">!</span>
              <p><span className="text-gray-400 font-medium">Camera angle</span> matters. Camera at waist height, 2-3m away.</p>
            </div>
            <div className="flex gap-2">
              <span className="text-yellow-500 text-base shrink-0">!</span>
              <p><span className="text-gray-400 font-medium">Lighting</span> affects detection. Use even, front-facing light.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
