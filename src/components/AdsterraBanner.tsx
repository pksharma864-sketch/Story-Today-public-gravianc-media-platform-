import React, { useState, useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  slotId?: string;
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({
  slotId = 'ad-banner',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth;
        if (availableWidth > 0 && availableWidth < 728) {
          // Scale down proportionally on mobile / narrow viewports to prevent layout break
          const calculatedScale = Math.min(1, Math.max(0.35, availableWidth / 728));
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

  const bannerHtml = `<!DOCTYPE html>
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
      'key' : '30b48084a0284b0e640d340952b04e4a',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/30b48084a0284b0e640d340952b04e4a/invoke.js"></script>
</body>
</html>`;

  // Compute scaled wrapper size
  const scaledWidth = Math.min(728, Math.round(728 * scale));
  const scaledHeight = Math.round(90 * scale);

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-center my-4 overflow-hidden print:hidden select-none ${className}`}
      id={`adsterra-banner-container-${slotId}`}
      aria-label="Advertisement"
    >
      <div
        className="relative flex items-center justify-center overflow-hidden transition-all duration-150"
        style={{
          width: `${scaledWidth}px`,
          height: `${scaledHeight}px`,
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            width: '728px',
            height: '90px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <iframe
            title="Adsterra 728x90 Banner"
            src="/ad-banner-728x90.html"
            srcDoc={bannerHtml}
            width={728}
            height={90}
            scrolling="no"
            style={{
              width: '728px',
              height: '90px',
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
