'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CANVAS_DIMENSIONS } from '@/lib/templateBuilder.types';

interface CertificateCanvasProps {
  /** Background image in base64 format (optional) */
  backgroundImage?: string;
  /** Child elements to render on the canvas */
  children?: React.ReactNode;
  /** Callback when canvas is clicked (for deselecting elements) */
  onCanvasClick?: () => void;
}

/**
 * Certificate Canvas Component
 * 
 * Renders the certificate design canvas with fixed A4 landscape dimensions (1122px × 794px).
 * Implements responsive scaling to fit different screen sizes while maintaining aspect ratio.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */
export function CertificateCanvas({
  backgroundImage,
  children,
  onCanvasClick,
}: CertificateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Calculate scale factor based on container size
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Calculate scale to fit within container while maintaining aspect ratio
      const scaleX = containerWidth / CANVAS_DIMENSIONS.WIDTH;
      const scaleY = containerHeight / CANVAS_DIMENSIONS.HEIGHT;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

      setScaleFactor(scale);
    };

    // Calculate initial scale
    calculateScale();

    // Recalculate on window resize
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking directly on the canvas background
    if (e.target === e.currentTarget && onCanvasClick) {
      onCanvasClick();
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full p-8 bg-gray-100"
    >
      {/* Dimension indicators */}
      <div className="mb-2 text-sm text-gray-600">
        {CANVAS_DIMENSIONS.WIDTH}px × {CANVAS_DIMENSIONS.HEIGHT}px
        {scaleFactor < 1 && (
          <span className="ml-2 text-gray-500">
            (scaled to {Math.round(scaleFactor * 100)}%)
          </span>
        )}
      </div>

      {/* Canvas container */}
      <div
        className="relative bg-white shadow-lg"
        style={{
          width: CANVAS_DIMENSIONS.WIDTH,
          height: CANVAS_DIMENSIONS.HEIGHT,
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'top center',
        }}
        onClick={handleCanvasClick}
      >
        {/* Background image */}
        {backgroundImage && (
          <img
            src={backgroundImage}
            alt="Certificate background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        )}

        {/* Canvas elements */}
        <div
          className="absolute inset-0"
          style={{
            width: CANVAS_DIMENSIONS.WIDTH,
            height: CANVAS_DIMENSIONS.HEIGHT,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
