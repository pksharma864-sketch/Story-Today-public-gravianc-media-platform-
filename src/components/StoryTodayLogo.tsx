import React, { useState, useEffect } from 'react';

export const DEFAULT_STORY_TODAY_LOGO = '/logo.svg';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon-only' | 'badge' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'header' | 'splash';
  showDomain?: boolean;
  className?: string;
  theme?: 'light' | 'dark' | 'emerald' | 'adaptive';
  lang?: 'en' | 'hi';
  customSrc?: string;
}

export const StoryTodayLogo: React.FC<LogoProps> = ({
  size = 'header',
  className = '',
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

  // Sync with localStorage changes or props
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

  // Dimension mappings for the logo - large, prominent, completely transparent
  const sizeMap = {
    sm: 'h-7 sm:h-8 w-auto',
    md: 'h-10 sm:h-12 w-auto',
    header: 'h-10 sm:h-12 md:h-14 w-auto min-w-[140px] sm:min-w-[170px] md:min-w-[210px]',
    lg: 'h-14 sm:h-16 w-auto',
    xl: 'h-18 sm:h-22 w-auto',
    '2xl': 'h-24 sm:h-28 w-auto',
    splash: 'h-16 sm:h-20 w-auto',
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none bg-transparent p-0 m-0 border-0 ${className}`}
      id="story-today-official-logo"
    >
      {/* 100% Fully Transparent - NO background box, NO container, NO shape behind it */}
      <div
        className={`relative flex-shrink-0 ${sizeMap[size] || sizeMap.header} transition-transform duration-300 group-hover:scale-105 flex items-center justify-start bg-transparent`}
      >
        {!imageError ? (
          <img
            src={imageSrc}
            alt="Story Today Official Logo"
            className="h-full w-auto object-contain bg-transparent filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 560 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-auto bg-transparent filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            shapeRendering="geometricPrecision"
          >
            <defs>
              <linearGradient id="fbRedRuby" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="50%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#BE123C" />
              </linearGradient>
              <linearGradient id="fbTealEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00695C" />
                <stop offset="50%" stopColor="#004D40" />
                <stop offset="100%" stopColor="#002D25" />
              </linearGradient>
              <linearGradient id="fbGoldSun" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>

            {/* Left Iconic News Emblem Graphic */}
            <g transform="translate(10, 10)">
              <path d="M 20 20 L 70 20 L 50 65 L 20 65 Z" fill="url(#fbTealEmerald)" />
              <path d="M 74 20 L 104 20 L 84 65 L 54 65 Z" fill="url(#fbRedRuby)" />
              <path d="M 54 69 L 104 69 L 84 114 L 34 114 Z" fill="url(#fbRedRuby)" />
              <path d="M 14 69 L 50 69 L 30 114 L 14 114 Z" fill="url(#fbGoldSun)" />
              <circle cx="94" cy="24" r="8" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
            </g>

            {/* Typography: STORY TODAY */}
            <g transform="translate(130, 0)">
              <text x="0" y="78" fontFamily="system-ui, -apple-system, sans-serif" fontSize="64" fontWeight="900" fill="url(#fbTealEmerald)" letterSpacing="-1">STORY</text>
              <text x="235" y="78" fontFamily="system-ui, -apple-system, sans-serif" fontSize="64" fontWeight="900" fill="url(#fbRedRuby)" letterSpacing="-1">TODAY</text>
              <text x="2" y="112" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" fill="#004D40" letterSpacing="7">NEWS NETWORK</text>
              <circle cx="282" cy="107" r="4" fill="#EF4444" />
              <text x="292" y="112" fontFamily="system-ui, -apple-system, sans-serif" fontSize="13" fontWeight="800" fill="#E11D48" letterSpacing="2">LIVE</text>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
