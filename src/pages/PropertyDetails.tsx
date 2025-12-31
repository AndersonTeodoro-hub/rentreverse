import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Building2, MapPin, Euro, Bed, Bath, Maximize, Calendar,
  PawPrint, Cigarette, ChevronLeft, ChevronRight, ArrowLeft,
  Send, Heart, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import SendOfferDialog from "@/components/SendOfferDialog";

const PropertyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  // Fetch property details
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch landlord profile
  const { data: landlordProfile } = useQuery({
    queryKey: ['landlord-profile', property?.user_id],
    queryFn: async () => {
      if (!property?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', property.user_id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!property?.user_id,
  });

  // Fetch tenant's active requests (for sending offers)
  const { data: tenantRequests } = useQuery({
    queryKey: ['my-tenant-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tenant_requests')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && userRole === 'tenant',
  });

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: `${property?.title} - €${property?.rent_amount}/mês`,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('common.copied'),
        description: t('property.linkCopied'),
      });
    }
  };

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: t('properties.types.apartment'),
      house: t('properties.types.house'),
      studio: t('properties.types.studio'),
      room: t('properties.types.room'),
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Building2 className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t('property.notFound')}</h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </Layout>
    );
  }

  const images = property.images || [];
  const hasImages = images.length > 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Image Gallery */}
        <div className="relative w-full h-[50vh] md:h-[60vh] bg-muted">
          {hasImages ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={`${property.title} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        onClick={() => setCurrentImageIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-24 h-24 text-muted-foreground" />
            </div>
          )}

          {/* Back button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 rounded-full opacity-80 hover:opacity-100"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full opacity-80 hover:opacity-100"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full opacity-80 hover:opacity-100"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        {hasImages && images.length > 1 && (
          <div className="px-4 py-3 bg-muted/50 overflow-x-auto">
            <div className="flex gap-2 max-w-6xl mx-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                    idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{getPropertyTypeLabel(property.property_type)}</Badge>
                  <Badge variant="outline">
                    {t(`properties.status.${property.status}`)}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                <p className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {property.address}, {property.city}
                  {property.postal_code && ` - ${property.postal_code}`}
                </p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Bed className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <div className="font-semibold">{property.bedrooms}</div>
                    <div className="text-xs text-muted-foreground">{t('properties.beds')}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Bath className="w-6 h-6 mx-auto mb-1 text-primary" />
                    <div className="font-semibold">{property.bathrooms}</div>
                    <div className="text-xs text-muted-foreground">{t('properties.baths')}</div>
                  </CardContent>
                </Card>
                {property.area_sqm && (
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Maximize className="w-6 h-6 mx-auto mb-1 text-primary" />
                      <div className="font-semibold">{property.area_sqm}m²</div>
                      <div className="text-xs text-muted-foreground">{t('property.area')}</div>
                    </CardContent>
                  </Card>
                )}
                {property.available_from && (
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Calendar className="w-6 h-6 mx-auto mb-1 text-primary" />
                      <div className="font-semibold text-sm">
                        {new Date(property.available_from).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">{t('property.availableFrom')}</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('property.description')}</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {property.description || t('property.noDescription')}
                </p>
              </div>

              <Separator />

              {/* Features */}
              <div>
                <h2 className="text-xl font-semibold mb-3">{t('property.features')}</h2>
                <div className="flex flex-wrap gap-2">
                  {property.pets_allowed && (
                    <Badge variant="secondary" className="py-1 px-3">
                      <PawPrint className="w-4 h-4 mr-1" />
                      {t('properties.petsOk')}
                    </Badge>
                  )}
                  {property.smoking_allowed && (
                    <Badge variant="secondary" className="py-1 px-3">
                      <Cigarette className="w-4 h-4 mr-1" />
                      {t('properties.smokingOk')}
                    </Badge>
                  )}
                  {!property.pets_allowed && (
                    <Badge variant="outline" className="py-1 px-3">
                      <PawPrint className="w-4 h-4 mr-1" />
                      {t('property.noPets')}
                    </Badge>
                  )}
                  {!property.smoking_allowed && (
                    <Badge variant="outline" className="py-1 px-3">
                      <Cigarette className="w-4 h-4 mr-1" />
                      {t('property.noSmoking')}
                    </Badge>
                  )}
                  {property.amenities?.map((amenity, idx) => (
                    <Badge key={idx} variant="secondary" className="py-1 px-3">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Price Card */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-baseline gap-1">
                    <Euro className="w-6 h-6" />
                    <span className="text-3xl">{property.rent_amount}</span>
                    <span className="text-muted-foreground text-base">/{t('pricing.period.month')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('property.rentDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Landlord info */}
                  {landlordProfile && (
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {landlordProfile.avatar_url ? (
                          <img
                            src={landlordProfile.avatar_url}
                            alt={landlordProfile.full_name || ''}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {landlordProfile.full_name || t('property.landlord')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('property.owner')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  {user && userRole === 'tenant' && property.user_id !== user.id && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setOfferDialogOpen(true)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {t('property.contactLandlord')}
                    </Button>
                  )}

                  {!user && (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate('/auth')}
                    >
                      {t('property.loginToContact')}
                    </Button>
                  )}

                  {user && property.user_id === user.id && (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => navigate('/my-properties')}
                    >
                      {t('property.editProperty')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Send Offer Dialog - Reusing existing component with modified props */}
      {tenantRequests && tenantRequests.length > 0 && (
        <SendOfferDialog
          open={offerDialogOpen}
          onOpenChange={setOfferDialogOpen}
          tenant={null}
          propertyContext={{
            propertyId: property.id,
            landlordId: property.user_id,
            tenantRequests: tenantRequests,
          }}
        />
      )}
    </Layout>
  );
};

export default PropertyDetails;
