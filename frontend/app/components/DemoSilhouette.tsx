"use client";

interface DemoSilhouetteProps {
  gender: string;
  className?: string;
}

export default function DemoSilhouette({ gender, className }: DemoSilhouetteProps) {
  const isFemale = gender === "female";

  return (
    <svg
      viewBox="0 0 400 500"
      className={className || "w-full h-full"}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="silGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <radialGradient id="silBg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>

      <rect width="400" height="500" fill="url(#silBg)" />

      {/* Head */}
      <ellipse cx="200" cy="42" rx="22" ry="28" fill="#4b5563" />

      {/* Neck */}
      <rect x="192" y="68" width="16" height="18" fill="#4b5563" rx="3" />

      {/* Torso */}
      {isFemale ? (
        <path
          d={`M 155 86 C 148 86, 140 102, 138 125 C 136 145, 144 158, 150 168
              C 143 180, 138 195, 139 218 C 140 240, 143 268, 147 300
              L 253 300
              C 257 268, 260 240, 261 218 C 262 195, 257 180, 250 168
              C 256 158, 264 145, 262 125 C 260 102, 252 86, 245 86 Z`}
          fill="url(#silGrad)"
        />
      ) : (
        <path
          d={`M 150 86 C 142 86, 135 105, 133 130 C 131 155, 135 180, 138 208
              C 140 235, 141 268, 143 300
              L 257 300
              C 259 268, 260 235, 262 208 C 265 180, 269 155, 267 130
              C 265 105, 258 86, 250 86 Z`}
          fill="url(#silGrad)"
        />
      )}

      {/* Left arm */}
      <path
        d="M 150 90 C 133 97, 115 150, 107 210 C 100 255, 98 295, 102 325"
        fill="none" stroke="#4b5563" strokeWidth="18" strokeLinecap="round"
      />

      {/* Right arm */}
      <path
        d="M 250 90 C 267 97, 285 150, 293 210 C 300 255, 302 295, 298 325"
        fill="none" stroke="#4b5563" strokeWidth="18" strokeLinecap="round"
      />

      {/* Left leg */}
      <path
        d="M 172 300 C 170 340, 167 380, 165 420 C 164 445, 162 465, 160 485"
        fill="none" stroke="#4b5563" strokeWidth="24" strokeLinecap="round"
      />

      {/* Right leg */}
      <path
        d="M 228 300 C 230 340, 233 380, 235 420 C 236 445, 238 465, 240 485"
        fill="none" stroke="#4b5563" strokeWidth="24" strokeLinecap="round"
      />

      {/* Subtle measurement guide lines */}
      <g opacity="0.06" stroke="#fff" strokeWidth="0.5" strokeDasharray="6,6">
        <line x1="0" y1="110" x2="400" y2="110" />
        <line x1="0" y1="200" x2="400" y2="200" />
        <line x1="0" y1="265" x2="400" y2="265" />
        <line x1="200" y1="0" x2="200" y2="500" />
      </g>

      {/* "Stand here" text */}
      <text x="200" y="490" textAnchor="middle" fill="#374151" fontSize="10" fontFamily="system-ui">
        Demo Silhouette
      </text>
    </svg>
  );
}
