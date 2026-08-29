import React, { useState, useEffect } from 'react';

export const DEFAULT_STORY_TODAY_LOGO = '/logo.svg';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon-only' | 'badge' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'header' | 'splash';
  showDomain?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'emerald';
  lang?: 'en' | 'hi';
  customSrc?: string;
}

export const StoryTodayLogo: React.FC<LogoProps> = ({
  variant = 'icon-only',
  size = 'header',
  showDomain = false,
  className = '',
  theme = 'emerald',
  lang = 'en',
  customSrc,
}) => {
  const getInitialLogo = () => {
    if (customSrc) return customSrc;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('story_today_custom_logo');
      if (stored && stored.trim() !== '') return stored;
    }
    return DEFAULT_STORY_TODAY_LOGO;
  };

  const [imageSrc, setImageSrc] = useState<string>(getInitialLogo);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    const updateLogo = () => {
      const storedLogo = localStorage.getItem('story_today_custom_logo');
      if (customSrc) {
        setImageSrc(customSrc);
        setImageError(false);
      } else if (storedLogo && storedLogo.trim() !== '') {
        setImageSrc(storedLogo);
        setImageError(false);
      } else {
        setImageSrc(DEFAULT_STORY_TODAY_LOGO);
        setImageError(false);
      }
    };

    updateLogo();
    window.addEventListener('storage', updateLogo);
    return () => window.removeEventListener('storage', updateLogo);
  }, [customSrc]);

  // Dimension mappings for the icon emblem (Big and Bold)
  const iconSizeMap = {
    sm: 'w-12 h-12 min-w-[48px]',
    md: 'w-16 h-16 sm:w-20 sm:h-20 min-w-[64px] sm:min-w-[80px]',
    header: 'w-16 h-16 sm:w-20 sm:h-20 min-w-[64px] sm:min-w-[80px]',
    lg: 'w-24 h-24 sm:w-28 sm:h-28 min-w-[96px] sm:min-w-[112px]',
    xl: 'w-32 h-32 sm:w-40 sm:h-40 min-w-[128px] sm:min-w-[160px]',
    '2xl': 'w-40 h-40 sm:w-48 sm:h-48 min-w-[160px] sm:min-w-[192px]',
    splash: 'w-36 h-36 sm:w-48 sm:h-48 min-w-[144px] sm:min-w-[192px]',
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      id="story-today-official-logo"
    >
      {/* Official story-today.in Logo Emblem (Permanent Default Logo or Custom Uploaded Branding) */}
      <div
        className={`relative flex-shrink-0 ${iconSizeMap[size] || iconSizeMap.header} transition-transform duration-300 group-hover:scale-105 flex items-center justify-center drop-shadow-md`}
      >
        {!imageError ? (
          <img
            src={imageSrc}
            alt="Story Today Official Logo"
            className="w-full h-full object-contain rounded-2xl shadow-xl border-2 border-[#004D40]/20 bg-white p-1"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full filter drop-shadow-lg"
            shapeRendering="geometricPrecision"
          >
            <defs>
              <linearGradient id="fallbackBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#004D40" />
                <stop offset="100%" stopColor="#002D25" />
              </linearGradient>
              <linearGradient id="fallbackAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#BE123C" />
              </linearGradient>
            </defs>

            {/* App Icon Background Shield */}
            <rect width="512" height="512" rx="120" fill="url(#fallbackBgGrad)" />
            <rect x="12" y="12" width="488" height="488" rx="108" stroke="#80CBC4" strokeWidth="8" strokeOpacity="0.4" fill="none" />

            {/* Newspaper Sheet Back Shadow */}
            <rect x="90" y="80" width="332" height="352" rx="36" fill="#001F19" />

            {/* Crisp Newspaper Front */}
            <rect x="106" y="92" width="300" height="328" rx="30" fill="#FFFFFF" />

            {/* Bold Masthead Bar (Red Breaking Header) */}
            <rect x="138" y="124" width="236" height="56" rx="14" fill="url(#fallbackAccentGrad)" />
            <text x="256" y="162" fontFamily="'Plus Jakarta Sans', Arial, sans-serif" fontSize="28" fontWeight="900" fill="#FFFFFF" textAnchor="middle" letterSpacing="2">STORY TODAY</text>

            {/* Editorial Headline Bar */}
            <rect x="138" y="208" width="144" height="28" rx="8" fill="#004D40" />
            <circle cx="346" cy="222" r="14" fill="#10B981" />

            {/* News Content Article Lines */}
            <rect x="138" y="258" width="236" height="18" rx="6" fill="#1E293B" />
            <rect x="138" y="292" width="236" height="18" rx="6" fill="#475569" />
            <rect x="138" y="326" width="170" height="18" rx="6" fill="#64748B" />
            <rect x="138" y="360" width="120" height="16" rx="6" fill="#94A3B8" />

            {/* Verified Stamp / Badge */}
            <circle cx="342" cy="352" r="32" fill="#004D40" />
            <path d="M330 352 L338 360 L356 342" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        )}

        {/* Live Broadcast Pulse dot */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 border-2 border-white shadow-md"></span>
        </span>
      </div>
    </div>
  );
};
