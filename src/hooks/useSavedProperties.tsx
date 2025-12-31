import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function useSavedProperties() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedPropertyIds = [], isLoading } = useQuery({
    queryKey: ['saved-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map((item) => item.property_id);
    },
    enabled: !!user,
  });

  const saveProperty = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_properties')
        .insert({ user_id: user.id, property_id: propertyId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-properties'] });
      toast.success(t('favorites.saved'));
    },
    onError: () => {
      toast.error(t('favorites.saveError'));
    },
  });

  const unsaveProperty = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_properties')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-properties'] });
      toast.success(t('favorites.removed'));
    },
    onError: () => {
      toast.error(t('favorites.removeError'));
    },
  });

  const toggleSave = useCallback(
    (propertyId: string) => {
      if (savedPropertyIds.includes(propertyId)) {
        unsaveProperty.mutate(propertyId);
      } else {
        saveProperty.mutate(propertyId);
      }
    },
    [savedPropertyIds, saveProperty, unsaveProperty]
  );

  const isSaved = useCallback(
    (propertyId: string) => savedPropertyIds.includes(propertyId),
    [savedPropertyIds]
  );

  return {
    savedPropertyIds,
    isLoading,
    toggleSave,
    isSaved,
    isSaving: saveProperty.isPending || unsaveProperty.isPending,
  };
}
