import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Mail, Check, X, Clock, Home, Euro, Calendar, 
  MessageSquare, Phone, User, ChevronDown, ChevronUp, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import CreateContractDialog from "@/components/CreateContractDialog";

type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

interface Offer {
  id: string;
  property_id: string;
  landlord_id: string;
  tenant_id: string;
  message: string | null;
  proposed_rent: number | null;
  proposed_move_in: string | null;
  status: OfferStatus;
  landlord_phone: string | null;
  landlord_email: string | null;
  response_message: string | null;
  created_at: string;
  property: {
    title: string;
    address: string;
    city: string;
    rent_amount: number;
    bedrooms: number;
    images: string[] | null;
  } | null;
  landlord_profile: {
    full_name: string | null;
  } | null;
}

const MyOffers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch offers for tenant
  const { data: offers, isLoading } = useQuery({
    queryKey: ['my-offers', user?.id, userRole],
    queryFn: async () => {
      if (!user) return [];
      
      const isLandlord = userRole === 'landlord';
      const column = isLandlord ? 'landlord_id' : 'tenant_id';
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq(column, user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Fetch property and landlord details
      const offersWithDetails = await Promise.all(
        (data || []).map(async (offer) => {
          const [propertyRes, landlordRes] = await Promise.all([
            supabase.from('properties').select('title, address, city, rent_amount, bedrooms, images').eq('id', offer.property_id).maybeSingle(),
            supabase.from('profiles').select('full_name').eq('user_id', offer.landlord_id).maybeSingle()
          ]);

          return {
            ...offer,
            property: propertyRes.data,
            landlord_profile: landlordRes.data
          } as Offer;
        })
      );

      return offersWithDetails;
    },
    enabled: !!user,
  });

  // Respond to offer mutation
  const respondMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase
        .from('offers')
        .update({
          status,
          response_message: responseMessage || null,
          responded_at: new Date().toISOString()
        })
        .eq('id', offerId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['my-offers'] });
      setResponseDialogOpen(false);
      setSelectedOffer(null);
      setResponseMessage('');
      toast({
        title: status === 'accepted' ? t('offers.accepted') : t('offers.rejected'),
        description: status === 'accepted' ? t('offers.acceptedDesc') : t('offers.rejectedDesc'),
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

  const getStatusBadge = (status: OfferStatus) => {
    const variants: Record<OfferStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Check }> = {
      pending: { variant: 'secondary', icon: Clock },
      accepted: { variant: 'default', icon: Check },
      rejected: { variant: 'destructive', icon: X },
      expired: { variant: 'outline', icon: Clock },
      cancelled: { variant: 'outline', icon: X },
    };
    
    const { variant, icon: Icon } = variants[status];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {t(`offers.status.${status}`)}
      </Badge>
    );
  };

  const toggleExpand = (offerId: string) => {
    setExpandedOffers(prev => {
      const next = new Set(prev);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
      }
      return next;
    });
  };

  const pendingOffers = offers?.filter(o => o.status === 'pending') || [];
  const otherOffers = offers?.filter(o => o.status !== 'pending') || [];

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const renderOfferCard = (offer: Offer, showActions: boolean = true) => (
    <Card key={offer.id} className="overflow-hidden">
      <Collapsible open={expandedOffers.has(offer.id)} onOpenChange={() => toggleExpand(offer.id)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge(offer.status)}
                <span className="text-xs text-muted-foreground">
                  {new Date(offer.created_at).toLocaleDateString()}
                </span>
              </div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="w-4 h-4" />
                {offer.property?.title || t('offers.unknownProperty')}
              </CardTitle>
              <CardDescription>
                {offer.property?.city} • {offer.property?.bedrooms} {t('browseTenants.bedrooms')}
              </CardDescription>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {expandedOffers.has(offer.id) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Property details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-muted-foreground" />
                <span>
                  {offer.proposed_rent 
                    ? `€${offer.proposed_rent}` 
                    : `€${offer.property?.rent_amount}`
                  } / {t('pricing.period.month')}
                </span>
              </div>
              {offer.proposed_move_in && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(offer.proposed_move_in).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Landlord info */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                {offer.landlord_profile?.full_name || t('offers.unknownLandlord')}
              </div>
              {offer.status === 'accepted' && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  {offer.landlord_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      {offer.landlord_phone}
                    </div>
                  )}
                  {offer.landlord_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      {offer.landlord_email}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message */}
            {offer.message && (
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <MessageSquare className="w-4 h-4" />
                  {t('offers.landlordMessage')}
                </div>
                <p className="text-sm text-muted-foreground">{offer.message}</p>
              </div>
            )}

            {/* Response message */}
            {offer.response_message && (
              <div className="p-3 border rounded-lg bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-medium mb-1">
                  <MessageSquare className="w-4 h-4" />
                  {t('offers.yourResponse')}
                </div>
                <p className="text-sm text-muted-foreground">{offer.response_message}</p>
              </div>
            )}

            {/* Actions for pending offers */}
            {showActions && offer.status === 'pending' && userRole === 'tenant' && (
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedOffer(offer);
                    setResponseDialogOpen(true);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  {t('offers.reject')}
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setSelectedOffer(offer);
                    respondMutation.mutate({ offerId: offer.id, status: 'accepted' });
                  }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {t('offers.accept')}
                </Button>
              </div>
            )}

            {/* Create contract button for accepted offers (landlord only) */}
            {offer.status === 'accepted' && userRole === 'landlord' && (
              <div className="pt-2">
                <CreateContractDialog 
                  offerId={offer.id}
                  trigger={
                    <Button className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      {t('contracts.createContract')}
                    </Button>
                  }
                />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Mail className="w-8 h-8 text-primary" />
                {t('offers.myOffers')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {userRole === 'tenant' ? t('offers.receivedOffers') : t('offers.sentOffers')}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              {t('common.back')}
            </Button>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="relative">
                {t('offers.pending')}
                {pendingOffers.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {pendingOffers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">{t('offers.history')}</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingOffers.length > 0 ? (
                pendingOffers.map(offer => renderOfferCard(offer))
              ) : (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{t('offers.noPending')}</h3>
                  <p className="text-muted-foreground">{t('offers.noPendingDesc')}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {otherOffers.length > 0 ? (
                otherOffers.map(offer => renderOfferCard(offer, false))
              ) : (
                <div className="text-center py-12">
                  <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">{t('offers.noHistory')}</h3>
                  <p className="text-muted-foreground">{t('offers.noHistoryDesc')}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('offers.rejectOffer')}</DialogTitle>
            <DialogDescription>
              {t('offers.rejectOfferDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder={t('offers.responseMessagePlaceholder')}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedOffer && respondMutation.mutate({ offerId: selectedOffer.id, status: 'rejected' })}
              disabled={respondMutation.isPending}
            >
              {t('offers.confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MyOffers;
