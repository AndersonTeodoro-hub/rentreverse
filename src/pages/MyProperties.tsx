import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Building2, Plus, Edit, Trash2, MapPin, Euro, Bed, 
  Bath, Maximize, Calendar, PawPrint, Cigarette, MoreVertical,
  Upload, X, Image as ImageIcon, Sparkles, View
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AIMatchingSuggestions from "@/components/AIMatchingSuggestions";
import SendOfferDialog from "@/components/SendOfferDialog";
import { VirtualTourUpload } from "@/components/VirtualTourUpload";
type PropertyStatus = 'active' | 'rented' | 'inactive';

interface Property {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  rental_category: string;
  min_stay_days: number | null;
  max_stay_days: number | null;
  address: string;
  city: string;
  postal_code: string | null;
  rent_amount: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  available_from: string | null;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  status: PropertyStatus;
  images: string[] | null;
  virtual_tour_type: string | null;
  virtual_tour_url: string | null;
  virtual_tour_images: string[] | null;
  created_at: string;
}

interface PropertyFormData {
  title: string;
  description: string;
  property_type: string;
  rental_category: string;
  min_stay_days: string;
  max_stay_days: string;
  address: string;
  city: string;
  postal_code: string;
  rent_amount: string;
  bedrooms: string;
  bathrooms: string;
  area_sqm: string;
  available_from: string;
  pets_allowed: boolean;
  smoking_allowed: boolean;
}

const emptyForm: PropertyFormData = {
  title: '',
  description: '',
  property_type: 'apartment',
  rental_category: 'long_term',
  min_stay_days: '',
  max_stay_days: '',
  address: '',
  city: '',
  postal_code: '',
  rent_amount: '',
  bedrooms: '1',
  bathrooms: '1',
  area_sqm: '',
  available_from: '',
  pets_allowed: false,
  smoking_allowed: false,
};

const MyProperties = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, userRole, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>(emptyForm);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [matchingPropertyId, setMatchingPropertyId] = useState<string | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedTenantForOffer, setSelectedTenantForOffer] = useState<{id: string; userId: string; name: string} | null>(null);
  const [virtualTourData, setVirtualTourData] = useState({
    virtual_tour_type: 'none',
    virtual_tour_url: null as string | null,
    virtual_tour_images: [] as string[],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && userRole !== 'landlord') {
      navigate('/dashboard');
    }
  }, [user, userRole, authLoading, navigate]);

  // Fetch properties
  const { data: properties, isLoading } = useQuery({
    queryKey: ['my-properties', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user,
  });

  // Create/Update property mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      if (!user) throw new Error('Not authenticated');
      
      const propertyData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        property_type: data.property_type,
        rental_category: data.rental_category,
        min_stay_days: data.min_stay_days ? parseInt(data.min_stay_days) : null,
        max_stay_days: data.max_stay_days ? parseInt(data.max_stay_days) : null,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code || null,
        rent_amount: parseFloat(data.rent_amount),
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseInt(data.bathrooms),
        area_sqm: data.area_sqm ? parseFloat(data.area_sqm) : null,
        available_from: data.available_from || null,
        pets_allowed: data.pets_allowed,
        smoking_allowed: data.smoking_allowed,
        images: uploadedImages.length > 0 ? uploadedImages : null,
        virtual_tour_type: virtualTourData.virtual_tour_type,
        virtual_tour_url: virtualTourData.virtual_tour_url,
        virtual_tour_images: virtualTourData.virtual_tour_images.length > 0 ? virtualTourData.virtual_tour_images : null,
      };

      if (editingProperty) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingProperty.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert(propertyData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      setDialogOpen(false);
      setEditingProperty(null);
      setFormData(emptyForm);
      setUploadedImages([]);
      setVirtualTourData({ virtual_tour_type: 'none', virtual_tour_url: null, virtual_tour_images: [] });
      toast({
        title: editingProperty ? t('properties.updated') : t('properties.created'),
        description: editingProperty ? t('properties.updatedDesc') : t('properties.createdDesc'),
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

  // Delete property mutation
  const deleteMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      toast({
        title: t('properties.deleted'),
        description: t('properties.deletedDesc'),
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ propertyId, status }: { propertyId: string; status: PropertyStatus }) => {
      const { error } = await supabase
        .from('properties')
        .update({ status })
        .eq('id', propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    },
  });

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description || '',
      property_type: property.property_type,
      rental_category: property.rental_category || 'long_term',
      min_stay_days: property.min_stay_days?.toString() || '',
      max_stay_days: property.max_stay_days?.toString() || '',
      address: property.address,
      city: property.city,
      postal_code: property.postal_code || '',
      rent_amount: property.rent_amount.toString(),
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      area_sqm: property.area_sqm?.toString() || '',
      available_from: property.available_from || '',
      pets_allowed: property.pets_allowed,
      smoking_allowed: property.smoking_allowed,
    });
    setUploadedImages(property.images || []);
    setVirtualTourData({
      virtual_tour_type: property.virtual_tour_type || 'none',
      virtual_tour_url: property.virtual_tour_url,
      virtual_tour_images: property.virtual_tour_images || [],
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProperty(null);
    setFormData(emptyForm);
    setUploadedImages([]);
    setVirtualTourData({ virtual_tour_type: 'none', virtual_tour_url: null, virtual_tour_images: [] });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: t('common.error'),
            description: t('properties.invalidImageType'),
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: t('common.error'),
            description: t('properties.imageTooLarge'),
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('properties')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('properties')
          .getPublicUrl(fileName);

        newImages.push(urlData.publicUrl);
      }

      if (newImages.length > 0) {
        setUploadedImages(prev => [...prev, ...newImages]);
        toast({
          title: t('properties.imagesUploaded'),
          description: t('properties.imagesUploadedDesc', { count: newImages.length }),
        });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: t('common.error'),
        description: t('properties.uploadError'),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = async (imageUrl: string) => {
    // Extract file path from URL
    const urlParts = imageUrl.split('/properties/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('properties').remove([filePath]);
    }
    setUploadedImages(prev => prev.filter(img => img !== imageUrl));
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const variants: Record<PropertyStatus, 'default' | 'secondary' | 'outline'> = {
      active: 'default',
      rented: 'secondary',
      inactive: 'outline',
    };
    return <Badge variant={variants[status]}>{t(`properties.status.${status}`)}</Badge>;
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
                <Building2 className="w-8 h-8 text-primary" />
                {t('properties.myProperties')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('properties.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                {t('common.back')}
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                {t('properties.add')}
              </Button>
            </div>
          </div>

          {/* Properties Grid */}
          {properties && properties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/property/${property.id}`)}>
                  <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img 
                        src={property.images[0]} 
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {getStatusBadge(property.status)}
                        <CardTitle className="text-lg mt-2">{property.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.city}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(property)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateStatusMutation.mutate({ 
                              propertyId: property.id, 
                              status: property.status === 'active' ? 'inactive' : 'active' 
                            })}
                          >
                            {property.status === 'active' ? t('properties.deactivate') : t('properties.activate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(property.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4" />
                        €{property.rent_amount}/{t('pricing.period.month')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Bed className="w-4 h-4" />
                        {property.bedrooms} {t('properties.beds')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-4 h-4" />
                        {property.bathrooms} {t('properties.baths')}
                      </div>
                      {property.area_sqm && (
                        <div className="flex items-center gap-1">
                          <Maximize className="w-4 h-4" />
                          {property.area_sqm}m²
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      {property.pets_allowed && (
                        <Badge variant="outline" className="text-xs">
                          <PawPrint className="w-3 h-3 mr-1" />
                          {t('properties.petsOk')}
                        </Badge>
                      )}
                      {property.smoking_allowed && (
                        <Badge variant="outline" className="text-xs">
                          <Cigarette className="w-3 h-3 mr-1" />
                          {t('properties.smokingOk')}
                        </Badge>
                      )}
                    </div>
                    {property.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMatchingPropertyId(property.id);
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2 text-primary" />
                        {t('matching.getSuggestions')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">{t('properties.noProperties')}</h3>
              <p className="text-muted-foreground mb-4">{t('properties.noPropertiesDesc')}</p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                {t('properties.addFirst')}
              </Button>
            </div>
          )}

          {/* AI Matching Dialog */}
          <Dialog open={!!matchingPropertyId} onOpenChange={(open) => !open && setMatchingPropertyId(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {t('matching.aiSuggestions')}
                </DialogTitle>
                <DialogDescription>
                  {t('matching.findingBestMatches')}
                </DialogDescription>
              </DialogHeader>
              {matchingPropertyId && (
                <AIMatchingSuggestions 
                  propertyId={matchingPropertyId}
                  onSendOffer={(tenantId, userId, name) => {
                    setSelectedTenantForOffer({ id: tenantId, userId, name });
                    setOfferDialogOpen(true);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Send Offer Dialog */}
          <SendOfferDialog
            open={offerDialogOpen}
            onOpenChange={setOfferDialogOpen}
            tenant={selectedTenantForOffer ? {
              user_id: selectedTenantForOffer.userId,
              request_id: selectedTenantForOffer.id,
              title: '',
              profile: { full_name: selectedTenantForOffer.name }
            } : null}
          />
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? t('properties.edit') : t('properties.add')}
            </DialogTitle>
            <DialogDescription>
              {editingProperty ? t('properties.editDesc') : t('properties.addDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>{t('properties.form.title')} *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('properties.form.titlePlaceholder')}
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <Label>{t('properties.form.rentalCategory')} *</Label>
                <Select value={formData.rental_category} onValueChange={(v) => setFormData(prev => ({ ...prev, rental_category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_stay">{t('properties.category.shortStay')}</SelectItem>
                    <SelectItem value="temporary">{t('properties.category.temporary')}</SelectItem>
                    <SelectItem value="long_term">{t('properties.category.longTerm')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.type')} *</Label>
                <Select value={formData.property_type} onValueChange={(v) => setFormData(prev => ({ ...prev, property_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">{t('properties.types.apartment')}</SelectItem>
                    <SelectItem value="house">{t('properties.types.house')}</SelectItem>
                    <SelectItem value="studio">{t('properties.types.studio')}</SelectItem>
                    <SelectItem value="room">{t('properties.types.room')}</SelectItem>
                    <SelectItem value="hostel_shared">{t('properties.types.hostelShared')}</SelectItem>
                    <SelectItem value="hostel_private">{t('properties.types.hostelPrivate')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.rent')} *</Label>
                <Input
                  type="number"
                  value={formData.rent_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, rent_amount: e.target.value }))}
                  placeholder="800"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>{t('properties.form.address')} *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder={t('properties.form.addressPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.city')} *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Lisboa"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.postalCode')}</Label>
                <Input
                  value={formData.postal_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                  placeholder="1000-001"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.bedrooms')}</Label>
                <Input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.bathrooms')}</Label>
                <Input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.area')}</Label>
                <Input
                  type="number"
                  value={formData.area_sqm}
                  onChange={(e) => setFormData(prev => ({ ...prev, area_sqm: e.target.value }))}
                  placeholder="80"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.availableFrom')}</Label>
                <Input
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => setFormData(prev => ({ ...prev, available_from: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.minStayDays')}</Label>
                <Input
                  type="number"
                  value={formData.min_stay_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_stay_days: e.target.value }))}
                  placeholder="30"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('properties.form.maxStayDays')}</Label>
                <Input
                  type="number"
                  value={formData.max_stay_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_stay_days: e.target.value }))}
                  placeholder="365"
                  min="1"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>{t('properties.form.description')}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('properties.form.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3 col-span-2">
                <Label>{t('properties.form.images')}</Label>
                <div className="border-2 border-dashed rounded-lg p-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  
                  {/* Uploaded Images Grid */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {uploadedImages.map((imageUrl, idx) => (
                        <div key={idx} className="relative group aspect-video">
                          <img
                            src={imageUrl}
                            alt={`Property ${idx + 1}`}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(imageUrl)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        {t('properties.uploading')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {t('properties.form.addImages')}
                      </div>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {t('properties.form.imagesHint')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>{t('properties.form.petsAllowed')}</Label>
                <Switch
                  checked={formData.pets_allowed}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, pets_allowed: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label>{t('properties.form.smokingAllowed')}</Label>
                <Switch
                  checked={formData.smoking_allowed}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, smoking_allowed: v }))}
                />
              </div>

              {/* Virtual Tour Section */}
              <VirtualTourUpload
                propertyId={editingProperty?.id}
                currentTourType={virtualTourData.virtual_tour_type}
                currentEmbedUrl={virtualTourData.virtual_tour_url || ''}
                currentImages={virtualTourData.virtual_tour_images}
                onUpdate={(data) => setVirtualTourData(data)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => saveMutation.mutate(formData)}
              disabled={!formData.title || !formData.address || !formData.city || !formData.rent_amount || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                editingProperty ? t('common.save') : t('properties.create')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MyProperties;
