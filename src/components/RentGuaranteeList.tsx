import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldCheck, ShieldAlert, FileText, Building2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Guarantee {
  id: string;
  contract_id: string;
  monthly_rent: number;
  coverage_months: number;
  max_coverage_amount: number;
  final_premium_rate: number;
  annual_premium: number;
  tenant_trust_score: number;
  status: string;
  coverage_start_date: string | null;
  coverage_end_date: string | null;
  created_at: string;
  contracts: {
    id: string;
    properties: {
      title: string;
      address: string;
    };
  };
}

export function RentGuaranteeList() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: guarantees, isLoading } = useQuery({
    queryKey: ['rent-guarantees', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rent_guarantees')
        .select(`
          *,
          contracts (
            id,
            properties (
              title,
              address
            )
          )
        `)
        .eq('landlord_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Guarantee[];
    },
    enabled: !!user?.id,
  });

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: React.ReactNode }> = {
      pending: { variant: 'outline', label: 'Pendente', icon: <Shield className="h-3 w-3" /> },
      quoted: { variant: 'secondary', label: 'Cotação', icon: <FileText className="h-3 w-3" /> },
      active: { variant: 'default', label: 'Ativa', icon: <ShieldCheck className="h-3 w-3" /> },
      claimed: { variant: 'destructive', label: 'Sinistro', icon: <ShieldAlert className="h-3 w-3" /> },
      expired: { variant: 'outline', label: 'Expirada', icon: <Shield className="h-3 w-3" /> },
      cancelled: { variant: 'outline', label: 'Cancelada', icon: <Shield className="h-3 w-3" /> },
    };
    return configs[status] || configs.pending;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!guarantees?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sem Garantias de Renda</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Ainda não tem garantias de renda ativas. Aceda aos seus contratos para solicitar proteção.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {guarantees.map((guarantee) => {
        const statusConfig = getStatusConfig(guarantee.status);
        const property = guarantee.contracts?.properties;
        
        return (
          <Card key={guarantee.id} className={guarantee.status === 'active' ? 'border-primary/30' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">
                    {property?.title || 'Propriedade'}
                  </CardTitle>
                </div>
                <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                  {statusConfig.icon}
                  {statusConfig.label}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {property?.address}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Renda Mensal</p>
                  <p className="font-semibold">€{guarantee.monthly_rent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Cobertura Máx.</p>
                  <p className="font-semibold">€{guarantee.max_coverage_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Prémio Anual</p>
                  <p className="font-semibold text-primary">€{guarantee.annual_premium.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Trust Score</p>
                  <p className="font-semibold">{guarantee.tenant_trust_score}/100</p>
                </div>
              </div>
              
              {guarantee.coverage_start_date && guarantee.coverage_end_date && (
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Cobertura: {new Date(guarantee.coverage_start_date).toLocaleDateString('pt-PT')} - {new Date(guarantee.coverage_end_date).toLocaleDateString('pt-PT')}
                </div>
              )}

              {guarantee.status === 'active' && (
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    Ver Apólice
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    Reportar Sinistro
                  </Button>
                </div>
              )}

              {guarantee.status === 'quoted' && (
                <div className="mt-4">
                  <Button size="sm" className="w-full">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Confirmar e Pagar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
