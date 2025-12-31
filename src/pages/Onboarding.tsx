import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading, refreshRole } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'tenant' | 'landlord' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
    
    // If user already has a role, redirect to appropriate dashboard
    if (!isLoading && userRole) {
      navigate(userRole === 'tenant' ? '/tenant/onboarding' : '/landlord/onboarding');
    }
  }, [user, userRole, isLoading, navigate]);

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: selectedRole
        });

      if (error) throw error;

      await refreshRole();
      
      toast({
        title: t('onboarding.success'),
        description: t('onboarding.roleSelected'),
      });

      navigate(selectedRole === 'tenant' ? '/tenant/onboarding' : '/landlord/onboarding');
    } catch (error: any) {
      console.error('Error setting role:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              {t('onboarding.welcome')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('onboarding.chooseRole')}
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Tenant Card */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedRole === 'tenant' 
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                  : 'hover:scale-[1.01]'
              }`}
              onClick={() => setSelectedRole('tenant')}
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  selectedRole === 'tenant' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  <Home className="w-10 h-10" />
                </div>
                <CardTitle className="text-2xl">{t('onboarding.tenant.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('onboarding.tenant.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        {t(`onboarding.tenant.benefit${i}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Landlord Card */}
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedRole === 'landlord' 
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                  : 'hover:scale-[1.01]'
              }`}
              onClick={() => setSelectedRole('landlord')}
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  selectedRole === 'landlord' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  <Building2 className="w-10 h-10" />
                </div>
                <CardTitle className="text-2xl">{t('onboarding.landlord.title')}</CardTitle>
                <CardDescription className="text-base">
                  {t('onboarding.landlord.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        {t(`onboarding.landlord.benefit${i}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              size="lg"
              className="px-12"
              disabled={!selectedRole || isSubmitting}
              onClick={handleRoleSelection}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  {t('onboarding.continue')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Onboarding;
