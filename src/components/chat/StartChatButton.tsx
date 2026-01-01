import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface StartChatButtonProps {
  otherUserId: string;
  propertyId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function StartChatButton({
  otherUserId,
  propertyId,
  variant = 'outline',
  size = 'default',
  className,
}: StartChatButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      toast({
        title: t('auth.error'),
        description: t('chat.loginRequired'),
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // Navigate to messages with params to create/open conversation
    const params = new URLSearchParams();
    params.set('with', otherUserId);
    if (propertyId) {
      params.set('property', propertyId);
    }
    navigate(`/messages?${params.toString()}`);
  };

  // Don't show button if trying to chat with yourself
  if (user?.id === otherUserId) return null;

  return (
    <Button variant={variant} size={size} onClick={handleClick} className={className}>
      <MessageCircle className="h-4 w-4 mr-2" />
      {t('chat.sendMessage')}
    </Button>
  );
}
