import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useConversations, Conversation, useCreateConversation } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileListVisible, setIsMobileListVisible] = useState(true);

  const { data: conversations, isLoading } = useConversations();
  const createConversation = useCreateConversation();

  // Handle deep linking to specific conversation or creating new one
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    const newWithUser = searchParams.get('with');
    const propertyId = searchParams.get('property');

    if (conversationId && conversations) {
      const conv = conversations.find((c) => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
        setIsMobileListVisible(false);
      }
    } else if (newWithUser && user) {
      // Create new conversation
      createConversation.mutate(
        {
          otherUserId: newWithUser,
          propertyId: propertyId || undefined,
        },
        {
          onSuccess: (data) => {
            navigate(`/messages?conversation=${data.id}`, { replace: true });
          },
        }
      );
    }
  }, [searchParams, conversations, user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileListVisible(false);
    navigate(`/messages?conversation=${conversation.id}`, { replace: true });
  };

  const handleBack = () => {
    setIsMobileListVisible(true);
    setSelectedConversation(null);
    navigate('/messages', { replace: true });
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            {t('chat.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('chat.subtitle')}</p>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden card-shadow-premium h-[calc(100vh-280px)] min-h-[500px]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div
              className={cn(
                'w-full md:w-80 lg:w-96 border-r border-border flex-shrink-0',
                !isMobileListVisible && 'hidden md:block'
              )}
            >
              <div className="p-4 border-b border-border bg-muted/30">
                <h2 className="font-semibold text-foreground">
                  {t('chat.conversations')}
                </h2>
              </div>
              <div className="h-[calc(100%-57px)]">
                <ChatList
                  conversations={conversations || []}
                  selectedId={selectedConversation?.id || null}
                  onSelect={handleSelectConversation}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Chat Window */}
            <div
              className={cn(
                'flex-1 min-w-0',
                isMobileListVisible && 'hidden md:block'
              )}
            >
              {selectedConversation ? (
                <ChatWindow
                  conversation={selectedConversation}
                  onBack={handleBack}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {t('chat.selectConversation')}
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    {t('chat.selectConversationDesc')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
