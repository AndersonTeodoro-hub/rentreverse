import { useState } from 'react';
import { View, ExternalLink, Play, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VirtualTour360 } from './VirtualTour360';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VirtualTourEmbedProps {
  embedUrl?: string | null;
  images360?: string[] | null;
  tourType: 'none' | 'embed' | 'images';
  propertyId: string;
  propertyTitle?: string;
  compact?: boolean;
}

export function VirtualTourEmbed({
  embedUrl,
  images360,
  tourType,
  propertyId,
  propertyTitle,
  compact = false,
}: VirtualTourEmbedProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  const trackView = async (imagesViewed: number = 1, durationSeconds: number = 0) => {
    try {
      const deviceType = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
      
      await supabase.from('virtual_tour_views').insert({
        property_id: propertyId,
        user_id: user?.id || null,
        view_duration_seconds: durationSeconds,
        images_viewed: imagesViewed,
        source: window.location.pathname.includes('property') ? 'property_details' : 'explore',
        device_type: deviceType,
      });
    } catch (error) {
      console.error('Error tracking tour view:', error);
    }
  };

  const handleOpenTour = () => {
    setIsOpen(true);
    if (tourType === 'embed') {
      trackView();
    }
  };

  if (tourType === 'none') {
    return null;
  }

  // Compact button version
  if (compact) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenTour}
          className="gap-2"
        >
          <View className="h-4 w-4" />
          Visita 360°
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Visita Virtual 360°</DialogTitle>
            </DialogHeader>
            {tourType === 'embed' && embedUrl ? (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="bg-black/50 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="500"
                  frameBorder="0"
                  allowFullScreen
                  allow="xr-spatial-tracking; gyroscope; accelerometer"
                  className="w-full aspect-video"
                />
              </div>
            ) : tourType === 'images' && images360 && images360.length > 0 ? (
              <VirtualTour360
                images={images360}
                title={propertyTitle}
                onClose={() => setIsOpen(false)}
                onViewTracked={trackView}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full card version
  return (
    <div className="relative rounded-lg overflow-hidden bg-muted border">
      {/* Preview/Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
        {tourType === 'images' && images360 && images360.length > 0 ? (
          <img 
            src={images360[0]} 
            alt="Pré-visualização 360°"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <View className="h-16 w-16 text-primary/40" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
          <Badge className="bg-white/20 text-white border-0">
            <View className="h-3 w-3 mr-1" />
            Visita Virtual 360°
          </Badge>
          
          <Button
            onClick={handleOpenTour}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Iniciar Visita
          </Button>

          {tourType === 'embed' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => window.open(embedUrl!, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir em nova janela
            </Button>
          )}
        </div>

        {/* Image count badge */}
        {tourType === 'images' && images360 && images360.length > 1 && (
          <Badge 
            variant="secondary" 
            className="absolute bottom-3 right-3 bg-black/60 text-white border-0"
          >
            <Eye className="h-3 w-3 mr-1" />
            {images360.length} vistas
          </Badge>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Visita Virtual 360° - {propertyTitle}</DialogTitle>
          </DialogHeader>
          {tourType === 'embed' && embedUrl ? (
            <div className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <iframe
                src={embedUrl}
                width="100%"
                height="600"
                frameBorder="0"
                allowFullScreen
                allow="xr-spatial-tracking; gyroscope; accelerometer"
                className="w-full"
                style={{ minHeight: '70vh' }}
              />
            </div>
          ) : tourType === 'images' && images360 && images360.length > 0 ? (
            <div style={{ height: '70vh' }}>
              <VirtualTour360
                images={images360}
                title={propertyTitle}
                onClose={() => setIsOpen(false)}
                onViewTracked={trackView}
                className="h-full"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
