import React, { useState, useEffect, useRef } from 'react';

interface AdsterraRectangleProps {
  slotId?: string;
  className?: string;
}

export const AdsterraRectangle: React.FC<AdsterraRectangleProps> = ({
  slotId = 'inline-rect',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        if (availableWidth > 0 && availableWidth < 300) {
          // Scale down smoothly on ultra-narrow viewports (< 300px)
          const calculatedScale = Math.min(1, Math.max(0.5, availableWidth / 300));
          setScale(calculatedScale);
        } else {
          setScale(1);
        }
      }
    };

    updateDimensions();

    window.addEventListener('resize', updateDimensions);
    const observer =
      typeof ResizeObserver !== 'undefined' && containerRef.current
        ? new ResizeObserver(updateDimensions)
        : null;

    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer?.disconnect();
    };
  }, []);

  const rectangleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Advertisement</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : 'b5f7b937f50258fa09a703437f045782',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/b5f7b937f50258fa09a703437f045782/invoke.js"></script>
</body>
</html>`;

  // Compute scaled wrapper size
  const scaledWidth = Math.min(300, Math.round(300 * scale));
  const scaledHeight = Math.round(250 * scale);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-center my-6 sm:my-8 overflow-hidden print:hidden select-none ${className}`}
      id={`adsterra-rect-container-${slotId}`}
      aria-label="Advertisement"
    >
      <div className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1.5 pointer-events-none">
        Advertisement
      </div>
      <div
        className="relative flex items-center justify-center overflow-hidden transition-all duration-150 rounded-md bg-gray-50/50 border border-gray-100 shadow-xs"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            width: '300px',
            height: '250px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <iframe
            title={`Adsterra 300x250 Ad - ${slotId}`}
            src={`/ad-banner-300x250.html?slot=${encodeURIComponent(slotId)}`}
            srcDoc={rectangleHtml}
            width={300}
            height={250}
            scrolling="no"
            style={{
              width: '300px',
              height: '250px',
              border: 'none',
              overflow: 'hidden',
              display: 'block',
            }}
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};
