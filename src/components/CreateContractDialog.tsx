import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateContractDialogProps {
  offerId: string;
  trigger?: React.ReactNode;
}

const CreateContractDialog = ({ offerId, trigger }: CreateContractDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [depositMonths, setDepositMonths] = useState('2');

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('country_name');

      if (error) throw error;
      return data;
    }
  });

  const createContractMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-contract', {
        body: {
          offerId,
          templateId,
          startDate,
          endDate,
          depositMonths: parseInt(depositMonths)
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success(t('contracts.createSuccess'));
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating contract:', error);
      toast.error(t('contracts.createError'));
    }
  });

  const resetForm = () => {
    setTemplateId('');
    setStartDate('');
    setEndDate('');
    setDepositMonths('2');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId || !startDate || !endDate) {
      toast.error(t('contracts.fillAllFields'));
      return;
    }
    createContractMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            {t('contracts.createContract')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('contracts.createContract')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">{t('contracts.selectTemplate')}</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder={t('contracts.selectTemplatePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.country_name} - {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('contracts.startDate')}</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('contracts.endDate')}</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">{t('contracts.depositMonths')}</Label>
            <Select value={depositMonths} onValueChange={setDepositMonths}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 {t('contracts.month')}</SelectItem>
                <SelectItem value="2">2 {t('contracts.months')}</SelectItem>
                <SelectItem value="3">3 {t('contracts.months')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={createContractMutation.isPending}>
            {createContractMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {t('contracts.generateContract')}
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateContractDialog;
