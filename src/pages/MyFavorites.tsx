import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Home, Heart } from 'lucide-react';
import { Layout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useSavedProperties } from '@/hooks/useSavedProperties';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  rent_amount: number;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  property_type: string;
  images: string[] | null;
  pets_allowed: boolean | null;
  smoking_allowed: boolean | null;
}

export default function MyFavorites() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { savedPropertyIds, isLoading: savedLoading, toggleSave, isSaving } = useSavedProperties();

  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['saved-properties-details', savedPropertyIds],
    queryFn: async () => {
      if (savedPropertyIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', savedPropertyIds);

      if (error) throw error;
      return data as Property[];
    },
    enabled: savedPropertyIds.length > 0,
  });

  const isLoading = savedLoading || propertiesLoading;

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('favorites.loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">{t('favorites.loginRequiredDesc')}</p>
          <Button asChild>
            <Link to="/auth">{t('nav.login')}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('favorites.title')}</h1>
          <p className="text-muted-foreground">{t('favorites.subtitle')}</p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardContent className="pt-4 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !properties || properties.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('favorites.empty')}</h3>
            <p className="text-muted-foreground mb-4">{t('favorites.emptyDesc')}</p>
            <Button asChild>
              <Link to="/explore-properties">{t('favorites.exploreNow')}</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="relative">
                {/* Remove from favorites button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSave(property.id);
                  }}
                  disabled={isSaving}
                  className="absolute top-3 left-3 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                  aria-label={t('favorites.remove')}
                >
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </button>
                <Link to={`/property/${property.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {/* Image */}
                    <div className="relative h-48 bg-muted">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Home className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-primary">
                        €{property.rent_amount}/mês
                      </Badge>
                    </div>

                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                        {property.title}
                      </h3>
                      <p className="text-muted-foreground text-sm flex items-center gap-1 mb-3">
                        <MapPin className="h-4 w-4" />
                        {property.city}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {property.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            {property.bedrooms}
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            {property.bathrooms}
                          </span>
                        )}
                        {property.area_sqm && <span>{property.area_sqm}m²</span>}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 pb-4">
                      <div className="flex gap-2">
                        {property.pets_allowed && (
                          <Badge variant="secondary" className="text-xs">
                            {t('property.petsAllowed')}
                          </Badge>
                        )}
                        {property.smoking_allowed && (
                          <Badge variant="secondary" className="text-xs">
                            {t('property.smokingAllowed')}
                          </Badge>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
