import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, PenTool, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ContractSignature from './ContractSignature';

interface Contract {
  id: string;
  offer_id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  content: string;
  rent_amount: number;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  landlord_signature: string | null;
  landlord_signed_at: string | null;
  tenant_signature: string | null;
  tenant_signed_at: string | null;
  status: string;
  renewal_reminder_date: string | null;
  created_at: string;
  properties?: {
    title: string;
    address: string;
    city: string;
  };
}

const ContractManager = () => {
  const { t } = useTranslation();
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          properties (title, address, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!user
  });

  const signMutation = useMutation({
    mutationFn: async ({ contractId, signature }: { contractId: string; signature: string }) => {
      const isLandlord = userRole === 'landlord';
      const updateData = isLandlord
        ? {
            landlord_signature: signature,
            landlord_signed_at: new Date().toISOString(),
            landlord_ip: 'client-ip',
            status: 'pending_tenant'
          }
        : {
            tenant_signature: signature,
            tenant_signed_at: new Date().toISOString(),
            tenant_ip: 'client-ip',
            status: 'signed'
          };

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success(t('contracts.signedSuccess'));
      setSignDialogOpen(false);
      setSelectedContract(null);
    },
    onError: () => {
      toast.error(t('contracts.signError'));
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
      draft: { variant: 'secondary', icon: <FileText className="h-3 w-3" />, label: t('contracts.statusDraft') },
      pending_landlord: { variant: 'outline', icon: <Clock className="h-3 w-3" />, label: t('contracts.statusPendingLandlord') },
      pending_tenant: { variant: 'outline', icon: <Clock className="h-3 w-3" />, label: t('contracts.statusPendingTenant') },
      signed: { variant: 'default', icon: <CheckCircle className="h-3 w-3" />, label: t('contracts.statusSigned') },
      expired: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: t('contracts.statusExpired') },
      cancelled: { variant: 'destructive', icon: <XCircle className="h-3 w-3" />, label: t('contracts.statusCancelled') }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const canSign = (contract: Contract) => {
    if (userRole === 'landlord' && contract.status === 'pending_landlord' && !contract.landlord_signature) {
      return true;
    }
    if (userRole === 'tenant' && contract.status === 'pending_tenant' && !contract.tenant_signature) {
      return true;
    }
    return false;
  };

  const needsRenewalReminder = (contract: Contract) => {
    if (contract.status !== 'signed' || !contract.renewal_reminder_date) return false;
    const reminderDate = new Date(contract.renewal_reminder_date);
    return reminderDate <= new Date();
  };

  const handleDownload = (contract: Contract) => {
    const blob = new Blob([contract.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${contract.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('contracts.title')}</h2>
      </div>

      {contracts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('contracts.noContracts')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts?.map((contract) => (
            <Card key={contract.id} className={needsRenewalReminder(contract) ? 'border-warning' : ''}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">
                    {contract.properties?.title || t('contracts.untitledProperty')}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {contract.properties?.address}, {contract.properties?.city}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {needsRenewalReminder(contract) && (
                    <Badge variant="outline" className="flex items-center gap-1 text-warning border-warning">
                      <AlertTriangle className="h-3 w-3" />
                      {t('contracts.renewalSoon')}
                    </Badge>
                  )}
                  {getStatusBadge(contract.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('contracts.rentAmount')}</p>
                    <p className="font-semibold">€{contract.rent_amount}/mês</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('contracts.deposit')}</p>
                    <p className="font-semibold">€{contract.deposit_amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('contracts.startDate')}</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(contract.start_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('contracts.endDate')}</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(contract.end_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedContract(contract)}>
                        <FileText className="h-4 w-4 mr-2" />
                        {t('contracts.viewContract')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>{t('contracts.contractDetails')}</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh] pr-4">
                        <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                          {contract.content}
                        </pre>
                        <div className="mt-4 space-y-2">
                          {contract.landlord_signature && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{t('contracts.landlordSigned')}: {format(new Date(contract.landlord_signed_at!), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                          )}
                          {contract.tenant_signature && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{t('contracts.tenantSigned')}: {format(new Date(contract.tenant_signed_at!), 'dd/MM/yyyy HH:mm')}</span>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>

                  {canSign(contract) && (
                    <Dialog open={signDialogOpen && selectedContract?.id === contract.id} onOpenChange={setSignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedContract(contract)}>
                          <PenTool className="h-4 w-4 mr-2" />
                          {t('contracts.signContract')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('contracts.signContract')}</DialogTitle>
                        </DialogHeader>
                        <ContractSignature
                          onSign={(signature) => signMutation.mutate({ contractId: contract.id, signature })}
                          isLoading={signMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                  )}

                  {contract.status === 'signed' && (
                    <Button variant="outline" size="sm" onClick={() => handleDownload(contract)}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('contracts.download')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractManager;
