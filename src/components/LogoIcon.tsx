import React, { useState } from 'react';

interface LogoIconProps {
  className?: string;
  size?: number;
  withText?: boolean;
  textSize?: string;
}

export default function LogoIcon({ 
  className = '', 
  size = 40, 
  withText = false,
  textSize = "text-base"
}: LogoIconProps) {
  // We use standard React state to capture onerror and fallback to SVG gracefully
  const [useFallback, setUseFallback] = useState(false);

  // If the PNG version is available in the public folder, we render it directly
  if (!useFallback) {
    if (withText) {
      return (
        <div className={`flex flex-col items-center justify-center text-center ${className}`}>
          {/* Pristine wrapper with soft shadow matching the mockup theme */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 shadow-sm">
            <img 
              src="/logo.png" 
              alt="Your Prompt Logo"
              onError={() => setUseFallback(true)} 
              style={{ width: size, height: size }}
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      );
    }
    return (
      <img 
        src="/logo.png" 
        alt="Your Prompt Logo"
        onError={() => setUseFallback(true)} 
        style={{ width: size, height: size }}
        className={`object-contain transition-transform duration-300 hover:scale-105 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Exact 100% High-Fidelity SVG Graphic representation of the beautiful design
  const svgGraphic = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 120" 
      fill="none" 
      className="w-full h-full select-none"
    >
      <defs>
        {/* Soft Drop Shadow under the entire folder book */}
        <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#312e81" floodOpacity="0.12" />
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#312e81" floodOpacity="0.06" />
        </filter>

        {/* Purple / Blue Jacket Cover Gradient */}
        <linearGradient id="folderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />    {/* light purple */}
          <stop offset="40%" stopColor="#8b5cf6" />    {/* middle violet */}
          <stop offset="100%" stopColor="#6366f1" />   {/* blue indigo */}
        </linearGradient>

        {/* 3D Spine Curl Inner Shadow / Gradient */}
        <linearGradient id="spineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="30%" stopColor="#6366f1" />
          <stop offset="70%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>

        {/* Sparkle Violet-to-Pink Icon Gradient */}
        <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>

        {/* Dark Purple Ribbon Bookmark Gradient */}
        <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>

        {/* Sharing circle badge gradient */}
        <linearGradient id="shareBadgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>

      <g filter="url(#softShadow)">
        {/* Underlayer Back Cover (wraps behind the pages) */}
        <rect x="26" y="24" width="64" height="74" rx="14" fill="#6366f1" opacity="0.3" />

        {/* The White Book Pages Block (showing depth of the pages) */}
        {/* Solid white body that peeks out of the top and right */}
        <path 
          d="M34 22 C34 20, 36 18, 39 18 L88 18 C92 18, 95 21, 95 25 L95 86 C95 90, 92 93, 88 93 L34 93 Z" 
          fill="#ffffff" 
          stroke="#e2e8f0" 
          strokeWidth="1"
        />

        {/* 3D Page borders lines on the right side of the book block */}
        <line x1="91" y1="24" x2="91" y2="88" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="93" y1="26" x2="93" y2="86" stroke="#e2e8f0" strokeWidth="1" />

        {/* White user-prompt code document sliding out of the folder from top */}
        <g id="sliding-document">
          {/* Main White Paper */}
          <rect x="36" y="11" width="53" height="66" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
          <rect x="36" y="11" width="53" height="66" rx="10" fill="#f8fafc" opacity="0.5" />
          
          {/* Programming CLI Prompt ">_" in violet */}
          <path d="M43 21.5 L47.5 24 L43 26.5" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="51.5" y1="26.5" x2="58" y2="26.5" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />

          {/* Three purple content line bars */}
          <line x1="43" y1="34" x2="65" y2="34" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <line x1="43" y1="41" x2="77" y2="41" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="43" y1="48" x2="71" y2="48" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Connected Sharing Circular Badge on the top-right of the sliding sheet */}
          <circle cx="85" cy="19" r="11" fill="url(#shareBadgeGradient)" stroke="#ffffff" strokeWidth="1.5" />
          
          {/* Share icon graphics inside circular badge */}
          <circle cx="81.5" cy="19" r="2" fill="#ffffff" />
          <circle cx="87.5" cy="15" r="2" fill="#ffffff" />
          <circle cx="87.5" cy="23" r="2" fill="#ffffff" />
          <line x1="83" y1="18" x2="86" y2="16" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="83" y1="20" x2="86" y2="22" stroke="#ffffff" strokeWidth="1.2" />
        </g>

        {/* 3D Folding Spine Curl on the Left Jacket Wrap (Beautiful 3D cylinder overlap) */}
        <path 
          d="M26 22 L32 22 C32 22, 24 22, 24 34 L24 82 C24 94, 32 94, 32 94 L26 94" 
          stroke="url(#spineGradient)" 
          strokeWidth="3" 
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Main front folder cover in rich purple-indigo gradient */}
        <rect x="29" y="22" width="67" height="72" rx="16" fill="url(#folderGradient)" />

        {/* LEFT JACKET SPINE OVERLAP (Gives it the 100% 3D folder wrapping look) */}
        {/* This creates the realistic rounded left spine fold cover */}
        <path 
          d="M34 22 H29 C24 22, 20 26, 20 32 L20 84 C20 90, 24 94, 29 94 H34 C38 94, 40 91, 40 88 L40 28 C40 25, 38 22, 34 22 Z" 
          fill="url(#folderGradient)" 
        />

        {/* Soft edge highlights on the fold */}
        <path 
          d="M20 32 L20 84" 
          stroke="#f3e8ff" 
          strokeWidth="1" 
          opacity="0.3" 
          strokeLinecap="round" 
        />

        {/* Floating Bookmark Ribbon Hanging down from the bottom of book/folder */}
        <path 
          d="M60 88 L60 102.5 L64.5 98.5 L69 102.5 L69 88 Z" 
          fill="url(#ribbonGradient)" 
          stroke="#7c3aed"
          strokeWidth="0.5"
          filter="drop-shadow(0px 1px 1.5px rgba(0,0,0,0.15))"
        />

        {/* Large Rounded White Chat/Comment Bubble in the center of the folder cover */}
        <path 
          d="M36 44 C36 40.5, 39 37.5, 42.5 37.5 L73.5 37.5 C77 37.5, 80 40.5, 80 44 L80 63.5 C80 67, 77 70, 73.5 70 L50 70 L42.5 76 L42.5 70 C39 70, 36 67, 36 63.5 Z" 
          fill="#ffffff" 
          stroke="#f1f5f9"
          strokeWidth="0.5"
        />

        {/* High-Contrast Beautiful 4-Point Sparkle Star inside center of speech bubble */}
        <path 
          d="M58 43 C58 49.5, 53.5 53.8, 47 54 C53.5 54.2, 58 58.5, 58 65 C58 58.5, 62.5 54.2, 69 54 C62.5 53.8, 58 49.5, 58 43 Z" 
          fill="url(#sparkleGradient)" 
        />
        
        {/* Small accent sparkle 1 (top right inside bubble) */}
        <path 
          d="M71 45.5 C71 47.5, 69.5 48.8, 67.5 49 C69.5 49.2, 71 50.5, 71 52.5 C71 50.5, 72.5 49.2, 74.5 49 C72.5 48.8, 71 47.5, 71 45.5 Z" 
          fill="url(#sparkleGradient)" 
        />

        {/* Small accent sparkle 2 (bottom right inside bubble) */}
        <path 
          d="M71 61.5 C71 63.5, 69.5 64.8, 67.5 65 C69.5 65.2, 71 66.5, 71 68.5 C71 66.5, 72.5 65.2, 74.5 65 C72.5 64.8, 71 63.5, 71 61.5 Z" 
          fill="url(#sparkleGradient)" 
        />
      </g>
    </svg>
  );

  if (withText) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        {/* Render pristine 3D Graphic */}
        <div style={{ width: size, height: size }} className="transition-transform duration-350 hover:scale-105">
          {svgGraphic}
        </div>
        
        {/* Exact typography representation with proper spacing */}
        <div className="mt-4 flex flex-col items-center">
          <div className="flex items-center justify-center gap-1.5 font-black tracking-tight select-none">
            <span className="text-[#131024] font-extrabold outfit" style={{ fontSize: '1.45rem', letterSpacing: '-0.025em' }}>
              Your
            </span>
            <span className="text-[#7c3aed] font-extrabold outfit" style={{ fontSize: '1.45rem', letterSpacing: '-0.025em' }}>
              Prompt
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise return only the requested size container of the 3D logo graphic
  return (
    <div 
      style={{ width: size, height: size }} 
      className={`inline-block select-none ${className}`}
    >
      {svgGraphic}
    </div>
  );
}
