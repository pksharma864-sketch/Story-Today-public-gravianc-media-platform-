import React, { useEffect, useState } from 'react';
import { StoryTodayLogo } from './StoryTodayLogo';
import { Language } from '../types';

interface SplashScreenProps {
  lang: Language;
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  lang,
  onFinish,
  minDuration = 1100,
}) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      const finishTimer = setTimeout(() => {
        if (onFinish) onFinish();
      }, 350);
      return () => clearTimeout(finishTimer);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinish]);

  return (
    <div
      id="app-splash-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAFAFA] transition-opacity duration-300 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Decorative subtle background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#004D40_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-[0.06] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-xl px-6 text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Emblem Logo */}
        <div className="mb-6 p-6 rounded-3xl bg-white shadow-xl border border-[#E0E0E0] ring-1 ring-black/5">
          <StoryTodayLogo
            variant="icon-only"
            size="splash"
            showDomain={false}
            lang={lang}
            theme="emerald"
          />
        </div>

        {/* Animated Loading Bar */}
        <div className="w-48 sm:w-64 h-1.5 bg-[#E0E0E0] rounded-full overflow-hidden mt-4 shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#004D40] to-emerald-600 rounded-full animate-pulse transition-all duration-500 w-4/5" />
        </div>
      </div>
    </div>
  );
};
