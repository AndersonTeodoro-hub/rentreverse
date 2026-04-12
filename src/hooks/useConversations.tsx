import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  property_id: string | null;
  offer_id: string | null;
  last_message_at: string;
  created_at: string;
  other_participant?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  property?: {
    id: string;
    title: string;
    city: string;
  };
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unread_count?: number;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user?.id) return [];

      // Fetch conversations
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          property:properties(id, title, city)
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      if (!conversations) return [];

      // Enrich with other participant info and last message
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const otherParticipantId = conv.participant_1 === user.id 
            ? conv.participant_2 
            : conv.participant_1;

          // Get other participant profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .eq('user_id', otherParticipantId)
            .single();

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...conv,
            other_participant: profile ? {
              id: profile.user_id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            } : undefined,
            last_message: lastMessage || undefined,
            unread_count: count || 0,
          };
        })
      );

      return enrichedConversations;
    },
    enabled: !!user?.id,
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      otherUserId,
      propertyId,
      offerId,
    }: {
      otherUserId: string;
      propertyId?: string;
      offerId?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!UUID_RE.test(otherUserId)) throw new Error('Invalid user ID');

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`
        )
        .eq('property_id', propertyId || '')
        .maybeSingle();

      if (existing) {
        return existing;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: otherUserId,
          property_id: propertyId || null,
          offer_id: offerId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
