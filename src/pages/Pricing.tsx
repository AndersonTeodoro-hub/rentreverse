import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Pricing() {
  const { t } = useTranslation();

  const tenantPlans = [
    {
      name: t('pricing.tenant.free.name'),
      price: '€0',
      period: t('pricing.period.forever'),
      description: t('pricing.tenant.free.description'),
      features: [
        { included: true, text: t('pricing.tenant.free.feature1') },
        { included: true, text: t('pricing.tenant.free.feature2') },
        { included: true, text: t('pricing.tenant.free.feature3') },
        { included: false, text: t('pricing.tenant.free.feature4') },
        { included: false, text: t('pricing.tenant.free.feature5') },
      ],
      cta: t('pricing.cta.getStarted'),
      popular: false,
    },
    {
      name: t('pricing.tenant.premium.name'),
      price: '€9.90',
      period: t('pricing.period.month'),
      description: t('pricing.tenant.premium.description'),
      features: [
        { included: true, text: t('pricing.tenant.premium.feature1') },
        { included: true, text: t('pricing.tenant.premium.feature2') },
        { included: true, text: t('pricing.tenant.premium.feature3') },
        { included: true, text: t('pricing.tenant.premium.feature4') },
        { included: true, text: t('pricing.tenant.premium.feature5') },
      ],
      cta: t('pricing.cta.upgrade'),
      popular: true,
    },
  ];

  const landlordPlans = [
    {
      name: t('pricing.landlord.free.name'),
      price: '€0',
      period: t('pricing.period.forever'),
      description: t('pricing.landlord.free.description'),
      features: [
        { included: true, text: t('pricing.landlord.free.feature1') },
        { included: true, text: t('pricing.landlord.free.feature2') },
        { included: true, text: t('pricing.landlord.free.feature3') },
        { included: false, text: t('pricing.landlord.free.feature4') },
        { included: false, text: t('pricing.landlord.free.feature5') },
      ],
      cta: t('pricing.cta.getStarted'),
      popular: false,
    },
    {
      name: t('pricing.landlord.pro.name'),
      price: '€29',
      period: t('pricing.period.month'),
      description: t('pricing.landlord.pro.description'),
      features: [
        { included: true, text: t('pricing.landlord.pro.feature1') },
        { included: true, text: t('pricing.landlord.pro.feature2') },
        { included: true, text: t('pricing.landlord.pro.feature3') },
        { included: true, text: t('pricing.landlord.pro.feature4') },
        { included: true, text: t('pricing.landlord.pro.feature5') },
      ],
      cta: t('pricing.cta.upgrade'),
      popular: true,
    },
    {
      name: t('pricing.landlord.business.name'),
      price: '€99',
      period: t('pricing.period.month'),
      description: t('pricing.landlord.business.description'),
      features: [
        { included: true, text: t('pricing.landlord.business.feature1') },
        { included: true, text: t('pricing.landlord.business.feature2') },
        { included: true, text: t('pricing.landlord.business.feature3') },
        { included: true, text: t('pricing.landlord.business.feature4') },
        { included: true, text: t('pricing.landlord.business.feature5') },
      ],
      cta: t('pricing.cta.contact'),
      popular: false,
    },
  ];

  const PlanCard = ({ plan, className }: { plan: typeof tenantPlans[0]; className?: string }) => (
    <div
      className={cn(
        'relative flex flex-col p-6 rounded-xl border bg-card',
        plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border',
        className
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
          {t('pricing.popular')}
        </div>
      )}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-foreground">{plan.price}</span>
          <span className="text-muted-foreground">/{plan.period}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
      </div>
      <ul className="space-y-3 mb-6 flex-1">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            {feature.included ? (
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
            )}
            <span className={cn('text-sm', feature.included ? 'text-foreground' : 'text-muted-foreground')}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
      <Button variant={plan.popular ? 'default' : 'outline'} className="w-full" asChild>
        <Link to="/auth?mode=signup">{plan.cta}</Link>
      </Button>
    </div>
  );

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {t('pricing.hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Tenant Plans */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('pricing.tenant.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('pricing.tenant.subtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
            {tenantPlans.map((plan, index) => (
              <PlanCard key={index} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Landlord Plans */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('pricing.landlord.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('pricing.landlord.subtitle')}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {landlordPlans.map((plan, index) => (
              <PlanCard key={index} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('pricing.faq.sectionTitle')}
            </h2>
            <p className="text-muted-foreground">
              {t('pricing.faq.sectionSubtitle')}
            </p>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="trust-score" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                {t('pricing.faq.questions.trustScore')}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t('pricing.faq.answers.trustScore')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="cancel" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                {t('pricing.faq.questions.cancel')}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t('pricing.faq.answers.cancel')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="free-plan" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                {t('pricing.faq.questions.freePlan')}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t('pricing.faq.answers.freePlan')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="verification" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                {t('pricing.faq.questions.verification')}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t('pricing.faq.answers.verification')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="time" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                {t('pricing.faq.questions.time')}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t('pricing.faq.answers.time')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="change-plan" className="border rounded-lg px-6">
              <AccordionTrigger className="text-left">
                {t('pricing.faq.questions.changePlan')}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t('pricing.faq.answers.changePlan')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </Layout>
  );
}