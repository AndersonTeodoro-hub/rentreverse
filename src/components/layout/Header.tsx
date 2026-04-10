import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Bell, Heart, TrendingDown, MessageCircle, ShoppingBag, Users, User, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { useMatchNotifications } from '@/hooks/useMatchNotifications';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { t, ready } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const { unreadCount } = useNotificationCount();
  const { unreadCount: matchUnread } = useMatchNotifications();
  const totalUnread = unreadCount + matchUnread;
  const navigate = useNavigate();

  // Wait for translations to be ready (avoid rendering keys)
  if (!ready) return null;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const baseNavItems = [
    { to: '/', label: t('nav.home') },
    { to: '/explore-properties', label: t('nav.exploreProperties') },
    { to: '/how-it-works', label: t('nav.howItWorks') },
    { to: '/pricing', label: t('nav.pricing') },
    { to: '/services', label: t('nav.services'), icon: ShoppingBag },
  ];

  // Add "Browse Tenants" for landlords
  const navItems = userRole === 'landlord' 
    ? [
        ...baseNavItems.slice(0, 2),
        { to: '/browse-tenants', label: t('nav.browseTenants'), icon: Users },
        ...baseNavItems.slice(2)
      ]
    : baseNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card dark:bg-card/80 dark:backdrop-blur-xl dark:supports-[backdrop-filter]:bg-card/70 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_RentReverse.png" alt="RentReverse" className="h-8 w-8 rounded-lg" />
          <span className="font-semibold text-xl text-foreground">
            {t('common.appName')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              {'icon' in item && item.icon ? <item.icon className="h-4 w-4" /> : null}
              {item.label}
            </Link>
          ))}
        </nav>


        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <LanguageSelector />
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/messages')}
                aria-label={t('nav.messages')}
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/my-favorites')}
                aria-label={t('nav.favorites')}
              >
                <Heart className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/price-alerts')}
                aria-label={t('nav.priceAlerts')}
              >
                <TrendingDown className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5" />
                {totalUnread > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">{t('nav.dashboard')}</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm hover:opacity-90 transition-opacity">
                    {(user?.email?.[0] || '?').toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    {t('profile.title', 'O Meu Perfil')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/verifications')} className="gap-2 cursor-pointer">
                    <Shield className="h-4 w-4" />
                    {t('dashboard.verifications', 'Verificações')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate('/'); }} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4" />
                    {t('profile.signOut', 'Terminar sessão')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">{t('nav.login')}</Link>
              </Button>
              <Button asChild>
                <Link to="/auth?mode=signup">{t('nav.signup')}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate('/notifications')}
            >
              <Bell className="h-5 w-5" />
              {totalUnread > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {totalUnread > 9 ? '9+' : totalUnread}
                </Badge>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t('common.close') : t('common.view')}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 pb-2">
              <ThemeToggle />
              <LanguageSelector />
            </div>

            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-muted-foreground py-2 flex items-center gap-2"
                onClick={closeMobileMenu}
              >
                {'icon' in item && item.icon ? <item.icon className="h-4 w-4" /> : null}
                {item.label}
              </Link>
            ))}

            {user ? (
              <div className="flex flex-col gap-3 pt-3 border-t border-border">
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-muted-foreground py-1"
                  onClick={closeMobileMenu}
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-muted-foreground py-1"
                  onClick={closeMobileMenu}
                >
                  {t('profile.title', 'O Meu Perfil')}
                </Link>
                <Link
                  to="/messages"
                  className="text-sm font-medium text-muted-foreground py-1"
                  onClick={closeMobileMenu}
                >
                  {t('nav.messages')}
                </Link>
                <Link
                  to="/my-favorites"
                  className="text-sm font-medium text-muted-foreground py-1"
                  onClick={closeMobileMenu}
                >
                  {t('nav.favorites')}
                </Link>
                <Link
                  to="/price-alerts"
                  className="text-sm font-medium text-muted-foreground py-1"
                  onClick={closeMobileMenu}
                >
                  {t('nav.priceAlerts')}
                </Link>
                <Link
                  to="/my-offers"
                  className="text-sm font-medium text-muted-foreground py-1"
                  onClick={closeMobileMenu}
                >
                  {t('dashboard.myOffers')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth" onClick={closeMobileMenu}>
                    {t('nav.login')}
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/auth?mode=signup" onClick={closeMobileMenu}>
                    {t('nav.signup')}
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

    </header>
  );
}
