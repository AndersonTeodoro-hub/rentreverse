import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, User, MapPin, Home, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const tenantFormSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Telefone deve estar no formato E.164 (ex: +351999999999)").or(z.literal("")),
  profession: z.string(),
  monthlyIncome: z.string().refine((v) => v === "" || (Number(v) > 0 && isFinite(Number(v))), "Rendimento deve ser maior que 0"),
  maxBudget: z.string().refine((v) => v === "" || (Number(v) > 0 && isFinite(Number(v))), "Orçamento deve ser maior que 0"),
  moveInDate: z.string().refine((v) => v === "" || v >= new Date().toISOString().split("T")[0], "Data deve ser hoje ou no futuro"),
  preferredLocations: z.string(),
  hasPets: z.boolean(),
  isSmoker: z.boolean(),
});

interface TenantFormData {
  fullName: string;
  phone: string;
  profession: string;
  monthlyIncome: string;
  preferredLocations: string;
  maxBudget: string;
  moveInDate: string;
  hasPets: boolean;
  isSmoker: boolean;
}

const steps = [
  { icon: User, key: 'personal' },
  { icon: MapPin, key: 'location' },
  { icon: Home, key: 'preferences' },
  { icon: Heart, key: 'lifestyle' },
];

const TenantOnboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TenantFormData>({
    fullName: '',
    phone: '',
    profession: '',
    monthlyIncome: '',
    preferredLocations: '',
    maxBudget: '',
    moveInDate: '',
    hasPets: false,
    isSmoker: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
    if (!isLoading && userRole && userRole !== 'tenant') {
      navigate('/landlord/onboarding');
    }
  }, [user, userRole, isLoading, navigate]);

  const handleInputChange = (field: keyof TenantFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const result = tenantFormSchema.safeParse(formData);
    if (!result.success) {
      toast({
        title: t('common.error'),
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create tenant profile
      const { error: tenantError } = await supabase
        .from('tenant_profiles')
        .insert({
          user_id: user.id,
          profession: formData.profession,
          monthly_income: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null,
          preferred_locations: formData.preferredLocations ? formData.preferredLocations.split(',').map(s => s.trim()) : [],
          max_budget: formData.maxBudget ? parseFloat(formData.maxBudget) : null,
          move_in_date: formData.moveInDate || null,
          has_pets: formData.hasPets,
          is_smoker: formData.isSmoker,
        });

      if (tenantError) throw tenantError;

      toast({
        title: t('onboarding.complete'),
        description: t('onboarding.tenantCompleteDesc'),
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving tenant profile:', error);
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('onboarding.form.fullName')}</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder={t('onboarding.form.fullNamePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('onboarding.form.phone')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+351 999 999 999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">{t('onboarding.form.profession')}</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => handleInputChange('profession', e.target.value)}
                placeholder={t('onboarding.form.professionPlaceholder')}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="preferredLocations">{t('onboarding.form.preferredLocations')}</Label>
              <Input
                id="preferredLocations"
                value={formData.preferredLocations}
                onChange={(e) => handleInputChange('preferredLocations', e.target.value)}
                placeholder={t('onboarding.form.preferredLocationsPlaceholder')}
              />
              <p className="text-sm text-muted-foreground">
                {t('onboarding.form.preferredLocationsHint')}
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">{t('onboarding.form.monthlyIncome')}</Label>
              <Input
                id="monthlyIncome"
                type="number"
                value={formData.monthlyIncome}
                onChange={(e) => handleInputChange('monthlyIncome', e.target.value)}
                placeholder="2500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBudget">{t('onboarding.form.maxBudget')}</Label>
              <Input
                id="maxBudget"
                type="number"
                value={formData.maxBudget}
                onChange={(e) => handleInputChange('maxBudget', e.target.value)}
                placeholder="800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moveInDate">{t('onboarding.form.moveInDate')}</Label>
              <Input
                id="moveInDate"
                type="date"
                value={formData.moveInDate}
                onChange={(e) => handleInputChange('moveInDate', e.target.value)}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="hasPets">{t('onboarding.form.hasPets')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.form.hasPetsDesc')}
                </p>
              </div>
              <Switch
                id="hasPets"
                checked={formData.hasPets}
                onCheckedChange={(checked) => handleInputChange('hasPets', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isSmoker">{t('onboarding.form.isSmoker')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.form.isSmokerDesc')}
                </p>
              </div>
              <Switch
                id="isSmoker"
                checked={formData.isSmoker}
                onCheckedChange={(checked) => handleInputChange('isSmoker', checked)}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isActive 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 transition-colors ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t(`onboarding.steps.${steps[currentStep].key}.title`)}</CardTitle>
              <CardDescription>
                {t(`onboarding.steps.${steps[currentStep].key}.description`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('common.back')}
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext}>
                    {t('common.next')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <>
                        {t('onboarding.finish')}
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TenantOnboarding;
