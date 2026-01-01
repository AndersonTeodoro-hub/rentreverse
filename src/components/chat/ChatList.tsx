import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS, es, fr, Locale } from 'date-fns/locale';
import { MessageCircle, Home } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ChatListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  isLoading?: boolean;
}

const localeMap: Record<string, Locale> = {
  pt,
  en: enUS,
  es,
  fr,
};

export function ChatList({ conversations, selectedId, onSelect, isLoading }: ChatListProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = localeMap[i18n.language] || enUS;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('chat.noConversations')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {conversations.map((conversation) => {
          const isSelected = selectedId === conversation.id;
          const hasUnread = (conversation.unread_count || 0) > 0;

          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation)}
              className={cn(
                'w-full p-4 text-left transition-colors hover:bg-muted/50',
                isSelected && 'bg-muted',
                hasUnread && 'bg-primary/5'
              )}
            >
              <div className="flex gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={conversation.other_participant?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {conversation.other_participant?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('font-medium truncate', hasUnread && 'font-semibold')}>
                      {conversation.other_participant?.full_name || t('chat.unknownUser')}
                    </span>
                    {conversation.last_message && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                          addSuffix: true,
                          locale,
                        })}
                      </span>
                    )}
                  </div>

                  {conversation.property && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Home className="h-3 w-3" />
                      <span className="truncate">{conversation.property.title}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className={cn(
                      'text-sm truncate',
                      hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}>
                      {conversation.last_message?.sender_id === user?.id && (
                        <span className="text-muted-foreground">{t('chat.you')}: </span>
                      )}
                      {conversation.last_message?.content || t('chat.noMessages')}
                    </p>
                    {hasUnread && (
                      <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center p-0 text-xs">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
