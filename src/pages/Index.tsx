import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Home, Building2, CheckCircle, Share2, Gift, Users,
  Star, UserPlus, Search, Handshake, Shield, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';

const Index = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tenant' | 'landlord'>('tenant');

  return (
    <Layout>
      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden py-24 lg:py-32"
        style={{
          backgroundImage: "url('/hero-apartment.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Gradient overlay — darker left, fades right */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                {t('hero.title').split(' ').map((word, i, arr) =>
                  i === Math.floor(arr.length / 2) ? (
                    <span key={i}>
                      <span className="text-primary">{word}</span>{' '}
                    </span>
                  ) : (
                    <span key={i}>{word} </span>
                  )
                )}
              </h1>

              <p className="mt-6 text-lg text-white/80 sm:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('hero.subtitle')}
              </p>

              {/* Micro-stats */}
              <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 text-sm text-white/70">
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> 4 idiomas</span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Portugal & Espanha</span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Verificação por IA</span>
              </div>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button asChild className="w-full sm:w-auto gap-2 h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                  <Link to="/auth?mode=signup&role=tenant">
                    <Home className="h-5 w-5" />
                    {t('hero.forTenants')}
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto gap-2 h-14 px-8 text-lg bg-transparent border-white/40 text-white hover:bg-white/10 hover:border-white/60">
                  <Link to="/auth?mode=signup&role=landlord">
                    <Building2 className="h-5 w-5" />
                    {t('hero.forLandlords')}
                  </Link>
                </Button>
              </div>

              <div className="mt-5 flex justify-center lg:justify-start">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
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

            {/* Right — Glass cards */}
            <div className="hidden lg:flex flex-col gap-5 pl-8">
              {[
                { Icon: Shield, title: 'Verificação por IA', desc: 'Documentos verificados em segundos', delay: '0s' },
                { Icon: Users, title: 'Matching Inteligente', desc: 'A IA encontra o inquilino ideal', delay: '0.15s' },
                { Icon: FileText, title: 'Contrato Automático', desc: 'Gerado com base nas leis locais', delay: '0.3s' },
              ].map(({ Icon, title, desc, delay }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 animate-fade-in"
                  style={{ animationDelay: delay, animationFillMode: 'both' }}
                >
                  <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="text-sm text-white/70">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-medium mb-4">
              {t('howItWorks.title')}
            </span>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('howItWorks.subtitle')}
            </h2>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Dashed connector line */}
            <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] border-t-2 border-dashed border-primary/20" />

            <div className="grid gap-8 md:grid-cols-3">
              {[
                { num: 1, Icon: UserPlus, key: 'step1' },
                { num: 2, Icon: Search, key: 'step2' },
                { num: 3, Icon: Handshake, key: 'step3' },
              ].map(({ num, Icon, key }) => (
                <div key={key} className="relative text-center">
                  {/* Background number */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <span className="absolute text-7xl font-bold text-primary/[0.07] select-none">{num}</span>
                    <div className="relative w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t(`howItWorks.${key}.title`)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {t(`howItWorks.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features with tabs ─── */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-xl bg-muted p-1 gap-1">
              <button
                onClick={() => setActiveTab('tenant')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'tenant'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Home className="h-4 w-4" />
                {t('features.forTenants.title')}
              </button>
              <button
                onClick={() => setActiveTab('landlord')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'landlord'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building2 className="h-4 w-4" />
                {t('features.forLandlords.title')}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="max-w-4xl mx-auto">
            <div
              key={activeTab}
              className="grid gap-6 sm:grid-cols-3 animate-fade-in"
            >
              {['feature1', 'feature2', 'feature3'].map((key) => {
                const section = activeTab === 'tenant' ? 'forTenants' : 'forLandlords';
                return (
                  <div key={key} className="rounded-xl border border-border bg-card p-6 text-center hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-7 w-7 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">
                      {t(`features.${section}.${key}.title`)}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(`features.${section}.${key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Referral Program ─── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-3xl border border-border bg-card p-8 lg:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/8 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/8 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

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
                  {[
                    { Icon: Share2, key: 'step1' },
                    { Icon: Users, key: 'step2' },
                    { Icon: Star, key: 'step3' },
                  ].map(({ Icon, key }) => (
                    <div key={key} className="flex flex-col items-center text-center p-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{t(`referral.${key}.title`)}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{t(`referral.${key}.description`)}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex justify-center">
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

      {/* ─── Final CTA ─── */}
      <section className="py-20 lg:py-24 bg-gradient-to-r from-[#1e3a5f] to-[#2563eb]">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t('cta.getStarted')}
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            {t('common.tagline')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="gap-2 bg-white text-[#1e3a5f] hover:bg-white/90 shadow-lg">
              <Link to="/auth?mode=signup&role=tenant">
                <Home className="h-5 w-5" />
                {t('hero.forTenants')}
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 border-white/40 text-white hover:bg-white/10">
              <Link to="/auth?mode=signup&role=landlord">
                <Building2 className="h-5 w-5" />
                {t('hero.forLandlords')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
