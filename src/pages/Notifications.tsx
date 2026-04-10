import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Bell, Home, UserSearch, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';

function scoreColor(score: number | null) {
  if (!score) return 'bg-muted text-muted-foreground';
  if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useMatchNotifications();

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('common.loginRequired')}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t('notifications.title', 'Notificações')}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} {t('notifications.unread', 'não lida(s)')}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              {t('notifications.markAllRead', 'Marcar todas como lidas')}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t('notifications.empty', 'Sem notificações')}</p>
            <p className="text-muted-foreground mt-1">
              {t('notifications.emptyDesc', 'Quando houver matches entre propriedades e pedidos, aparecerão aqui.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                  !n.read ? 'bg-primary/5 border-primary/20' : ''
                }`}
                onClick={() => {
                  if (!n.read) markAsRead(n.id);
                  if (n.type === 'property_match' && n.property_id) {
                    navigate(`/property/${n.property_id}`);
                  } else if (n.type === 'tenant_match') {
                    navigate('/browse-tenants');
                  }
                }}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={`shrink-0 p-2 rounded-full ${
                    n.type === 'property_match'
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                  }`}>
                    {n.type === 'property_match' ? (
                      <Home className="h-5 w-5" />
                    ) : (
                      <UserSearch className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'font-semibold' : ''}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {n.match_score != null && (
                        <Badge variant="secondary" className={`text-xs ${scoreColor(n.match_score)}`}>
                          {n.match_score}%
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 self-center">
                    {!n.read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                    <ExternalLink className="h-4 w-4 text-muted-foreground mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
