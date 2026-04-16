"use client";

interface DemoSilhouetteProps {
  gender: string;
  className?: string;
}

export default function DemoSilhouette({ gender, className }: DemoSilhouetteProps) {
  const isFemale = gender === "female";

  return (
    <svg
      viewBox="0 0 400 700"
      className={className || "w-full h-full"}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="silGrad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        <radialGradient id="silHead" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#374151" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="400" height="700" fill="#111827" />

      {/* Head */}
      <ellipse cx="200" cy="58" rx="28" ry="34" fill="url(#silHead)" />

      {/* Neck */}
      <rect x="190" y="90" width="20" height="22" fill="#374151" rx="4" />

      {/* Torso */}
      {isFemale ? (
        <path
          d={`M 152 112
            C 145 112, 138 130, 136 155
            C 134 175, 142 190, 148 200
            C 140 215, 135 230, 136 255
            C 137 280, 140 320, 145 370
            L 255 370
            C 260 320, 263 280, 264 255
            C 265 230, 260 215, 252 200
            C 258 190, 266 175, 264 155
            C 262 130, 255 112, 248 112
            Z`}
          fill="url(#silGrad)"
        />
      ) : (
        <path
          d={`M 148 112
            C 140 112, 132 130, 130 160
            C 128 185, 132 210, 135 240
            C 137 270, 138 310, 140 370
            L 260 370
            C 262 310, 263 270, 265 240
            C 268 210, 272 185, 270 160
            C 268 130, 260 112, 252 112
            Z`}
          fill="url(#silGrad)"
        />
      )}

      {/* Left arm */}
      <path
        d={`M 148 118
          C 130 125, 110 180, 100 250
          C 92 300, 90 350, 95 385`}
        fill="none" stroke="#374151" strokeWidth="22" strokeLinecap="round"
      />

      {/* Right arm */}
      <path
        d={`M 252 118
          C 270 125, 290 180, 300 250
          C 308 300, 310 350, 305 385`}
        fill="none" stroke="#374151" strokeWidth="22" strokeLinecap="round"
      />

      {/* Left leg */}
      <path
        d={`M 170 370
          C 168 420, 165 480, 163 540
          C 162 580, 160 620, 158 655`}
        fill="none" stroke="#374151" strokeWidth="28" strokeLinecap="round"
      />

      {/* Right leg */}
      <path
        d={`M 230 370
          C 232 420, 235 480, 237 540
          C 238 580, 240 620, 242 655`}
        fill="none" stroke="#374151" strokeWidth="28" strokeLinecap="round"
      />

      {/* Subtle grid lines for reference */}
      <line x1="0" y1="155" x2="400" y2="155" stroke="#ffffff" strokeWidth="0.3" opacity="0.08" strokeDasharray="8,8" />
      <line x1="0" y1="260" x2="400" y2="260" stroke="#ffffff" strokeWidth="0.3" opacity="0.08" strokeDasharray="8,8" />
      <line x1="0" y1="370" x2="400" y2="370" stroke="#ffffff" strokeWidth="0.3" opacity="0.08" strokeDasharray="8,8" />
      <line x1="200" y1="0" x2="200" y2="700" stroke="#ffffff" strokeWidth="0.3" opacity="0.05" strokeDasharray="8,8" />
    </svg>
  );
}
