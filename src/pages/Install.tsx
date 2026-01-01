import { Layout } from '@/components/layout';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { usePWA } from '@/hooks/usePWA';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Bell, 
  Wifi, 
  Zap, 
  Heart, 
  Shield,
  CheckCircle,
  Star
} from 'lucide-react';

const Install = () => {
  const { isInstalled, isStandalone } = usePWA();

  const features = [
    {
      icon: <Bell className="h-6 w-6" />,
      title: 'Notificações Push',
      description: 'Receba alertas instantâneos de novas ofertas e mensagens',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    },
    {
      icon: <Wifi className="h-6 w-6" />,
      title: 'Acesso Offline',
      description: 'Veja os seus favoritos mesmo sem internet',
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Carregamento Rápido',
      description: 'Experiência nativa sem esperas',
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: 'Favoritos Sincronizados',
      description: 'Aceda aos seus imóveis guardados em qualquer dispositivo',
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Seguro & Privado',
      description: 'Os seus dados protegidos no seu dispositivo',
      color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: 'Ecrã Inicial',
      description: 'Acesso direto como qualquer app nativa',
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isInstalled || isStandalone ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500 inline mr-2" />
                  App Instalada!
                </>
              ) : (
                'Instale a App RentReverse'
              )}
            </h1>
            <p className="text-muted-foreground">
              {isInstalled || isStandalone 
                ? 'Está a usar a versão instalada da aplicação'
                : 'Tenha a melhor experiência mobile com a nossa app'
              }
            </p>
          </div>

          {/* Install Prompt */}
          {!isInstalled && !isStandalone && (
            <PWAInstallPrompt variant="card" />
          )}

          {/* Features Grid */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Funcionalidades da App
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-medium">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">3-5x</div>
                  <div className="text-sm text-muted-foreground">Mais engagement</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">50%</div>
                  <div className="text-sm text-muted-foreground">Mais rápido</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Grátis</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Install;
