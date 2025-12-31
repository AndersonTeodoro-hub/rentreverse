import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Building2, Shield, Clock, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';

const Index = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 to-background py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="animate-fade-in text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {t('hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto gap-2">
                <Link to="/auth?mode=signup&role=tenant">
                  <Home className="h-5 w-5" />
                  {t('hero.forTenants')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto gap-2">
                <Link to="/auth?mode=signup&role=landlord">
                  <Building2 className="h-5 w-5" />
                  {t('hero.forLandlords')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* For Tenants */}
            <div className="rounded-2xl border border-border bg-card p-8 card-shadow">
              <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                {t('features.forTenants.title')}
              </h3>
              <div className="space-y-6">
                {['feature1', 'feature2', 'feature3'].map((key) => (
                  <div key={key} className="flex gap-4">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">
                        {t(`features.forTenants.${key}.title`)}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(`features.forTenants.${key}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Landlords */}
            <div className="rounded-2xl border border-border bg-card p-8 card-shadow">
              <h3 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {t('features.forLandlords.title')}
              </h3>
              <div className="space-y-6">
                {['feature1', 'feature2', 'feature3'].map((key) => (
                  <div key={key} className="flex gap-4">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground">
                        {t(`features.forLandlords.${key}.title`)}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(`features.forLandlords.${key}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{t('cta.getStarted')}</h2>
          <p className="mt-4 text-lg opacity-90">{t('common.tagline')}</p>
          <Button size="lg" variant="secondary" asChild className="mt-8 gap-2">
            <Link to="/auth?mode=signup">
              {t('cta.createAccount')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
