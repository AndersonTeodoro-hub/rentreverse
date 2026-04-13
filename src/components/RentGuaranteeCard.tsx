import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, ShieldCheck, TrendingDown, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PremiumQuote {
  monthly_rent: number;
  coverage_months: number;
  max_coverage_amount: number;
  base_premium_rate: number;
  trust_score_discount: number;
  final_premium_rate: number;
  annual_premium: number;
  monthly_premium: number;
  tenant_trust_score: number;
  has_open_banking: boolean;
  quote_valid_until: string;
  savings_vs_base: number;
}

interface RentGuaranteeCardProps {
  contractId: string;
  tenantName?: string;
  propertyTitle?: string;
  existingGuarantee?: {
    id: string;
    status: string;
    annual_premium: number;
    coverage_months: number;
    coverage_start_date?: string;
    coverage_end_date?: string;
  };
  onGuaranteeCreated?: () => void;
}

export function RentGuaranteeCard({
  contractId,
  tenantName = 'Inquilino',
  propertyTitle = 'Propriedade',
  existingGuarantee,
  onGuaranteeCreated
}: RentGuaranteeCardProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [quote, setQuote] = useState<PremiumQuote | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const fetchQuote = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-guarantee-premium', {
        body: { contract_id: contractId, coverage_months: 12 },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setQuote(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Erro ao obter cotação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const activateGuarantee = async () => {
    if (!quote) return;
    
    setIsActivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get contract details for tenant_id and property_id
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('tenant_id, property_id, rent_amount')
        .eq('id', contractId)
        .single();

      if (contractError || !contract) throw new Error('Contrato não encontrado');

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);

      const { error } = await supabase
        .from('rent_guarantees')
        .insert({
          contract_id: contractId,
          landlord_id: user.id,
          tenant_id: contract.tenant_id,
          property_id: contract.property_id,
          monthly_rent: quote.monthly_rent,
          coverage_months: quote.coverage_months,
          base_premium_rate: quote.base_premium_rate,
          trust_score_discount: quote.trust_score_discount,
          final_premium_rate: quote.final_premium_rate,
          annual_premium: quote.annual_premium,
          tenant_trust_score: quote.tenant_trust_score,
          has_open_banking: quote.has_open_banking,
          status: 'quoted',
          quote_valid_until: quote.quote_valid_until,
          coverage_start_date: startDate.toISOString().split('T')[0],
          coverage_end_date: endDate.toISOString().split('T')[0],
        });

      if (error) throw error;

      toast.success('Garantia de renda solicitada! Entraremos em contacto em breve.');
      onGuaranteeCreated?.();
    } catch (error) {
      console.error('Error activating guarantee:', error);
      toast.error('Erro ao ativar garantia. Tente novamente.');
    } finally {
      setIsActivating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: React.ReactNode }> = {
      pending: { variant: 'outline', label: 'Pendente', icon: <Clock className="h-3 w-3" /> },
      quoted: { variant: 'secondary', label: 'Cotação', icon: <AlertCircle className="h-3 w-3" /> },
      active: { variant: 'default', label: 'Ativa', icon: <ShieldCheck className="h-3 w-3" /> },
      claimed: { variant: 'destructive', label: 'Sinistro', icon: <AlertCircle className="h-3 w-3" /> },
      expired: { variant: 'outline', label: 'Expirada', icon: <Clock className="h-3 w-3" /> },
      cancelled: { variant: 'outline', label: 'Cancelada', icon: <AlertCircle className="h-3 w-3" /> },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // If there's an existing guarantee, show its status
  if (existingGuarantee) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Garantia de Renda</CardTitle>
            </div>
            {getStatusBadge(existingGuarantee.status)}
          </div>
          <CardDescription>{propertyTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cobertura</p>
              <p className="font-semibold">{existingGuarantee.coverage_months} meses</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prémio Anual</p>
              <p className="font-semibold">€{existingGuarantee.annual_premium.toFixed(2)}</p>
            </div>
            {existingGuarantee.coverage_start_date && (
              <div>
                <p className="text-muted-foreground">Início</p>
                <p className="font-semibold">{new Date(existingGuarantee.coverage_start_date).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
            {existingGuarantee.coverage_end_date && (
              <div>
                <p className="text-muted-foreground">Fim</p>
                <p className="font-semibold">{new Date(existingGuarantee.coverage_end_date).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
          </div>
          
          {existingGuarantee.status === 'active' && (
            <div className="pt-2">
              <Button variant="outline" className="w-full" disabled>
                <AlertCircle className="mr-2 h-4 w-4" />
                Reportar Sinistro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Garantia de Renda</CardTitle>
        </div>
        <CardDescription>
          Proteja-se contra incumprimento de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!quote ? (
          <>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Cobertura até 12 meses de renda</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Despesas legais incluídas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Desconto baseado no Trust Score</span>
              </div>
            </div>
            
            <Button 
              onClick={fetchQuote} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A calcular...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Obter Cotação
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trust Score do Inquilino</span>
                <div className="flex items-center gap-2">
                  <Progress value={quote.tenant_trust_score} className="w-20 h-2" />
                  <span className="font-semibold">{quote.tenant_trust_score}/100</span>
                </div>
              </div>
              
              {quote.has_open_banking && (
                <Badge variant="secondary" className="text-xs">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Verificação Bancária
                </Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Renda Mensal</span>
                <span>€{quote.monthly_rent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cobertura Máxima</span>
                <span className="font-semibold">€{quote.max_coverage_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa Base</span>
                <span>{(quote.base_premium_rate * 100).toFixed(1)}%</span>
              </div>
              
              {quote.trust_score_discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Desconto Trust Score
                  </span>
                  <span>-{(quote.trust_score_discount * 100).toFixed(1)}%</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa Final</span>
                <span className="font-semibold text-primary">{(quote.final_premium_rate * 100).toFixed(1)}%</span>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg bg-primary/10 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Prémio Anual</span>
                <span className="text-xl font-bold text-primary">€{quote.annual_premium.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>≈ €{quote.monthly_premium.toFixed(2)}/mês</span>
                {quote.savings_vs_base > 0 && (
                  <span className="text-green-600">
                    Poupa €{quote.savings_vs_base.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Cotação válida até {new Date(quote.quote_valid_until).toLocaleDateString('pt-PT')}</span>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setQuote(null)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={activateGuarantee}
                disabled={isActivating}
              >
                {isActivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A processar...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Ativar Garantia
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
