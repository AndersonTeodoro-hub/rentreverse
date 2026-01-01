import { useState, useEffect, useCallback } from 'react';

interface CachedProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  rent_amount: number;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  images: string[] | null;
  property_type: string;
  cached_at: string;
}

const CACHE_KEY = 'rentreverse_offline_favorites';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useOfflineFavorites = () => {
  const [cachedFavorites, setCachedFavorites] = useState<CachedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cached favorites on mount
  useEffect(() => {
    loadCachedFavorites();
  }, []);

  const loadCachedFavorites = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedProperty[];
        // Filter out expired entries
        const valid = parsed.filter(p => {
          const cachedTime = new Date(p.cached_at).getTime();
          return Date.now() - cachedTime < CACHE_EXPIRY;
        });
        setCachedFavorites(valid);
        // Clean up expired entries
        if (valid.length !== parsed.length) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(valid));
        }
      }
    } catch (error) {
      console.error('Error loading cached favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cacheProperty = useCallback((property: Omit<CachedProperty, 'cached_at'>) => {
    setCachedFavorites(prev => {
      const exists = prev.find(p => p.id === property.id);
      if (exists) return prev;

      const newCached = [...prev, { ...property, cached_at: new Date().toISOString() }];
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCached));
      return newCached;
    });
  }, []);

  const cacheProperties = useCallback((properties: Omit<CachedProperty, 'cached_at'>[]) => {
    setCachedFavorites(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const newProperties = properties
        .filter(p => !existingIds.has(p.id))
        .map(p => ({ ...p, cached_at: new Date().toISOString() }));
      
      if (newProperties.length === 0) return prev;
      
      const updated = [...prev, ...newProperties];
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCachedProperty = useCallback((propertyId: string) => {
    setCachedFavorites(prev => {
      const filtered = prev.filter(p => p.id !== propertyId);
      localStorage.setItem(CACHE_KEY, JSON.stringify(filtered));
      return filtered;
    });
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCachedFavorites([]);
  }, []);

  const getCachedProperty = useCallback((propertyId: string) => {
    return cachedFavorites.find(p => p.id === propertyId) || null;
  }, [cachedFavorites]);

  return {
    cachedFavorites,
    isLoading,
    cacheProperty,
    cacheProperties,
    removeCachedProperty,
    clearCache,
    getCachedProperty,
  };
};
