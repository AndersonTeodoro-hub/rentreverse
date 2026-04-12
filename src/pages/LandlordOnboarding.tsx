import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, User, Building, FileText } from "lucide-react";
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

const landlordFormSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Telefone deve estar no formato E.164 (ex: +351999999999)").or(z.literal("")),
  isCompany: z.boolean(),
  companyName: z.string(),
  taxId: z.string(),
  propertiesCount: z.string().refine(
    (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 1000),
    "Número de imóveis deve ser entre 1 e 1000"
  ),
}).refine((data) => !data.isCompany || data.taxId.trim().length > 0, {
  message: "NIF é obrigatório para empresas",
  path: ["taxId"],
});

interface LandlordFormData {
  fullName: string;
  phone: string;
  isCompany: boolean;
  companyName: string;
  taxId: string;
  propertiesCount: string;
}

const steps = [
  { icon: User, key: 'personal' },
  { icon: Building, key: 'business' },
  { icon: FileText, key: 'verification' },
];

const LandlordOnboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LandlordFormData>({
    fullName: '',
    phone: '',
    isCompany: false,
    companyName: '',
    taxId: '',
    propertiesCount: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
    if (!isLoading && userRole && userRole !== 'landlord') {
      navigate('/tenant/onboarding');
    }
  }, [user, userRole, isLoading, navigate]);

  const handleInputChange = (field: keyof LandlordFormData, value: string | boolean) => {
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

    const result = landlordFormSchema.safeParse(formData);
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

      // Create landlord profile
      const { error: landlordError } = await supabase
        .from('landlord_profiles')
        .insert({
          user_id: user.id,
          is_company: formData.isCompany,
          company_name: formData.companyName || null,
          tax_id: formData.taxId || null,
          properties_count: formData.propertiesCount ? parseInt(formData.propertiesCount) : 0,
        });

      if (landlordError) throw landlordError;

      toast({
        title: t('onboarding.complete'),
        description: t('onboarding.landlordCompleteDesc'),
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving landlord profile:', error);
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
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="isCompany">{t('onboarding.form.isCompany')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.form.isCompanyDesc')}
                </p>
              </div>
              <Switch
                id="isCompany"
                checked={formData.isCompany}
                onCheckedChange={(checked) => handleInputChange('isCompany', checked)}
              />
            </div>
            
            {formData.isCompany && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('onboarding.form.companyName')}</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder={t('onboarding.form.companyNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">{t('onboarding.form.taxId')}</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    placeholder="PT123456789"
                  />
                </div>
              </>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="propertiesCount">{t('onboarding.form.propertiesCount')}</Label>
              <Input
                id="propertiesCount"
                type="number"
                value={formData.propertiesCount}
                onChange={(e) => handleInputChange('propertiesCount', e.target.value)}
                placeholder="1"
                min="0"
              />
              <p className="text-sm text-muted-foreground">
                {t('onboarding.form.propertiesCountHint')}
              </p>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{t('onboarding.form.nextSteps')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {t('onboarding.form.nextStep1')}</li>
                <li>• {t('onboarding.form.nextStep2')}</li>
                <li>• {t('onboarding.form.nextStep3')}</li>
              </ul>
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
              <CardTitle>{t(`onboarding.landlordSteps.${steps[currentStep].key}.title`)}</CardTitle>
              <CardDescription>
                {t(`onboarding.landlordSteps.${steps[currentStep].key}.description`)}
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

export default LandlordOnboarding;
