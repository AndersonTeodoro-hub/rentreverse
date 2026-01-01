import { usePWA } from '@/hooks/usePWA';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 safe-area-top">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Sem ligação à internet</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Tentar
        </Button>
      </div>
    </div>
  );
};
