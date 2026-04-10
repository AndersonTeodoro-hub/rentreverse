import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home, Building2, Settings, LogOut, Share2, Shield,
  Users, FileText, Send, ScrollText, Bell, MessageCircle,
  Search, Copy, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading, signOut } = useAuth();
  const { toast } = useToast();

  const { data: pointsData } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: referralData } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: trustScore } = useQuery({
    queryKey: ['trust-score', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('trust_scores')
        .select('total_score')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
    if (!isLoading && user && !userRole) {
      navigate('/onboarding');
    }
  }, [user, userRole, isLoading, navigate]);

  const handleCopyReferral = async () => {
    if (!referralData?.code) return;
    const shareUrl = `${window.location.origin}?ref=${referralData.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'RentReverse', text: t('dashboard.shareText'), url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: t('common.copied'), description: t('dashboard.linkCopied') });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="space-y-4 w-full max-w-md px-4">
            <div className="h-8 bg-muted animate-pulse rounded-lg w-2/3" />
            <div className="h-4 bg-muted animate-pulse rounded-lg w-1/3" />
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const displayName = profileData?.full_name || 'Utilizador';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const availablePoints = (pointsData?.total_points || 0) - (pointsData?.used_points || 0);
  const score = trustScore?.total_score || 0;

  const tenantActions = [
    { icon: FileText, title: t('dashboard.myRequests'), desc: 'Gerir os seus pedidos de arrendamento', to: '/my-requests' },
    { icon: Search, title: t('dashboard.exploreProperties', 'Explorar Imóveis'), desc: 'Ver imóveis disponíveis', to: '/explore-properties' },
    { icon: Send, title: t('dashboard.myOffers'), desc: 'Ofertas recebidas de proprietários', to: '/my-offers' },
    { icon: Shield, title: t('dashboard.verifications', 'Verificações'), desc: 'Verificar documentos e aumentar Trust Score', to: '/verifications' },
    { icon: Bell, title: t('dashboard.notifications', 'Notificações'), desc: 'Ver matches e alertas', to: '/notifications' },
    { icon: MessageCircle, title: t('dashboard.messages', 'Mensagens'), desc: 'Conversas com proprietários', to: '/messages' },
  ];

  const landlordActions = [
    { icon: Building2, title: t('dashboard.myProperties'), desc: 'Gerir e adicionar imóveis', to: '/my-properties' },
    { icon: Users, title: t('dashboard.browseTenants'), desc: 'Ver inquilinos verificados', to: '/browse-tenants' },
    { icon: Send, title: t('dashboard.myOffers'), desc: 'Ofertas enviadas a inquilinos', to: '/my-offers' },
    { icon: ScrollText, title: t('contracts.title'), desc: 'Gerir contratos activos', to: '/contracts' },
    { icon: Bell, title: t('dashboard.notifications', 'Notificações'), desc: 'Ver matches e alertas', to: '/notifications' },
    { icon: MessageCircle, title: t('dashboard.messages', 'Mensagens'), desc: 'Conversas com inquilinos', to: '/messages' },
  ];

  const actions = userRole === 'tenant' ? tenantActions : landlordActions;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="max-w-5xl mx-auto py-8 px-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('dashboard.welcome')}, {displayName}!
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                {userRole === 'tenant' ? <Home className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                {userRole === 'tenant' ? t('dashboard.tenantAccount') : t('dashboard.landlordAccount')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
                {initials}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trust Score */}
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200/50 dark:border-blue-800/50"
              onClick={() => navigate('/verifications')}
            >
              <CardContent className="py-6 px-6">
                <p className="text-sm text-muted-foreground mb-1">Trust Score</p>
                <div className="text-4xl font-bold text-primary">{score}</div>
                <p className="text-sm text-primary mt-2 flex items-center gap-1">
                  {t('dashboard.verifyProfile')} <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </CardContent>
            </Card>

            {/* Points */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200/50 dark:border-emerald-800/50">
              <CardContent className="py-6 px-6">
                <p className="text-sm text-muted-foreground mb-1">{t('dashboard.yourPoints')}</p>
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{availablePoints}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('dashboard.pointsEquivalent', { months: Math.floor(availablePoints / 500) })}
                </p>
              </CardContent>
            </Card>

            {/* Referral Code */}
            <Card className="border">
              <CardContent className="py-6 px-6">
                <p className="text-sm text-muted-foreground mb-1">{t('dashboard.yourReferralCode')}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-xl font-bold tracking-widest text-foreground">
                    {referralData?.code || '--------'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={handleCopyReferral}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('dashboard.shareCode')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('dashboard.shareText', 'Partilha e ganha pontos')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('dashboard.quickActions')}</h2>
            <p className="text-sm text-muted-foreground mb-4">Escolha uma acção para continuar</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {actions.map(({ icon: Icon, title, desc, to }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card py-5 px-6 hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
