import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Building2, Gift, Settings, LogOut, Share2, Shield, Users, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import TrustScoreBadge from "@/components/TrustScoreBadge";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading, signOut } = useAuth();
  const { toast } = useToast();

  // Fetch user points
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

  // Fetch referral code
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

  // Fetch referrals count
  const { data: referralsData } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch profile
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

  // Fetch trust score
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

  const handleShare = async () => {
    if (!referralData?.code) return;
    
    const shareUrl = `${window.location.origin}?ref=${referralData.code}`;
    const shareText = t('dashboard.shareText');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RentReverse',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('common.copied'),
        description: t('dashboard.linkCopied'),
      });
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const availablePoints = (pointsData?.total_points || 0) - (pointsData?.used_points || 0);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                {t('dashboard.welcome')}, {profileData?.full_name || user?.email?.split('@')[0]}!
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                {userRole === 'tenant' ? (
                  <>
                    <Home className="w-4 h-4" />
                    {t('dashboard.tenantAccount')}
                  </>
                ) : (
                  <>
                    <Building2 className="w-4 h-4" />
                    {t('dashboard.landlordAccount')}
                  </>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {/* Trust Score Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/verifications')}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Trust Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TrustScoreBadge score={trustScore?.total_score || 0} size="lg" />
                <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                  {t('dashboard.verifyProfile')} →
                </Button>
              </CardContent>
            </Card>

            {/* Points Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  {t('dashboard.yourPoints')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{availablePoints}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('dashboard.pointsEquivalent', { months: Math.floor(availablePoints / 500) })}
                </p>
              </CardContent>
            </Card>

            {/* Referral Code Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  {t('dashboard.yourReferralCode')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono font-bold tracking-wider">
                  {referralData?.code || '--------'}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleShare}
                >
                  {t('dashboard.shareCode')}
                </Button>
              </CardContent>
            </Card>

            {/* Referrals Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t('dashboard.referrals')}</CardTitle>
                <CardDescription>{t('dashboard.referralsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{referralsData?.length || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('dashboard.completedReferrals', { 
                    count: referralsData?.filter(r => r.status === 'completed').length || 0 
                  })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickActions')}</CardTitle>
              <CardDescription>
                {userRole === 'tenant' 
                  ? t('dashboard.tenantQuickActionsDesc')
                  : t('dashboard.landlordQuickActionsDesc')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                {userRole === 'tenant' ? (
                  <>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => navigate('/my-requests')}
                    >
                      <FileText className="w-6 h-6" />
                      <span>{t('dashboard.myRequests')}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => navigate('/my-offers')}
                    >
                      <Send className="w-6 h-6" />
                      <span>{t('dashboard.myOffers')}</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Gift className="w-6 h-6" />
                      <span>{t('dashboard.redeemPoints')}</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Settings className="w-6 h-6" />
                      <span>{t('dashboard.editProfile')}</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => navigate('/my-properties')}
                    >
                      <Building2 className="w-6 h-6" />
                      <span>{t('dashboard.myProperties')}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => navigate('/browse-tenants')}
                    >
                      <Users className="w-6 h-6" />
                      <span>{t('dashboard.browseTenants')}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => navigate('/my-offers')}
                    >
                      <Send className="w-6 h-6" />
                      <span>{t('dashboard.myOffers')}</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                      <Settings className="w-6 h-6" />
                      <span>{t('dashboard.editProfile')}</span>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
