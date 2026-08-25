import React, { useState, useEffect } from 'react';

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
  const [imageSrc, setImageSrc] = useState<string | null>(customSrc || null);
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
        setImageSrc(null);
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
      {/* Official story-today.in Logo Emblem (Big, Bold, Crisp Vector Emblem or Custom Image) */}
      <div
        className={`relative flex-shrink-0 ${iconSizeMap[size] || iconSizeMap.header} transition-transform duration-300 group-hover:scale-105 flex items-center justify-center drop-shadow-md`}
      >
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt="Story Today Logo"
            className="w-full h-full object-contain rounded-2xl shadow-xl border-2 border-[#004D40]/20 bg-white p-1.5"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full filter drop-shadow-lg"
            shapeRendering="geometricPrecision"
          >
            {/* Base rounded shield / emblem container with bold bevel & border */}
            <rect width="48" height="48" rx="13" fill="#004D40" />
            <rect x="1" y="1" width="46" height="46" rx="12" stroke="#80CBC4" strokeWidth="1.5" strokeOpacity="0.6" />

            {/* Folded Newspaper / Editorial Document Back Sheet Shadow */}
            <rect x="8.5" y="7.5" width="31" height="33" rx="3.5" fill="#002D25" />

            {/* Front crisp white news sheet with bold borders */}
            <rect x="10.5" y="8.5" width="27" height="31" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.75" />

            {/* Top Bold Red Breaking / Masthead Bar */}
            <rect x="13.5" y="11.5" width="21" height="5.5" rx="1.5" fill="#E11D48" />

            {/* Bold Editorial Headline */}
            <rect x="13.5" y="19.5" width="13" height="3" rx="0.8" fill="#004D40" />
            
            {/* Bold Content Lines */}
            <rect x="13.5" y="24.5" width="21" height="2" rx="0.6" fill="#1E293B" />
            <rect x="13.5" y="28" width="21" height="2" rx="0.6" fill="#334155" />
            <rect x="13.5" y="31.5" width="15" height="2" rx="0.6" fill="#64748B" />
            <rect x="13.5" y="35" width="11" height="1.8" rx="0.5" fill="#94A3B8" />

            {/* Live Citizen Beacon / Pen nib focal badge */}
            <circle cx="31.5" cy="20.5" r="4" fill="#004D40" />
            <circle cx="31.5" cy="20.5" r="2.2" fill="#E0F2F1" />
            <circle cx="31.5" cy="20.5" r="1.1" fill="#E11D48" />
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
