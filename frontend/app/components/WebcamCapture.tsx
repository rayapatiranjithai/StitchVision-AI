"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { measureFrame } from "../lib/api";
import { useToast } from "./Toast";
import type { FrameResponse, LandmarkPoint } from "../lib/types";

interface WebcamCaptureProps {
  heightCm: number;
  gender: string;
  onMeasurement: (data: FrameResponse) => void;
  onCapture: (blob: Blob) => void;
}

const SKELETON_CONNECTIONS: [string, string][] = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

export default function WebcamCapture({
  heightCm,
  gender,
  onMeasurement,
  onCapture,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { showToast } = useToast();
  const [streaming, setStreaming] = useState(false);
  const [landmarks, setLandmarks] = useState<Record<string, LandmarkPoint> | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      showToast("Could not access camera. Please check permissions.", "error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreaming(false);
    setRealtimeActive(false);
    setLandmarks(null);
  }, []);

  // Use refs for values needed in setInterval to avoid stale closures
  const heightRef = useRef(heightCm);
  const genderRef = useRef(gender);
  const onMeasurementRef = useRef(onMeasurement);

  useEffect(() => { heightRef.current = heightCm; }, [heightCm]);
  useEffect(() => { genderRef.current = gender; }, [gender]);
  useEffect(() => { onMeasurementRef.current = onMeasurement; }, [onMeasurement]);

  const captureAndProcess = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        processingRef.current = true;
        try {
          const result = await measureFrame(blob, heightRef.current, genderRef.current);
          if (result?.detected) {
            setLandmarks(result.landmarks);
            onMeasurementRef.current(result);
          } else {
            setLandmarks(null);
          }
        } catch {
          // Silently continue on frame errors
        }
        processingRef.current = false;
      },
      "image/jpeg",
      0.8
    );
  }, []);

  const startRealtime = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRealtimeActive(true);
    intervalRef.current = setInterval(captureAndProcess, 500);
  }, [captureAndProcess]);

  const stopRealtime = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRealtimeActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const renderSkeleton = () => {
    if (!landmarks || !videoRef.current) return null;
    const vw = videoRef.current.videoWidth || 640;
    const vh = videoRef.current.videoHeight || 480;

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {SKELETON_CONNECTIONS.map(([a, b], i) => {
          const pa = landmarks[a];
          const pb = landmarks[b];
          if (!pa || !pb || pa.visibility < 0.5 || pb.visibility < 0.5) return null;
          return (
            <line
              key={i}
              x1={pa.x * vw}
              y1={pa.y * vh}
              x2={pb.x * vw}
              y2={pb.y * vh}
              stroke="#00ff88"
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        {Object.entries(landmarks).map(([name, pt]) => {
          if (pt.visibility < 0.5) return null;
          return (
            <circle
              key={name}
              cx={pt.x * vw}
              cy={pt.y * vh}
              r="5"
              fill="#ff4444"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {streaming && renderSkeleton()}
        {!streaming && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Camera off
          </div>
        )}
        {realtimeActive && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            LIVE
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2 flex-wrap">
        {!streaming ? (
          <button
            onClick={startCamera}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition"
          >
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={capturePhoto}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition"
            >
              Capture Photo
            </button>
            {!realtimeActive ? (
              <button
                onClick={startRealtime}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition"
              >
                Real-time Mode
              </button>
            ) : (
              <button
                onClick={stopRealtime}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2.5 rounded-lg transition"
              >
                Stop Real-time
              </button>
            )}
            <button
              onClick={stopCamera}
              className="px-4 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
