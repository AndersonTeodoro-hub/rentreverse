import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Maximize2, RotateCcw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VirtualTour360Props {
  images: string[];
  title?: string;
  onClose?: () => void;
  onViewTracked?: (imagesViewed: number, durationSeconds: number) => void;
  className?: string;
  fullscreen?: boolean;
}

declare global {
  interface Window {
    pannellum: any;
  }
}

export function VirtualTour360({
  images,
  title,
  onClose,
  onViewTracked,
  className,
  fullscreen = false,
}: VirtualTour360Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const startTimeRef = useRef(Date.now());
  const imagesViewedRef = useRef(new Set<number>([0]));

  // Load Pannellum script
  useEffect(() => {
    const loadPannellum = async () => {
      // Check if already loaded
      if (window.pannellum) {
        setIsLoaded(true);
        return;
      }

      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
      cssLink.integrity = 'sha384-02yn80EH0cF+s23taAmuhEZ04p3CTbQvV0QZMr2reUxajpfvcLNKlzsPkZwx14mf';
      cssLink.crossOrigin = 'anonymous';
      document.head.appendChild(cssLink);

      // Load JS
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
      script.integrity = 'sha384-S5+w/JlcNAOymqXGNrvzn2F++XsaHTJdex6KE5VbKryfFgqJiRUJOgOkUqaiOZTf';
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);

      return () => {
        document.head.removeChild(cssLink);
        document.head.removeChild(script);
      };
    };

    loadPannellum();
  }, []);

  // Initialize viewer
  useEffect(() => {
    if (!isLoaded || !containerRef.current || images.length === 0) return;

    // Destroy existing viewer
    if (viewerRef.current) {
      viewerRef.current.destroy();
    }

    // Create new viewer
    viewerRef.current = window.pannellum.viewer(containerRef.current, {
      type: 'equirectangular',
      panorama: images[currentIndex],
      autoLoad: true,
      autoRotate: isAutoRotating ? -2 : 0,
      compass: false,
      showZoomCtrl: false,
      showFullscreenCtrl: false,
      mouseZoom: true,
      hfov: 110,
      minHfov: 50,
      maxHfov: 120,
      pitch: 0,
      yaw: 0,
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [isLoaded, currentIndex, images]);

  // Update auto-rotate
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.setAutoRotate(isAutoRotating ? -2 : 0);
    }
  }, [isAutoRotating]);

  // Track view on unmount
  useEffect(() => {
    return () => {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onViewTracked?.(imagesViewedRef.current.size, duration);
    };
  }, [onViewTracked]);

  const goToImage = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
      imagesViewedRef.current.add(index);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'relative rounded-lg overflow-hidden bg-black',
      isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video',
      className
    )}>
      {/* Pannellum container */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: isFullscreen ? '100vh' : '300px' }}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
            <span className="text-white text-sm">A carregar visita virtual...</span>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            360°
          </Badge>
          {title && (
            <span className="text-white font-medium text-sm">{title}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => goToImage(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm">
              {currentIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => goToImage(currentIndex + 1)}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
            >
              {isAutoRotating ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => viewerRef.current?.setPitch(0) && viewerRef.current?.setYaw(0)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3 justify-center overflow-x-auto pb-1">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={cn(
                  'w-12 h-12 rounded-md overflow-hidden border-2 transition-all shrink-0',
                  currentIndex === index 
                    ? 'border-white scale-110' 
                    : 'border-white/30 hover:border-white/60'
                )}
              >
                <img 
                  src={img} 
                  alt={`Vista ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Instructions overlay (shows briefly) */}
      {isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-fade-out">
          <div className="bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
            Arraste para explorar • Scroll para zoom
          </div>
        </div>
      )}
    </div>
  );
}
