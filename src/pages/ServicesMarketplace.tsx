import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Truck, Sparkles, Shield, Zap, Wifi, Flame, Star, ExternalLink, Tag, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type ServiceCategory = 'moving' | 'cleaning' | 'insurance' | 'utilities';

interface ServiceProvider {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  category: ServiceCategory;
  subcategory: string | null;
  affiliate_url: string;
  offer_title: string | null;
  offer_description: string | null;
  discount_percentage: number | null;
  featured: boolean;
  priority: number;
  rating: number;
  reviews_count: number;
}

const categoryConfig = {
  moving: {
    icon: Truck,
    label: 'Mudanças',
    description: 'Empresas de mudanças e transporte',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  cleaning: {
    icon: Sparkles,
    label: 'Limpeza',
    description: 'Limpeza profissional de casas',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  insurance: {
    icon: Shield,
    label: 'Seguros',
    description: 'Seguro de recheio habitacional',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  utilities: {
    icon: Zap,
    label: 'Utilities',
    description: 'Luz, água, gás, internet',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
};

const subcategoryIcons: Record<string, React.ElementType> = {
  electricity: Zap,
  internet: Wifi,
  gas: Flame,
};

export default function ServicesMarketplace() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('moving');

  const { data: providers, isLoading } = useQuery({
    queryKey: ['service-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('featured', { ascending: false })
        .order('priority', { ascending: false });

      if (error) throw error;
      return data as ServiceProvider[];
    },
  });

  const trackClick = async (provider: ServiceProvider) => {
    try {
      await supabase.from('service_clicks').insert({
        provider_id: provider.id,
        user_id: user?.id || null,
        source_page: window.location.pathname,
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }

    // Open affiliate link in new tab
    window.open(provider.affiliate_url, '_blank', 'noopener,noreferrer');
    toast.success(`A redirecionar para ${provider.name}...`);
  };

  const filteredProviders = providers?.filter(p => p.category === activeCategory) || [];
  const featuredProviders = providers?.filter(p => p.featured) || [];

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderProviderCard = (provider: ServiceProvider, featured = false) => {
    const config = categoryConfig[provider.category];
    const SubIcon = provider.subcategory ? subcategoryIcons[provider.subcategory] : null;

    return (
      <Card 
        key={provider.id} 
        className={`group cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
          featured ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : ''
        }`}
        onClick={() => trackClick(provider)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                {SubIcon ? (
                  <SubIcon className={`h-5 w-5 ${config.color}`} />
                ) : (
                  <config.icon className={`h-5 w-5 ${config.color}`} />
                )}
              </div>
              <div>
                <CardTitle className="text-base group-hover:text-primary transition-colors">
                  {provider.name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(provider.rating)}
                  <span className="text-xs text-muted-foreground">
                    ({provider.reviews_count})
                  </span>
                </div>
              </div>
            </div>
            {provider.featured && (
              <Badge variant="secondary" className="text-xs">
                Destaque
              </Badge>
            )}
          </div>
          {provider.description && (
            <CardDescription className="mt-2 text-sm">
              {provider.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {provider.offer_title && (
            <div className="rounded-lg bg-muted/50 p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{provider.offer_title}</span>
                {provider.discount_percentage && (
                  <Badge variant="destructive" className="text-xs">
                    -{provider.discount_percentage}%
                  </Badge>
                )}
              </div>
              {provider.offer_description && (
                <p className="text-xs text-muted-foreground">{provider.offer_description}</p>
              )}
            </div>
          )}
          
          <Button className="w-full group-hover:bg-primary" size="sm">
            Ver Oferta
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Marketplace de Serviços</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tudo o que precisa para a sua mudança: empresas de mudanças, limpeza profissional, seguros e contratos de utilities com descontos exclusivos.
          </p>
        </div>

        {/* Featured Section */}
        {featuredProviders.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-xl font-semibold">Ofertas em Destaque</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featuredProviders.slice(0, 4).map(provider => renderProviderCard(provider, true))}
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ServiceCategory)}>
          <TabsList className="grid w-full grid-cols-4">
            {(Object.keys(categoryConfig) as ServiceCategory[]).map((category) => {
              const config = categoryConfig[category];
              return (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(categoryConfig) as ServiceCategory[]).map((category) => {
            const config = categoryConfig[category];
            const categoryProviders = providers?.filter(p => p.category === category) || [];
            
            return (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                    {config.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>

                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-10 bg-muted rounded" />
                        </CardHeader>
                        <CardContent>
                          <div className="h-20 bg-muted rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : categoryProviders.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryProviders.map(provider => renderProviderCard(provider))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <config.icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="font-semibold mb-2">Sem parceiros disponíveis</h3>
                      <p className="text-sm text-muted-foreground">
                        Estamos a trabalhar para adicionar parceiros nesta categoria.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Utilities Subcategories */}
                {category === 'utilities' && categoryProviders.length > 0 && (
                  <div className="mt-8 space-y-6">
                    {['electricity', 'internet', 'gas'].map((subcategory) => {
                      const subProviders = categoryProviders.filter(p => p.subcategory === subcategory);
                      if (subProviders.length === 0) return null;
                      
                      const labels: Record<string, string> = {
                        electricity: 'Eletricidade',
                        internet: 'Internet & TV',
                        gas: 'Gás Natural',
                      };
                      const SubIcon = subcategoryIcons[subcategory] || Zap;
                      
                      return (
                        <div key={subcategory}>
                          <h3 className="font-medium mb-3 flex items-center gap-2 text-muted-foreground">
                            <SubIcon className="h-4 w-4" />
                            {labels[subcategory]}
                          </h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {subProviders.map(provider => renderProviderCard(provider))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Info Banner */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="p-3 rounded-full bg-primary/20">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Descontos Exclusivos RentReverse</h3>
                <p className="text-sm text-muted-foreground">
                  Todos os nossos parceiros oferecem condições especiais para utilizadores da plataforma. 
                  Aproveite os descontos na sua próxima mudança!
                </p>
              </div>
              <Button variant="outline" className="shrink-0">
                Como funciona
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
