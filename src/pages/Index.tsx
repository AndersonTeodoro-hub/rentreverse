import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Building2, CheckCircle, Share2, Gift, Users, Star, UserPlus, Search, Handshake, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';

const Index = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-background dark:to-muted py-20 lg:py-28">
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left column - Text */}
            <div className="text-center lg:text-left">
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

            {/* Right column - Phone mockup */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-sm rotate-2 transition-transform hover:rotate-0 duration-500">
                {/* Phone mockup */}
                <div className="rounded-[2.5rem] bg-gradient-to-br from-[#1e3a5f] via-[#1e40af] to-[#2563eb] p-5 shadow-2xl ring-1 ring-black/5">
                  {/* Top bar */}
                  <div className="flex items-center gap-2 px-2 pb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#1e3a5f] font-bold text-sm">
                      R
                    </div>
                    <span className="font-semibold text-white text-sm">RentReverse</span>
                  </div>

                  {/* Property card */}
                  <div className="rounded-2xl bg-white p-4 shadow-lg">
                    <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 mb-3 flex items-center justify-center">
                      <Home className="h-12 w-12 text-slate-300" />
                    </div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 text-sm leading-tight">T2 Luminoso em Lisboa</h3>
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium px-2 py-0.5">
                        <CheckCircle className="h-3 w-3" />
                        Verificado
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-slate-900">€850<span className="text-xs font-normal text-slate-500">/mês</span></span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Proposal card */}
                  <div className="mt-3 rounded-2xl bg-white p-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">Proposta recebida!</div>
                        <div className="text-xs text-slate-500 truncate">João Silva quer arrendar</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badge - top right */}
                <div className="absolute -top-4 -right-6 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 -rotate-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e3a5f]">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-tight">2.500+</div>
                      <div className="text-[10px] text-slate-500">verificados</div>
                    </div>
                  </div>
                </div>

                {/* Floating badge - bottom left */}
                <div className="absolute -bottom-4 -left-6 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 -rotate-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="86.7 94.2" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-900">92</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 leading-tight">Trust Score</div>
                      <div className="text-[10px] text-slate-500">Excelente</div>
                    </div>
                  </div>
                </div>
              </div>
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
