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

  // Dimension mappings for the icon emblem
  const iconSizeMap = {
    sm: 'w-10 h-10 min-w-[40px]',
    md: 'w-14 h-14 sm:w-16 sm:h-16 min-w-[56px]',
    header: 'w-14 h-14 sm:w-16 sm:h-16 min-w-[56px] sm:min-w-[64px]',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 min-w-[80px]',
    xl: 'w-28 h-28 sm:w-32 sm:h-32 min-w-[112px]',
    '2xl': 'w-36 h-36 sm:w-44 sm:h-44 min-w-[144px]',
    splash: 'w-32 h-32 sm:w-40 sm:h-40 min-w-[128px] sm:min-w-[160px]',
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      id="story-today-official-logo"
    >
      {/* Official story-today.in Logo Emblem (Robust Vector Emblem or Custom Image) */}
      <div
        className={`relative flex-shrink-0 ${iconSizeMap[size] || iconSizeMap.header} transition-transform duration-300 group-hover:scale-105 flex items-center justify-center`}
      >
        {imageSrc && !imageError ? (
          <img
            src={imageSrc}
            alt="Story Today Logo"
            className="w-full h-full object-contain rounded-2xl shadow-lg border border-[#E0E0E0]/80 bg-white p-1.5"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-md"
            shapeRendering="geometricPrecision"
          >
            {/* Base rounded shield / emblem container */}
            <rect width="48" height="48" rx="12" fill="#004D40" />
            <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25" stroke="#80CBC4" strokeWidth="1" strokeOpacity="0.45" />

            {/* Folded Newspaper / Editorial Document Back Sheet */}
            <rect x="9.5" y="8.5" width="29" height="31" rx="3" fill="#002822" />

            {/* Front crisp white news sheet */}
            <rect x="11.5" y="9.5" width="25" height="29" rx="2.5" fill="#FFFFFF" />

            {/* Top Red Breaking / Masthead Bar */}
            <rect x="14.5" y="12.5" width="19" height="4.5" rx="1.2" fill="#DC2626" />

            {/* Editorial Headline & Lines */}
            <rect x="14.5" y="19.5" width="12" height="2.4" rx="0.6" fill="#004D40" />
            <rect x="14.5" y="24" width="19" height="1.8" rx="0.5" fill="#37474F" />
            <rect x="14.5" y="27.5" width="19" height="1.8" rx="0.5" fill="#37474F" />
            <rect x="14.5" y="31" width="14" height="1.8" rx="0.5" fill="#78909C" />

            {/* Live Citizen Beacon / Pen nib element */}
            <circle cx="31" cy="20.5" r="3.5" fill="#004D40" />
            <circle cx="31" cy="20.5" r="1.6" fill="#E0F2F1" />
            <circle cx="31" cy="20.5" r="0.7" fill="#DC2626" />
          </svg>
        )}

        {/* Live Broadcast Pulse dot */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-white shadow-xs"></span>
        </span>
      </div>
    </div>
  );
};
