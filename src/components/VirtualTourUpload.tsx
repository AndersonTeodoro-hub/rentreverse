import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Upload, Link, X, Image, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VirtualTourUploadProps {
  propertyId?: string;
  currentTourType?: string;
  currentEmbedUrl?: string;
  currentImages?: string[];
  onUpdate?: (data: {
    virtual_tour_type: string;
    virtual_tour_url: string | null;
    virtual_tour_images: string[];
  }) => void;
}

export function VirtualTourUpload({
  propertyId,
  currentTourType = 'none',
  currentEmbedUrl = '',
  currentImages = [],
  onUpdate,
}: VirtualTourUploadProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tourType, setTourType] = useState(currentTourType);
  const [embedUrl, setEmbedUrl] = useState(currentEmbedUrl || '');
  const [images360, setImages360] = useState<string[]>(currentImages || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleTourTypeChange = (value: string) => {
    setTourType(value);
    if (value === 'none') {
      onUpdate?.({
        virtual_tour_type: 'none',
        virtual_tour_url: null,
        virtual_tour_images: [],
      });
    }
  };

  const handleEmbedUrlChange = (url: string) => {
    setEmbedUrl(url);
    
    // Validate and extract embed URL
    let processedUrl = url;
    
    // Handle Matterport URLs
    if (url.includes('matterport.com')) {
      const match = url.match(/(?:my\.matterport\.com\/show\/\?m=|matterport\.com\/3d-space\/)([a-zA-Z0-9]+)/);
      if (match) {
        processedUrl = `https://my.matterport.com/show/?m=${match[1]}`;
      }
    }
    
    // Handle Kuula URLs
    if (url.includes('kuula.co')) {
      if (!url.includes('/embed')) {
        processedUrl = url.replace('kuula.co/', 'kuula.co/embed/');
      }
    }

    onUpdate?.({
      virtual_tour_type: 'embed',
      virtual_tour_url: processedUrl,
      virtual_tour_images: [],
    });
  };

  const handleImageUpload = async (files: FileList) => {
    if (!user) {
      toast.error('Precisa estar autenticado para fazer upload');
      return;
    }

    const validFiles = Array.from(files).filter(file => {
      // Accept common 360° image formats
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error(`Formato não suportado: ${file.name}`);
        return false;
      }
      // Max 20MB per image
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`Ficheiro muito grande: ${file.name} (máx. 20MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const uploadedUrls: string[] = [...images360];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${propertyId || 'temp'}/${Date.now()}-${i}.${fileExt}`;

      try {
        const { data, error } = await supabase.storage
          .from('properties')
          .upload(`virtual-tours/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('properties')
          .getPublicUrl(`virtual-tours/${fileName}`);

        uploadedUrls.push(urlData.publicUrl);
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Erro ao fazer upload de ${file.name}`);
      }
    }

    setImages360(uploadedUrls);
    setIsUploading(false);
    
    onUpdate?.({
      virtual_tour_type: 'images',
      virtual_tour_url: null,
      virtual_tour_images: uploadedUrls,
    });

    toast.success(`${validFiles.length} imagem(s) 360° carregada(s)`);
  };

  const removeImage = async (index: number) => {
    const imageUrl = images360[index];
    const newImages = images360.filter((_, i) => i !== index);
    setImages360(newImages);

    // Try to delete from storage
    try {
      const path = imageUrl.split('/properties/')[1];
      if (path) {
        await supabase.storage.from('properties').remove([path]);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }

    onUpdate?.({
      virtual_tour_type: newImages.length > 0 ? 'images' : 'none',
      virtual_tour_url: null,
      virtual_tour_images: newImages,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <View className="h-5 w-5" />
          Visita Virtual 360°
        </CardTitle>
        <CardDescription>
          Adicione uma visita virtual para atrair mais inquilinos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tour Type Selection */}
        <RadioGroup value={tourType} onValueChange={handleTourTypeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none" className="cursor-pointer">Sem visita virtual</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="embed" id="embed" />
            <Label htmlFor="embed" className="cursor-pointer">
              Link externo (Matterport, Kuula, etc.)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="images" id="images" />
            <Label htmlFor="images" className="cursor-pointer">
              Upload de imagens 360°
            </Label>
          </div>
        </RadioGroup>

        {/* Embed URL Input */}
        {tourType === 'embed' && (
          <div className="space-y-2">
            <Label htmlFor="embedUrl">URL da Visita Virtual</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="embedUrl"
                  value={embedUrl}
                  onChange={(e) => handleEmbedUrlChange(e.target.value)}
                  placeholder="https://my.matterport.com/show/?m=..."
                  className="pl-10"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Suportamos Matterport, Kuula, 3DVista e outros serviços com embed
            </p>
            
            {embedUrl && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Link configurado
              </div>
            )}
          </div>
        )}

        {/* Image Upload */}
        {tourType === 'images' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            />

            {/* Upload area */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-primary', 'bg-muted');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-primary', 'bg-muted');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary', 'bg-muted');
                if (e.dataTransfer.files) {
                  handleImageUpload(e.dataTransfer.files);
                }
              }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    A carregar... {uploadProgress}%
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    Arraste imagens 360° ou clique para selecionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou WebP (máx. 20MB por imagem)
                  </p>
                </>
              )}
            </div>

            {/* Uploaded images preview */}
            {images360.length > 0 && (
              <div className="space-y-2">
                <Label>Imagens carregadas ({images360.length})</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images360.map((url, index) => (
                    <div key={index} className="relative group aspect-video rounded-md overflow-hidden">
                      <img
                        src={url}
                        alt={`Vista 360° ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1">
                        <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              💡 Dica: Use uma câmara 360° ou app como Google Street View para capturar imagens esféricas
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
