import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Home, Building2, Share2, Users,
  UserPlus, Search, Handshake, Shield, FileText,
  Eye, Star, UserCheck, Clock, Sparkles, CheckCircle,
  ChevronDown, Quote, Database, Globe, Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout';

const Index = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'tenant' | 'landlord'>('tenant');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const testimonials = [
    {
      name: 'Maria',
      age: 34,
      origin: 'Brasileira em Lisboa',
      initials: 'M',
      color: 'bg-rose-500',
      text: 'Recebi 4 propostas em 2 dias. Nunca pensei que fosse tão fácil encontrar casa em Portugal.',
    },
    {
      name: 'Carlos',
      age: 28,
      origin: 'Angolano no Porto',
      initials: 'C',
      color: 'bg-blue-500',
      text: 'Todos me pediam fiador português. Aqui os proprietários é que me contactaram a mim.',
    },
    {
      name: 'Aisha',
      age: 31,
      origin: 'Cabo-Verdiana em Braga',
      initials: 'A',
      color: 'bg-amber-500',
      text: 'Assinei o contrato antes de aterrar. Cheguei com tudo tratado.',
    },
  ];

  const faqs = [
    {
      q: 'Preciso de fiador português?',
      a: 'Não. Os proprietários no RentReverse já aceitam inquilinos sem fiador local. O nosso sistema de verificação substitui essa necessidade.',
    },
    {
      q: 'Quanto tempo demora a encontrar casa?',
      a: 'A maioria dos inquilinos recebe as primeiras propostas em menos de 48 horas após criar o perfil.',
    },
    {
      q: 'Os meus documentos estrangeiros são aceites?',
      a: 'Sim. Aceitamos documentos de qualquer país. A verificação é feita automaticamente pela nossa IA.',
    },
    {
      q: 'É seguro partilhar os meus documentos?',
      a: 'Totalmente. Os seus documentos são encriptados e apenas partilhados com proprietários verificados que mostraram interesse no seu perfil.',
    },
    {
      q: 'Quanto custa?',
      a: 'O RentReverse é gratuito durante o período beta. Quando sair do beta, o modelo será baseado em sucesso — só paga se encontrar casa.',
    },
  ];

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
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                Pare de procurar.<br />
                <span className="text-primary">Comece a ser encontrado.</span>
              </h1>

              <p className="mt-6 text-lg text-white/80 sm:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Inquilinos recebem propostas. Proprietários encontram inquilinos verificados. Sem perder tempo.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 text-sm text-white/70">
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Sem fiador obrigatório</span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Propostas em 48h</span>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-primary" /> Proprietários verificados</span>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button asChild className="w-full sm:w-auto gap-2 h-14 px-8 text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                  <Link to="/auth?mode=signup&role=tenant">
                    <Home className="h-5 w-5" />
                    Quero receber propostas
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto gap-2 h-14 px-8 text-lg bg-transparent border-white/40 text-white hover:bg-white/10 hover:border-white/60">
                  <Link to="/auth?mode=signup&role=landlord">
                    <Building2 className="h-5 w-5" />
                    {t('hero.forLandlords')}
                  </Link>
                </Button>
              </div>

              <p className="mt-3 text-sm text-white/50 text-center lg:text-left">
                Grátis durante o beta. Sem cartão de crédito.
              </p>

              <div className="mt-4 flex justify-center lg:justify-start">
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

            <div className="hidden lg:flex flex-col gap-5 pl-8">
              {[
                { Icon: Shield, title: 'Verificação Automática', desc: 'Documentos verificados de forma segura e instantânea', delay: '0s' },
                { Icon: Users, title: 'Matching Personalizado', desc: 'Encontramos o inquilino ideal para o seu imóvel', delay: '0.15s' },
                { Icon: FileText, title: 'Contrato Automático', desc: 'Contrato gerado automaticamente com base na legislação local', delay: '0.3s' },
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
            <div className="hidden md:block absolute top-[4.5rem] left-[16%] right-[16%] border-t-2 border-dashed border-primary/20" />

            <div className="grid gap-8 md:grid-cols-3">
              {[
                { num: 1, Icon: UserPlus, key: 'step1' },
                { num: 2, Icon: Search, key: 'step2' },
                { num: 3, Icon: Handshake, key: 'step3' },
              ].map(({ num, Icon, key }) => (
                <div key={key} className="relative text-center">
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

      {/* ─── Testimonials ─── */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-medium mb-4">
              Histórias reais
            </span>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Imigrantes que já encontraram casa
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Sem fiador, sem stress, sem fraudes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-xl border border-border bg-card p-6 flex flex-col hover:shadow-md transition-shadow"
              >
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-foreground leading-relaxed flex-1">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-1 mt-4 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className={`h-10 w-10 rounded-full ${item.color} flex items-center justify-center text-white font-semibold text-sm`}>
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.name}, {item.age} anos</p>
                    <p className="text-xs text-muted-foreground">{item.origin}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features with tabs ─── */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('features.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('features.subtitle')}
            </p>
          </div>

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

          <div className="max-w-4xl mx-auto">
            <div
              key={activeTab}
              className="grid gap-6 sm:grid-cols-3 animate-fade-in"
            >
              {(activeTab === 'tenant'
                ? [
                    { key: 'feature1', Icon: Shield },
                    { key: 'feature2', Icon: Eye },
                    { key: 'feature3', Icon: Star },
                  ]
                : [
                    { key: 'feature1', Icon: UserCheck },
                    { key: 'feature2', Icon: Clock },
                    { key: 'feature3', Icon: Sparkles },
                  ]
              ).map(({ key, Icon }) => {
                const section = activeTab === 'tenant' ? 'forTenants' : 'forLandlords';
                return (
                  <div key={key} className="rounded-xl border border-border bg-card p-6 text-center hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-7 w-7 text-primary" />
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

      {/* ─── Trust Numbers ─── */}
      <section className="py-16 lg:py-20 bg-muted/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            {[
              { value: '4', label: 'idiomas suportados' },
              { value: '3', label: 'países cobertos' },
              { value: '100%', label: 'verificação automática' },
              { value: '0€', label: 'para começar' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-4xl font-bold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Technology Partners ─── */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container text-center">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Tecnologia de confiança
          </h3>
          <p className="text-xs text-muted-foreground mb-8">
            Infraestrutura segura e escalável
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Database className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">Supabase</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Globe className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">Vercel</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground/60">
              <Cpu className="h-5 w-5" />
              <span className="text-lg font-semibold tracking-tight">Google AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-16">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-sm font-medium mb-4">
              Perguntas frequentes
            </span>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Dúvidas de quem está a chegar
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 lg:py-24 bg-gradient-to-r from-[#1e3a5f] to-[#2563eb]">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            A sua casa em Portugal começa aqui.
          </h2>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            Junte-se a centenas de imigrantes que já encontraram casa sem stress.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="gap-2 bg-white text-[#1e3a5f] hover:bg-white/90 shadow-lg">
              <Link to="/auth?mode=signup&role=tenant">
                <Home className="h-5 w-5" />
                Criar perfil grátis
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
