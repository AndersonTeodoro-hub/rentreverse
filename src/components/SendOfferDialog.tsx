import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Home, Euro, Calendar, MessageSquare, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface TenantInfo {
  user_id: string;
  request_id: string;
  title: string;
  profile: {
    full_name: string | null;
  } | null;
}

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantInfo | null;
}

const SendOfferDialog = ({ open, onOpenChange, tenant }: SendOfferDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProperty, setSelectedProperty] = useState('');
  const [proposedRent, setProposedRent] = useState('');
  const [proposedMoveIn, setProposedMoveIn] = useState('');
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Fetch landlord's properties
  const { data: properties } = useQuery({
    queryKey: ['my-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, address, city, rent_amount')
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && open,
  });

  // Send offer mutation
  const sendOfferMutation = useMutation({
    mutationFn: async () => {
      if (!user || !tenant || !selectedProperty) throw new Error('Missing data');
      
      const { error } = await supabase
        .from('offers')
        .insert({
          property_id: selectedProperty,
          landlord_id: user.id,
          tenant_id: tenant.user_id,
          tenant_request_id: tenant.request_id,
          proposed_rent: proposedRent ? parseFloat(proposedRent) : null,
          proposed_move_in: proposedMoveIn || null,
          message: message || null,
          landlord_phone: contactPhone || null,
          landlord_email: contactEmail || user.email,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-offers'] });
      onOpenChange(false);
      resetForm();
      toast({
        title: t('offers.sent'),
        description: t('offers.sentDesc'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedProperty('');
    setProposedRent('');
    setProposedMoveIn('');
    setMessage('');
    setContactPhone('');
    setContactEmail('');
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {t('offers.sendOffer')}
          </DialogTitle>
          <DialogDescription>
            {t('offers.sendOfferTo', { name: tenant.profile?.full_name || t('browseTenants.anonymous') })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Property Selection */}
          <div className="space-y-2">
            <Label>{t('offers.selectProperty')} *</Label>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder={t('offers.selectPropertyPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      <span>{property.title} - {property.city} (€{property.rent_amount})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {properties?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('offers.noProperties')}
              </p>
            )}
          </div>

          {/* Proposed Rent */}
          <div className="space-y-2">
            <Label>{t('offers.proposedRent')}</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="number"
                value={proposedRent}
                onChange={(e) => setProposedRent(e.target.value)}
                placeholder="800"
                className="pl-10"
              />
            </div>
          </div>

          {/* Proposed Move-in Date */}
          <div className="space-y-2">
            <Label>{t('offers.proposedMoveIn')}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="date"
                value={proposedMoveIn}
                onChange={(e) => setProposedMoveIn(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>{t('offers.message')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('offers.messagePlaceholder')}
              rows={3}
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('offers.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+351..."
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('offers.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={user?.email || ''}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => sendOfferMutation.mutate()}
            disabled={!selectedProperty || sendOfferMutation.isPending}
          >
            {sendOfferMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('offers.send')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendOfferDialog;
