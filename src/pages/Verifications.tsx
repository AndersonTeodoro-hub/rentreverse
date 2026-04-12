import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { 
  Shield, Upload, FileText, Briefcase, Home, Users, 
  Check, Clock, X, AlertCircle, ChevronRight, Trash2, Brain 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import TrustScoreCard from "@/components/TrustScoreCard";

const referenceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Telefone deve estar no formato E.164 (ex: +351999999999)").or(z.literal("")),
  relationship: z.string().min(1, "Relação é obrigatória"),
});

const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
import { AIVerificationAnalysis } from "@/components/AIVerificationAnalysis";

type VerificationType = 'identity' | 'income' | 'employment' | 'address';
type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface Verification {
  id: string;
  type: VerificationType;
  status: VerificationStatus;
  document_url: string | null;
  notes: string | null;
  created_at: string;
  verified_at: string | null;
}

interface UserReference {
  id: string;
  reference_name: string;
  reference_email: string;
  reference_phone: string | null;
  relationship: string;
  status: VerificationStatus;
  created_at: string;
}

const Verifications = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<VerificationType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUploadedVerification, setLastUploadedVerification] = useState<{id: string; url: string; type: VerificationType} | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  
  const [referenceForm, setReferenceForm] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch trust score
  const { data: trustScore } = useQuery({
    queryKey: ['trust-score', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('trust_scores')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch verifications
  const { data: verifications } = useQuery({
    queryKey: ['verifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Verification[];
    },
    enabled: !!user,
  });

  // Fetch references
  const { data: references } = useQuery({
    queryKey: ['references', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_references')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserReference[];
    },
    enabled: !!user,
  });

  // Add reference mutation
  const addReferenceMutation = useMutation({
    mutationFn: async (data: typeof referenceForm) => {
      if (!user) throw new Error('Not authenticated');

      const validation = referenceSchema.safeParse(data);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { error } = await supabase
        .from('user_references')
        .insert({
          user_id: user.id,
          reference_name: data.name,
          reference_email: data.email,
          reference_phone: data.phone || null,
          relationship: data.relationship,
          verification_token: crypto.randomUUID(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['references'] });
      queryClient.invalidateQueries({ queryKey: ['trust-score'] });
      setReferenceDialogOpen(false);
      setReferenceForm({ name: '', email: '', phone: '', relationship: '' });
      toast({
        title: t('verifications.referenceAdded'),
        description: t('verifications.referenceAddedDesc'),
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user || !selectedType) return;
    
    const file = event.target.files[0];

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        title: t('common.error'),
        description: "Formato não suportado. Use PDF, JPG ou PNG.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('common.error'),
        description: "Ficheiro demasiado grande. Máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${selectedType}-${Date.now()}.${fileExt}`;
    
    setUploading(true);
    
    try {
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('verifications')
        .getPublicUrl(fileName);
      
      // Create verification record
      const { data: verificationData, error: insertError } = await supabase
        .from('user_verifications')
        .upsert({
          user_id: user.id,
          type: selectedType,
          status: 'pending' as VerificationStatus,
          document_url: urlData.publicUrl,
        }, {
          onConflict: 'user_id,type'
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['trust-score'] });
      setUploadDialogOpen(false);
      
      // Set up for AI analysis
      if (verificationData) {
        setLastUploadedVerification({
          id: verificationData.id,
          url: urlData.publicUrl,
          type: selectedType,
        });
        setShowAIAnalysis(true);
      }
      
      toast({
        title: t('verifications.documentUploaded'),
        description: t('verifications.documentUploadedDesc'),
      });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const verificationTypes = [
    { type: 'identity' as VerificationType, icon: FileText, label: t('verifications.types.identity'), desc: t('verifications.types.identityDesc'), points: 25 },
    { type: 'income' as VerificationType, icon: FileText, label: t('verifications.types.income'), desc: t('verifications.types.incomeDesc'), points: 25 },
    { type: 'employment' as VerificationType, icon: Briefcase, label: t('verifications.types.employment'), desc: t('verifications.types.employmentDesc'), points: 20 },
    { type: 'address' as VerificationType, icon: Home, label: t('verifications.types.address'), desc: t('verifications.types.addressDesc'), points: 10 },
  ];

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'approved': return <Check className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <X className="w-4 h-4 text-red-600" />;
      case 'expired': return <AlertCircle className="w-4 h-4 text-orange-600" />;
    }
  };

  const getStatusLabel = (status: VerificationStatus) => {
    return t(`verifications.status.${status}`);
  };

  const getVerification = (type: VerificationType) => {
    return verifications?.find(v => v.type === type);
  };

  if (authLoading) {
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
                <Shield className="w-8 h-8 text-primary" />
                {t('verifications.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('verifications.subtitle')}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              {t('common.back')}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Trust Score Card and AI Analysis */}
            <div className="lg:col-span-1 space-y-6">
              <TrustScoreCard trustScore={trustScore} />
              
              {/* AI Analysis Card - shows after upload */}
              {showAIAnalysis && lastUploadedVerification && (
                <AIVerificationAnalysis
                  verificationId={lastUploadedVerification.id}
                  documentUrl={lastUploadedVerification.url}
                  documentType={lastUploadedVerification.type}
                  onAnalysisComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ['verifications'] });
                    queryClient.invalidateQueries({ queryKey: ['trust-score'] });
                  }}
                />
              )}
            </div>

            {/* Verifications */}
            <div className="lg:col-span-2 space-y-6">
              {/* Document Verifications */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('verifications.documents')}</CardTitle>
                  <CardDescription>{t('verifications.documentsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {verificationTypes.map((item) => {
                    const verification = getVerification(item.type);
                    const Icon = item.icon;
                    
                    return (
                      <div 
                        key={item.type}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{item.label}</h4>
                              {verification && (
                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
                                  {getStatusIcon(verification.status)}
                                  {getStatusLabel(verification.status)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            +{item.points} {t('trustScore.points')}
                          </span>
                          <Dialog open={uploadDialogOpen && selectedType === item.type} onOpenChange={(open) => {
                            setUploadDialogOpen(open);
                            if (open) setSelectedType(item.type);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                {verification ? t('verifications.reupload') : t('verifications.upload')}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('verifications.uploadDocument')}</DialogTitle>
                                <DialogDescription>
                                  {t('verifications.uploadDocumentDesc', { type: item.label.toLowerCase() })}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                  <p className="text-sm text-muted-foreground mb-4">
                                    {t('verifications.dragDrop')}
                                  </p>
                                  <Input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    className="max-w-xs mx-auto"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                  {t('verifications.acceptedFormats')}
                                </p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* References */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {t('verifications.references')}
                    </CardTitle>
                    <CardDescription>{t('verifications.referencesDesc')}</CardDescription>
                  </div>
                  <Dialog open={referenceDialogOpen} onOpenChange={setReferenceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        {t('verifications.addReference')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('verifications.addReference')}</DialogTitle>
                        <DialogDescription>
                          {t('verifications.addReferenceDesc')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>{t('verifications.refName')}</Label>
                          <Input
                            value={referenceForm.name}
                            onChange={(e) => setReferenceForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={t('verifications.refNamePlaceholder')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('verifications.refEmail')}</Label>
                          <Input
                            type="email"
                            value={referenceForm.email}
                            onChange={(e) => setReferenceForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('verifications.refPhone')}</Label>
                          <Input
                            type="tel"
                            value={referenceForm.phone}
                            onChange={(e) => setReferenceForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="+351 999 999 999"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('verifications.relationship')}</Label>
                          <Select
                            value={referenceForm.relationship}
                            onValueChange={(value) => setReferenceForm(prev => ({ ...prev, relationship: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('verifications.selectRelationship')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="previous_landlord">{t('verifications.relationships.previousLandlord')}</SelectItem>
                              <SelectItem value="employer">{t('verifications.relationships.employer')}</SelectItem>
                              <SelectItem value="colleague">{t('verifications.relationships.colleague')}</SelectItem>
                              <SelectItem value="personal">{t('verifications.relationships.personal')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setReferenceDialogOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button 
                          onClick={() => addReferenceMutation.mutate(referenceForm)}
                          disabled={!referenceForm.name || !referenceForm.email || !referenceForm.relationship || addReferenceMutation.isPending}
                        >
                          {t('verifications.sendRequest')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {references && references.length > 0 ? (
                    <div className="space-y-3">
                      {references.map((ref) => (
                        <div 
                          key={ref.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Users className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium">{ref.reference_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {t(`verifications.relationships.${ref.relationship}`)} • {ref.reference_email}
                              </p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-sm">
                            {getStatusIcon(ref.status)}
                            {getStatusLabel(ref.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>{t('verifications.noReferences')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Verifications;
