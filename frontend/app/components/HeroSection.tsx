"use client";

interface HeroSectionProps {
  onTryDemo: (persona: string) => void;
  onGetStarted: () => void;
}

export default function HeroSection({ onTryDemo, onGetStarted }: HeroSectionProps) {
  return (
    <div className="mb-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700/50">
      <div className="px-8 py-12 text-center">
        {/* Logo/Title */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">StitchVision AI</h1>
        </div>

        <p className="text-lg text-gray-300 max-w-xl mx-auto mb-8">
          Upload a photo. Get body measurements. Try on shirts &mdash; instantly.
        </p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="10" y1="16" x2="8" y2="22" />
                <line x1="14" y1="16" x2="16" y2="22" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">AI Pose Detection</p>
            <p className="text-xs text-gray-400 mt-1">33 body landmarks detected</p>
          </div>

          <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
            <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">12 Stitching Styles</p>
            <p className="text-xs text-gray-400 mt-1">Slim fit to kurta</p>
          </div>

          <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/30">
            <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">Virtual Try-On</p>
            <p className="text-xs text-gray-400 mt-1">See the shirt on your body</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => onTryDemo("male_175")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition text-sm"
          >
            Try Demo (Male)
          </button>
          <button
            onClick={() => onTryDemo("female_165")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition text-sm"
          >
            Try Demo (Female)
          </button>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition text-sm border border-gray-600"
          >
            Upload Your Photo
          </button>
        </div>
      </div>
    </div>
  );
}
