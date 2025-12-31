import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TrendingDown, TrendingUp, Bell, Check, Trash2, Home } from 'lucide-react';
import { Layout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { usePriceNotifications } from '@/hooks/usePriceNotifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS, es, fr } from 'date-fns/locale';

const locales: Record<string, typeof pt> = { pt, en: enUS, es, fr };

export default function PriceAlerts() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = usePriceNotifications();

  const locale = locales[i18n.language] || enUS;

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('priceAlerts.loginRequired')}</h1>
          <p className="text-muted-foreground mb-6">{t('priceAlerts.loginRequiredDesc')}</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('priceAlerts.title')}</h1>
            <p className="text-muted-foreground">{t('priceAlerts.subtitle')}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead()}>
              <Check className="h-4 w-4 mr-2" />
              {t('priceAlerts.markAllRead')}
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('priceAlerts.empty')}</h3>
            <p className="text-muted-foreground mb-4">{t('priceAlerts.emptyDesc')}</p>
            <Button asChild>
              <Link to="/my-favorites">{t('priceAlerts.viewFavorites')}</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const priceChange = notification.new_price - notification.old_price;
              const isDecrease = priceChange < 0;
              const percentChange = Math.abs((priceChange / notification.old_price) * 100).toFixed(1);

              return (
                <Card
                  key={notification.id}
                  className={`transition-colors ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Property Image */}
                      <Link to={`/property/${notification.property_id}`} className="shrink-0">
                        <div className="h-16 w-16 rounded bg-muted overflow-hidden">
                          {notification.property?.images?.[0] ? (
                            <img
                              src={notification.property.images[0]}
                              alt={notification.property.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Home className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              to={`/property/${notification.property_id}`}
                              className="font-semibold hover:underline line-clamp-1"
                            >
                              {notification.property?.title || t('priceAlerts.unknownProperty')}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {notification.property?.city}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="shrink-0">
                              {t('priceAlerts.new')}
                            </Badge>
                          )}
                        </div>

                        {/* Price Change */}
                        <div className="flex items-center gap-2 mt-2">
                          {isDecrease ? (
                            <TrendingDown className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingUp className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-sm">
                            <span className="line-through text-muted-foreground">
                              €{notification.old_price}
                            </span>
                            {' → '}
                            <span className={`font-semibold ${isDecrease ? 'text-green-600' : 'text-red-600'}`}>
                              €{notification.new_price}
                            </span>
                            <span className={`ml-2 text-xs ${isDecrease ? 'text-green-600' : 'text-red-600'}`}>
                              ({isDecrease ? '-' : '+'}
                              {percentChange}%)
                            </span>
                          </span>
                        </div>

                        {/* Time and Actions */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale,
                            })}
                          </span>
                          <div className="flex gap-2">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
