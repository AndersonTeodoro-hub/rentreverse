import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search, Plus, Edit, Trash2, MapPin, Euro, Bed,
  Calendar, MoreVertical, Home, ChevronsUpDown, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { CITIES_BY_COUNTRY } from "@/lib/cities";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface TenantRequest {
  id: string;
  title: string;
  description: string | null;
  preferred_cities: string[] | null;
  min_budget: number | null;
  max_budget: number | null;
  min_bedrooms: number | null;
  move_in_date: string | null;
  is_active: boolean;
  created_at: string;
}

interface RequestFormData {
  title: string;
  description: string;
  preferred_cities: string[];
  min_budget: string;
  max_budget: string;
  min_bedrooms: string;
  move_in_date: string;
}

const emptyForm: RequestFormData = {
  title: '',
  description: '',
  preferred_cities: [],
  min_budget: '',
  max_budget: '',
  min_bedrooms: '1',
  move_in_date: '',
};

const MyRequests = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<TenantRequest | null>(null);
  const [formData, setFormData] = useState<RequestFormData>(emptyForm);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && userRole !== 'tenant') {
      navigate('/dashboard');
    }
  }, [user, userRole, authLoading, navigate]);

  // Fetch requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('tenant_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TenantRequest[];
    },
    enabled: !!user,
  });

  // Create/Update request mutation
  const saveMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      const requestData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        preferred_cities: data.preferred_cities.length > 0 ? data.preferred_cities : null,
        min_budget: data.min_budget ? parseFloat(data.min_budget) : null,
        max_budget: data.max_budget ? parseFloat(data.max_budget) : null,
        min_bedrooms: data.min_bedrooms ? parseInt(data.min_bedrooms) : null,
        move_in_date: data.move_in_date || null,
      };

      if (editingRequest) {
        const { error } = await supabase
          .from('tenant_requests')
          .update(requestData)
          .eq('id', editingRequest.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_requests')
          .insert(requestData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      setDialogOpen(false);
      setEditingRequest(null);
      setFormData(emptyForm);
      toast({
        title: editingRequest ? t('requests.updated') : t('requests.created'),
        description: editingRequest ? t('requests.updatedDesc') : t('requests.createdDesc'),
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

  // Delete request mutation
  const deleteMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('tenant_requests')
        .delete()
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast({
        title: t('requests.deleted'),
        description: t('requests.deletedDesc'),
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ requestId, isActive }: { requestId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('tenant_requests')
        .update({ is_active: isActive })
        .eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });

  const handleEdit = (request: TenantRequest) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description || '',
      preferred_cities: request.preferred_cities || [],
      min_budget: request.min_budget?.toString() || '',
      max_budget: request.max_budget?.toString() || '',
      min_bedrooms: request.min_bedrooms?.toString() || '1',
      move_in_date: request.move_in_date || '',
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRequest(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded-lg w-1/3" />
          <div className="h-4 bg-muted animate-pulse rounded-lg w-1/4" />
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('requests.myRequests')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('requests.subtitle')}
              </p>
            </div>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('requests.add')}
            </Button>
          </div>

          {/* Requests List */}
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id} className="rounded-xl border border-border hover:shadow-md transition-all">
                  <CardHeader className="pb-3 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={request.is_active ? 'default' : 'secondary'}>
                            {request.is_active ? t('requests.active') : t('requests.inactive')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        {request.description && (
                          <CardDescription className="mt-1">{request.description}</CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(request)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleActiveMutation.mutate({ 
                              requestId: request.id, 
                              isActive: !request.is_active 
                            })}
                          >
                            {request.is_active ? t('requests.deactivate') : t('requests.activate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(request.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    {request.preferred_cities && request.preferred_cities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {request.preferred_cities.map(city => (
                          <Badge key={city} variant="secondary" className="bg-primary/10 text-primary border-0 rounded-full px-3 py-1 text-xs">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {(request.min_budget || request.max_budget) && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">{t('requests.form.budget', 'Orçamento')}</p>
                          <p className="text-xl font-bold text-primary">
                            {request.min_budget && request.max_budget
                              ? `€${request.min_budget} - €${request.max_budget}`
                              : request.max_budget
                                ? `até €${request.max_budget}`
                                : `desde €${request.min_budget}`
                            }
                          </p>
                        </div>
                      )}
                      {request.min_bedrooms && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">{t('explore.bedrooms')}</p>
                          <p className="font-medium text-foreground">{request.min_bedrooms}+</p>
                        </div>
                      )}
                      {request.move_in_date && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">{t('requests.form.moveIn', 'Entrada')}</p>
                          <p className="font-medium text-foreground">{new Date(request.move_in_date).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Home className="w-16 h-16 mx-auto text-muted-foreground/30 mb-6" />
              <h3 className="text-xl font-semibold text-foreground">{t('requests.noRequests')}</h3>
              <p className="text-muted-foreground mt-1 mb-6 max-w-md mx-auto">{t('requests.noRequestsDesc')}</p>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('requests.addFirst')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? t('requests.edit') : t('requests.add')}
            </DialogTitle>
            <DialogDescription>
              {editingRequest ? t('requests.editDesc') : t('requests.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('requests.form.title')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('requests.form.titlePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('requests.form.description')}</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('requests.form.descriptionPlaceholder')}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('requests.form.cities')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-11 font-normal">
                    {formData.preferred_cities.length > 0
                      ? `${formData.preferred_cities.length} cidade(s) selecionada(s)`
                      : t('requests.form.citiesPlaceholder')}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <div className="p-3 max-h-64 overflow-y-auto space-y-4">
                    {Object.entries(CITIES_BY_COUNTRY).map(([country, cities]) => (
                      <div key={country}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{country}</p>
                        <div className="grid grid-cols-2 gap-1">
                          {cities.map(city => (
                            <label key={city} className="flex items-center gap-2 text-sm cursor-pointer rounded-md px-2 py-1.5 hover:bg-accent transition-colors">
                              <Checkbox
                                checked={formData.preferred_cities.includes(city)}
                                onCheckedChange={(checked) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    preferred_cities: checked
                                      ? [...prev.preferred_cities, city]
                                      : prev.preferred_cities.filter(c => c !== city),
                                  }));
                                }}
                              />
                              {city}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {formData.preferred_cities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.preferred_cities.map(c => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="text-xs gap-1 cursor-pointer hover:bg-destructive/10"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        preferred_cities: prev.preferred_cities.filter(city => city !== c),
                      }))}
                    >
                      {c}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('requests.form.minBudget')}</Label>
                <Input
                  type="number"
                  value={formData.min_budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_budget: e.target.value }))}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('requests.form.maxBudget')}</Label>
                <Input
                  type="number"
                  value={formData.max_budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_budget: e.target.value }))}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('requests.form.minBedrooms')}</Label>
                <Input
                  type="number"
                  value={formData.min_bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_bedrooms: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('requests.form.moveInDate')}</Label>
                <Input
                  type="date"
                  value={formData.move_in_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, move_in_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.title || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                editingRequest ? t('common.save') : t('requests.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MyRequests;
