import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, MapPin, Bed, Bath, Euro, Home, Filter, X, ArrowUpDown } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
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
  available_from: string | null;
  pets_allowed: boolean | null;
  smoking_allowed: boolean | null;
}

export default function ExploreProperties() {
  const { t } = useTranslation();
  const [searchCity, setSearchCity] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minBedrooms, setMinBedrooms] = useState<string>('any');
  const [propertyType, setPropertyType] = useState<string>('any');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: properties, isLoading } = useQuery({
    queryKey: ['explore-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
  });

  // Get unique cities for the search suggestions
  const cities = useMemo(() => {
    if (!properties) return [];
    const uniqueCities = [...new Set(properties.map((p) => p.city))];
    return uniqueCities.sort();
  }, [properties]);

  // Filter and sort properties based on criteria
  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    const filtered = properties.filter((property) => {
      // City filter
      if (searchCity && !property.city.toLowerCase().includes(searchCity.toLowerCase())) {
        return false;
      }

      // Price filter
      if (property.rent_amount < minPrice || property.rent_amount > maxPrice) {
        return false;
      }

      // Bedrooms filter
      if (minBedrooms !== 'any') {
        const minBedroomsNum = parseInt(minBedrooms);
        if (!property.bedrooms || property.bedrooms < minBedroomsNum) {
          return false;
        }
      }

      // Property type filter
      if (propertyType !== 'any' && property.property_type !== propertyType) {
        return false;
      }

      return true;
    });

    // Sort properties
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.rent_amount - b.rent_amount;
        case 'price-desc':
          return b.rent_amount - a.rent_amount;
        case 'newest':
          return new Date(b.available_from || 0).getTime() - new Date(a.available_from || 0).getTime();
        case 'oldest':
          return new Date(a.available_from || 0).getTime() - new Date(b.available_from || 0).getTime();
        case 'bedrooms':
          return (b.bedrooms || 0) - (a.bedrooms || 0);
        case 'area':
          return (b.area_sqm || 0) - (a.area_sqm || 0);
        default:
          return 0;
      }
    });
  }, [properties, searchCity, minPrice, maxPrice, minBedrooms, propertyType, sortBy]);

  const clearFilters = () => {
    setSearchCity('');
    setMinPrice(0);
    setMaxPrice(5000);
    setMinBedrooms('any');
    setPropertyType('any');
  };

  const hasActiveFilters = searchCity || minPrice > 0 || maxPrice < 5000 || minBedrooms !== 'any' || propertyType !== 'any';

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* City Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('explore.cityLabel')}</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('explore.cityPlaceholder')}
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <label className="text-sm font-medium">{t('explore.priceRange')}</label>
        <div className="px-2">
          <Slider
            value={[minPrice, maxPrice]}
            onValueChange={([min, max]) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
            max={5000}
            min={0}
            step={50}
            className="w-full"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>€{minPrice}</span>
          <span>€{maxPrice}</span>
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('explore.bedrooms')}</label>
        <Select value={minBedrooms} onValueChange={setMinBedrooms}>
          <SelectTrigger>
            <SelectValue placeholder={t('explore.anyBedrooms')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t('explore.anyBedrooms')}</SelectItem>
            <SelectItem value="1">1+</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Property Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('explore.propertyType')}</label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger>
            <SelectValue placeholder={t('explore.anyType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t('explore.anyType')}</SelectItem>
            <SelectItem value="apartment">{t('property.types.apartment')}</SelectItem>
            <SelectItem value="house">{t('property.types.house')}</SelectItem>
            <SelectItem value="studio">{t('property.types.studio')}</SelectItem>
            <SelectItem value="room">{t('property.types.room')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          {t('explore.clearFilters')}
        </Button>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('explore.title')}</h1>
          <p className="text-muted-foreground">{t('explore.subtitle')}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <Card className="sticky top-24">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t('explore.filters')}
                </h2>
                <FiltersContent />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    {t('explore.filters')}
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        {t('explore.active')}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      {t('explore.filters')}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Count and Sort */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {isLoading ? (
                  t('common.loading')
                ) : (
                  t('explore.resultsCount', { count: filteredProperties.length })
                )}
              </span>
              
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('explore.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('explore.sortNewest')}</SelectItem>
                    <SelectItem value="oldest">{t('explore.sortOldest')}</SelectItem>
                    <SelectItem value="price-asc">{t('explore.sortPriceAsc')}</SelectItem>
                    <SelectItem value="price-desc">{t('explore.sortPriceDesc')}</SelectItem>
                    <SelectItem value="bedrooms">{t('explore.sortBedrooms')}</SelectItem>
                    <SelectItem value="area">{t('explore.sortArea')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Properties Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
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
            ) : filteredProperties.length === 0 ? (
              <Card className="p-12 text-center">
                <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('explore.noResults')}</h3>
                <p className="text-muted-foreground mb-4">{t('explore.noResultsDesc')}</p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    {t('explore.clearFilters')}
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <Link key={property.id} to={`/property/${property.id}`}>
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
                          {property.area_sqm && (
                            <span>{property.area_sqm}m²</span>
                          )}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
