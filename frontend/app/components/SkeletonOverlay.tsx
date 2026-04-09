"use client";

interface SkeletonOverlayProps {
  imageBase64: string;
}

export default function SkeletonOverlay({ imageBase64 }: SkeletonOverlayProps) {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
      <h3 className="text-lg font-medium text-white">Skeleton Overlay</h3>
      <div className="rounded-xl overflow-hidden bg-black">
        <img
          src={`data:image/jpeg;base64,${imageBase64}`}
          alt="Body with skeleton overlay"
          className="w-full h-auto"
        />
      </div>
      <p className="text-xs text-gray-500">
        Lines show detected measurement points. Colors: green=shoulders, orange=arms,
        cyan=torso, magenta=waist, yellow=neck, red=chest
      </p>
    </div>
  );
}
