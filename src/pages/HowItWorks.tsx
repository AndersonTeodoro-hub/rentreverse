import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout';
import { 
  Search, 
  FileText, 
  Shield, 
  MessageSquare, 
  Key, 
  CheckCircle,
  Users,
  Home,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const { t } = useTranslation();

  const tenantSteps = [
    {
      icon: FileText,
      title: t('howItWorks.tenant.step1.title'),
      description: t('howItWorks.tenant.step1.description'),
    },
    {
      icon: Shield,
      title: t('howItWorks.tenant.step2.title'),
      description: t('howItWorks.tenant.step2.description'),
    },
    {
      icon: MessageSquare,
      title: t('howItWorks.tenant.step3.title'),
      description: t('howItWorks.tenant.step3.description'),
    },
    {
      icon: Key,
      title: t('howItWorks.tenant.step4.title'),
      description: t('howItWorks.tenant.step4.description'),
    },
  ];

  const landlordSteps = [
    {
      icon: Search,
      title: t('howItWorks.landlord.step1.title'),
      description: t('howItWorks.landlord.step1.description'),
    },
    {
      icon: CheckCircle,
      title: t('howItWorks.landlord.step2.title'),
      description: t('howItWorks.landlord.step2.description'),
    },
    {
      icon: MessageSquare,
      title: t('howItWorks.landlord.step3.title'),
      description: t('howItWorks.landlord.step3.description'),
    },
    {
      icon: Key,
      title: t('howItWorks.landlord.step4.title'),
      description: t('howItWorks.landlord.step4.description'),
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('howItWorks.hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('howItWorks.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Tenant Flow */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {t('howItWorks.tenant.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('howItWorks.tenant.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {tenantSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < tenantSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Landlord Flow */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {t('howItWorks.landlord.title')}
              </h2>
              <p className="text-muted-foreground">
                {t('howItWorks.landlord.subtitle')}
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {landlordSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < landlordSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {t('howItWorks.cta.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {t('howItWorks.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">{t('howItWorks.cta.getStarted')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">{t('howItWorks.cta.seePricing')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}