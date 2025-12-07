import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  zoomLevel?: number;
  maxZoom?: number;
}

const ImageZoom = ({ 
  src, 
  alt, 
  className = '', 
  zoomLevel = 2.5,
  maxZoom = 4 
}: ImageZoomProps) => {
  const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoomLevel);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset zoom when image changes
    setZoomPosition(null);
    setImageLoaded(false);
  }, [src]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values to prevent zoom from going out of bounds
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setZoomPosition({ x: clampedX, y: clampedY });
  };

  const handleZoomIn = () => {
    setCurrentZoom(Math.min(maxZoom, currentZoom + 0.5));
  };

  const handleZoomOut = () => {
    setCurrentZoom(Math.max(1, currentZoom - 0.5));
  };

  const handleResetZoom = () => {
    setCurrentZoom(zoomLevel);
    setZoomPosition(null);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative group cursor-zoom-in ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomPosition(null)}
        role="img"
        aria-label={alt}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (zoomPosition) {
              handleResetZoom();
            } else {
              setZoomPosition({ x: 50, y: 50 });
            }
          }
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-200 ease-out"
          style={{
            transform: zoomPosition 
              ? `scale(${currentZoom})` 
              : 'scale(1)',
            transformOrigin: zoomPosition ? `${zoomPosition.x}% ${zoomPosition.y}%` : 'center center',
            willChange: zoomPosition ? 'transform' : 'auto'
          }}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Subtle overlay to indicate zoom area */}
        {zoomPosition && imageLoaded && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle 200px at ${zoomPosition.x}% ${zoomPosition.y}%, transparent 40%, rgba(0,0,0,0.05) 100%)`
            }}
            aria-hidden="true"
          />
        )}

        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 justify-center mb-4" role="group" aria-label="Image zoom controls">
        <button
          onClick={handleZoomOut}
          disabled={currentZoom <= 1}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
        <span className="text-sm text-gray-600 min-w-[60px] text-center" aria-live="polite">
          {Math.round(currentZoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={currentZoom >= maxZoom}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        {zoomPosition && (
          <button
            onClick={handleResetZoom}
            className="ml-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="Reset zoom"
          >
            Reset
          </button>
        )}
      </div>

      {/* Instructions */}
      <p className="text-sm text-gray-500 text-center" aria-live="polite">
        {zoomPosition 
          ? 'Move mouse to adjust zoom area • Press Enter to toggle zoom'
          : 'Hover over image to zoom • Use buttons to adjust zoom level'}
      </p>
    </div>
  );
};

export default ImageZoom;

