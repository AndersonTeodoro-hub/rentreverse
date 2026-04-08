import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Building2, CheckCircle, Share2, Gift, Users, Star, UserPlus, Search, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';

const Index = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-20 lg:py-28"
        style={{
          backgroundImage: "url('/hero-apartment.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-white/85 dark:bg-black/70" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column - Text */}
            <div className="text-center lg:text-left relative z-10">
              <h1 className="animate-fade-in text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-tight">
                {t('hero.title')}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-xl mx-auto lg:mx-0">
                {t('hero.subtitle')}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button size="lg" asChild className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
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
              <div className="mt-6 flex justify-center lg:justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: t('common.appName'),
                        text: t('common.tagline'),
                        url: window.location.origin,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  {t('hero.shareApp')}
                </Button>
              </div>
            </div>

            {/* Right column - person + phone mockup */}
            <div className="hidden lg:block relative h-[600px]">
              <img
                src="/hero-person.png"
                alt=""
                loading="lazy"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 max-h-[580px] w-auto object-contain"
              />
              <video
                src="/hero-phone.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute top-0 right-0 w-56 rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-section-alt">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* For Tenants */}
            <div className="rounded-2xl border border-border bg-card p-8 card-shadow-premium hover-lift">
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
            <div className="rounded-2xl border border-border bg-card p-8 card-shadow-premium hover-lift">
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

      {/* How It Works Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {[
              { num: 1, Icon: UserPlus, key: 'step1' },
              { num: 2, Icon: Search, key: 'step2' },
              { num: 3, Icon: Handshake, key: 'step3' },
            ].map(({ num, Icon, key }) => (
              <div
                key={key}
                className="relative rounded-2xl border border-border bg-card p-8 card-shadow-premium hover-lift"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-4xl font-bold text-primary/30">{num}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {t(`howItWorks.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`howItWorks.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section className="py-20 lg:py-28 bg-premium-gradient">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-primary/15 bg-card p-8 lg:p-12 card-shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-success/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Gift className="h-8 w-8 text-primary" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                    {t('referral.badge')}
                  </span>
                </div>
                
                <h2 className="text-3xl font-bold text-foreground text-center sm:text-4xl">
                  {t('referral.title')}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground text-center max-w-2xl mx-auto">
                  {t('referral.subtitle')}
                </p>

                <div className="mt-10 grid gap-6 sm:grid-cols-3">
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 ring-1 ring-primary/10">
                      <Share2 className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{t('referral.step1.title')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('referral.step1.description')}</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 ring-1 ring-primary/10">
                      <Users className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{t('referral.step2.title')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('referral.step2.description')}</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-4 ring-1 ring-primary/10">
                      <Star className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{t('referral.step3.title')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('referral.step3.description')}</p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" asChild className="gap-2">
                    <Link to="/auth?mode=signup">
                      <Gift className="h-5 w-5" />
                      {t('referral.cta')}
                    </Link>
                  </Button>
                </div>
                
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {t('referral.terms')}
                </p>
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
