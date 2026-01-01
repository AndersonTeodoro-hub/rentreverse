import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Search, Filter, MapPin, Euro, Bed, Calendar, 
  Heart, HeartOff, Send, ChevronRight, Users, MessageCircle, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import TrustScoreBadge from "@/components/TrustScoreBadge";
import SendOfferDialog from "@/components/SendOfferDialog";
import { StartChatButton } from "@/components/chat/StartChatButton";
import { AIRiskAnalysis } from "@/components/AIRiskAnalysis";

interface TenantWithDetails {
  user_id: string;
  request_id: string;
  title: string;
  description: string | null;
  preferred_cities: string[] | null;
  min_budget: number | null;
  max_budget: number | null;
  min_bedrooms: number | null;
  move_in_date: string | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  trust_score: {
    total_score: number;
  } | null;
  tenant_profile: {
    profession: string | null;
    has_pets: boolean;
    is_smoker: boolean;
  } | null;
}

const BrowseTenants = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchCity, setSearchCity] = useState('');
  const [maxBudgetFilter, setMaxBudgetFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithDetails | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [riskAnalysisTenant, setRiskAnalysisTenant] = useState<TenantWithDetails | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && userRole !== 'landlord') {
      navigate('/dashboard');
    }
  }, [user, userRole, authLoading, navigate]);

  // Fetch tenant requests with profiles and trust scores
  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenant-requests', searchCity, maxBudgetFilter],
    queryFn: async () => {
      let query = supabase
        .from('tenant_requests')
        .select(`
          id,
          user_id,
          title,
          description,
          preferred_cities,
          min_budget,
          max_budget,
          min_bedrooms,
          move_in_date
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data: requests, error } = await query;
      if (error) throw error;

      // Fetch additional data for each tenant
      const tenantsWithDetails = await Promise.all(
        (requests || []).map(async (req) => {
          const [profileRes, trustRes, tenantProfileRes] = await Promise.all([
            supabase.from('profiles').select('full_name, avatar_url').eq('user_id', req.user_id).maybeSingle(),
            supabase.from('trust_scores').select('total_score').eq('user_id', req.user_id).maybeSingle(),
            supabase.from('tenant_profiles').select('profession, has_pets, is_smoker').eq('user_id', req.user_id).maybeSingle()
          ]);

          return {
            user_id: req.user_id,
            request_id: req.id,
            title: req.title,
            description: req.description,
            preferred_cities: req.preferred_cities,
            min_budget: req.min_budget,
            max_budget: req.max_budget,
            min_bedrooms: req.min_bedrooms,
            move_in_date: req.move_in_date,
            profile: profileRes.data,
            trust_score: trustRes.data,
            tenant_profile: tenantProfileRes.data
          } as TenantWithDetails;
        })
      );

      // Apply filters
      let filtered = tenantsWithDetails;
      
      if (searchCity) {
        filtered = filtered.filter(t => 
          t.preferred_cities?.some(city => 
            city.toLowerCase().includes(searchCity.toLowerCase())
          )
        );
      }
      
      if (maxBudgetFilter) {
        const budget = parseInt(maxBudgetFilter);
        filtered = filtered.filter(t => 
          t.max_budget && t.max_budget >= budget
        );
      }

      return filtered;
    },
    enabled: !!user && userRole === 'landlord',
  });

  // Fetch saved tenants
  const { data: savedTenants } = useQuery({
    queryKey: ['saved-tenants', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_tenants')
        .select('tenant_id')
        .eq('landlord_id', user.id);
      
      if (error) throw error;
      return data?.map(s => s.tenant_id) || [];
    },
    enabled: !!user,
  });

  // Save/unsave tenant mutation
  const toggleSaveMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const isSaved = savedTenants?.includes(tenantId);
      
      if (isSaved) {
        const { error } = await supabase
          .from('saved_tenants')
          .delete()
          .eq('landlord_id', user.id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_tenants')
          .insert({ landlord_id: user.id, tenant_id: tenantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-tenants'] });
    },
  });

  const handleSendOffer = (tenant: TenantWithDetails) => {
    setSelectedTenant(tenant);
    setOfferDialogOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="w-8 h-8 text-primary" />
                {t('browseTenants.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('browseTenants.subtitle')}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              {t('common.back')}
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={t('browseTenants.searchCity')}
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={maxBudgetFilter} onValueChange={setMaxBudgetFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('browseTenants.minRent')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">€500+</SelectItem>
                    <SelectItem value="750">€750+</SelectItem>
                    <SelectItem value="1000">€1000+</SelectItem>
                    <SelectItem value="1500">€1500+</SelectItem>
                    <SelectItem value="2000">€2000+</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearchCity(''); setMaxBudgetFilter(''); }}>
                  {t('browseTenants.clearFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants?.map((tenant) => {
              const isSaved = savedTenants?.includes(tenant.user_id);
              
              return (
                <Card key={tenant.request_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                          {tenant.profile?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {tenant.profile?.full_name || t('browseTenants.anonymous')}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {tenant.tenant_profile?.profession || t('browseTenants.noProfession')}
                          </p>
                        </div>
                      </div>
                      <TrustScoreBadge score={tenant.trust_score?.total_score || 0} size="sm" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm font-medium">{tenant.title}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{tenant.preferred_cities?.join(', ') || t('browseTenants.anyLocation')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Euro className="w-4 h-4" />
                        <span>
                          {tenant.min_budget && tenant.max_budget 
                            ? `€${tenant.min_budget} - €${tenant.max_budget}`
                            : tenant.max_budget 
                              ? `${t('browseTenants.upTo')} €${tenant.max_budget}`
                              : t('browseTenants.flexible')
                          }
                        </span>
                      </div>
                      {tenant.min_bedrooms && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Bed className="w-4 h-4" />
                          <span>{tenant.min_bedrooms}+ {t('browseTenants.bedrooms')}</span>
                        </div>
                      )}
                      {tenant.move_in_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(tenant.move_in_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {tenant.tenant_profile?.has_pets && (
                        <Badge variant="secondary">{t('browseTenants.hasPets')}</Badge>
                      )}
                      {tenant.tenant_profile?.is_smoker && (
                        <Badge variant="secondary">{t('browseTenants.smoker')}</Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleSaveMutation.mutate(tenant.user_id)}
                      >
                        {isSaved ? (
                          <HeartOff className="w-4 h-4 mr-1" />
                        ) : (
                          <Heart className="w-4 h-4 mr-1" />
                        )}
                        {isSaved ? t('browseTenants.unsave') : t('browseTenants.save')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRiskAnalysisTenant(tenant)}
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        Análise IA
                      </Button>
                      <StartChatButton 
                        otherUserId={tenant.user_id}
                        variant="outline"
                        size="sm"
                      />
                      <Button 
                        size="sm"
                        onClick={() => handleSendOffer(tenant)}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        {t('browseTenants.sendOffer')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {tenants?.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('browseTenants.noResults')}</h3>
              <p className="text-muted-foreground">{t('browseTenants.noResultsDesc')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Send Offer Dialog */}
      <SendOfferDialog
        open={offerDialogOpen}
        onOpenChange={setOfferDialogOpen}
        tenant={selectedTenant}
      />

      {/* AI Risk Analysis Dialog */}
      <Dialog open={!!riskAnalysisTenant} onOpenChange={(open) => !open && setRiskAnalysisTenant(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Análise de Risco - {riskAnalysisTenant?.profile?.full_name || "Inquilino"}
            </DialogTitle>
          </DialogHeader>
          {riskAnalysisTenant && (
            <AIRiskAnalysis tenantId={riskAnalysisTenant.user_id} />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default BrowseTenants;
