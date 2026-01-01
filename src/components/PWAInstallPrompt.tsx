import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Download, Smartphone, Wifi, Bell, Zap, Share } from 'lucide-react';

interface PWAInstallPromptProps {
  variant?: 'banner' | 'card' | 'minimal';
  onDismiss?: () => void;
}

export const PWAInstallPrompt = ({ 
  variant = 'banner',
  onDismiss 
}: PWAInstallPromptProps) => {
  const { isInstallable, isInstalled, isStandalone, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already dismissed
    const wasDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    onDismiss?.();
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      handleDismiss();
    }
  };

  // Don't show if already installed, in standalone mode, or dismissed
  if (isInstalled || isStandalone || dismissed) return null;

  // Don't show if not installable (except iOS which needs manual install)
  if (!isInstallable && !isIOS) return null;

  if (variant === 'minimal') {
    return (
      <Button 
        onClick={isIOS ? undefined : handleInstall}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Instalar App
      </Button>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Smartphone className="h-6 w-6" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Instale a app RentReverse</p>
            <p className="text-sm opacity-90 truncate">
              {isIOS ? 'Toque em Partilhar → Adicionar ao Ecrã Principal' : 'Acesso rápido e notificações'}
            </p>
          </div>
          {!isIOS && (
            <Button 
              onClick={handleInstall}
              variant="secondary"
              size="sm"
              className="flex-shrink-0"
            >
              Instalar
            </Button>
          )}
          <button 
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <Card className="border-primary/20 overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">Instale a App</h3>
              <Badge variant="secondary" className="text-xs">Grátis</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Tenha acesso rápido ao RentReverse diretamente do seu ecrã inicial
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-1">
                  <Wifi className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs text-muted-foreground">Offline</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-1">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs text-muted-foreground">Notificações</span>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-1">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs text-muted-foreground">Rápido</span>
              </div>
            </div>

            {isIOS ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Share className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm">
                  Toque em <strong>Partilhar</strong> → <strong>Adicionar ao Ecrã Principal</strong>
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleInstall} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Instalar Agora
                </Button>
                <Button variant="ghost" onClick={handleDismiss}>
                  Agora Não
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
