import React from 'react';
import { Wifi, Battery, Signal, Smartphone } from 'lucide-react';

interface Props {
  isMobileView: boolean;
  children: React.ReactNode;
}

export const MobileFrame: React.FC<Props> = ({ isMobileView, children }) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!isMobileView) {
    return <div className="min-h-screen bg-slate-100/70 text-slate-900">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-4 sm:py-8 px-2 sm:px-4 flex items-center justify-center">
      {/* Smartphone mockup */}
      <div className="w-full max-w-[440px] bg-slate-950 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800 relative">
        {/* Dynamic Island / Speaker notch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-2.5">
          <div className="w-2 h-2 rounded-full bg-slate-900" />
          <div className="w-2 h-2 rounded-full bg-blue-950/60" />
        </div>

        {/* Screen container */}
        <div className="w-full bg-white rounded-[36px] overflow-hidden flex flex-col h-[840px] max-h-[90vh] relative shadow-inner">
          {/* Simulated Mobile Status Bar */}
          <div className="w-full h-11 bg-white/95 backdrop-blur-xs flex items-center justify-between px-6 pt-1 text-slate-900 text-xs font-semibold select-none shrink-0 z-40 border-b border-slate-100">
            <span className="text-[13px] tracking-tight font-medium">{currentTime}</span>
            <div className="flex items-center gap-1.5 text-slate-800">
              <Signal className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">5G</span>
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Inner App Content with smooth scroll */}
          <div className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
            {children}
          </div>

          {/* Bottom Home Indicator */}
          <div className="w-full h-5 bg-white flex items-center justify-center pb-1 shrink-0">
            <div className="w-32 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
