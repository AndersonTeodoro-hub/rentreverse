-- Create enum for service category
CREATE TYPE public.service_category AS ENUM ('moving', 'cleaning', 'insurance', 'utilities');

-- Create enum for service status
CREATE TYPE public.service_status AS ENUM ('active', 'inactive', 'pending');

-- Create service_providers table for affiliate partners
CREATE TABLE public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  category service_category NOT NULL,
  subcategory TEXT, -- e.g., 'electricity', 'internet', 'water' for utilities
  
  -- Affiliate tracking
  affiliate_url TEXT NOT NULL,
  affiliate_code TEXT,
  commission_type TEXT DEFAULT 'per_lead', -- per_lead, per_sale, percentage
  commission_value NUMERIC,
  
  -- Display info
  featured BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  
  -- Offer details
  offer_title TEXT,
  offer_description TEXT,
  discount_percentage INTEGER,
  
  -- Status
  status service_status NOT NULL DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_clicks table to track affiliate clicks
CREATE TABLE public.service_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  
  -- Click context
  source_page TEXT,
  referrer TEXT,
  
  -- Tracking
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  commission_earned NUMERIC
);

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_providers (public read)
CREATE POLICY "Anyone can view active providers"
ON public.service_providers FOR SELECT
USING (status = 'active');

-- RLS policies for service_clicks
CREATE POLICY "Anyone can create clicks"
ON public.service_clicks FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own clicks"
ON public.service_clicks FOR SELECT
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_service_providers_category ON public.service_providers(category);
CREATE INDEX idx_service_providers_status ON public.service_providers(status);
CREATE INDEX idx_service_providers_featured ON public.service_providers(featured) WHERE featured = true;
CREATE INDEX idx_service_clicks_provider ON public.service_clicks(provider_id);
CREATE INDEX idx_service_clicks_user ON public.service_clicks(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample providers (Portuguese market)
INSERT INTO public.service_providers (name, description, category, subcategory, affiliate_url, offer_title, offer_description, discount_percentage, featured, priority, rating, reviews_count) VALUES
-- Mudanças
('MudançasTop', 'Serviço de mudanças profissional em todo o Portugal', 'moving', NULL, 'https://example.com/mudancastop', '10% Desconto RentReverse', 'Desconto exclusivo para utilizadores RentReverse', 10, true, 10, 4.8, 234),
('Transportes Express', 'Mudanças rápidas e económicas', 'moving', NULL, 'https://example.com/transportes', 'Orçamento Grátis', 'Orçamento sem compromisso em 24h', NULL, false, 5, 4.5, 156),

-- Limpeza
('CleanPro Portugal', 'Limpeza profissional de casas e escritórios', 'cleaning', NULL, 'https://example.com/cleanpro', 'Primeira Limpeza -20%', 'Desconto na primeira limpeza profissional', 20, true, 10, 4.9, 412),
('Sparkle House', 'Limpeza detalhada para mudanças', 'cleaning', NULL, 'https://example.com/sparkle', 'Pack Mudança', 'Limpeza completa antes ou depois da mudança', NULL, false, 5, 4.6, 189),

-- Seguros
('Fidelidade Seguros', 'Seguro de recheio habitacional', 'insurance', 'home_contents', 'https://example.com/fidelidade', 'Simulação Grátis', 'Simule o seu seguro em 2 minutos', NULL, true, 10, 4.7, 567),
('Tranquilidade', 'Proteção completa para a sua casa', 'insurance', 'home_contents', 'https://example.com/tranquilidade', '15% Desconto Online', 'Desconto exclusivo na subscrição online', 15, false, 5, 4.5, 345),

-- Utilities - Eletricidade
('Endesa', 'Eletricidade e gás natural', 'utilities', 'electricity', 'https://example.com/endesa', '50€ Desconto', 'Bónus de boas-vindas para novos clientes', NULL, true, 10, 4.2, 789),
('Goldenergy', 'Energia 100% verde', 'utilities', 'electricity', 'https://example.com/goldenergy', 'Energia Verde', 'Eletricidade de fontes renováveis', NULL, false, 5, 4.4, 234),

-- Utilities - Internet
('NOS', 'Internet fibra, TV e móvel', 'utilities', 'internet', 'https://example.com/nos', '6 Meses -50%', 'Promoção para novos contratos', 50, true, 10, 4.0, 1234),
('MEO', 'Fibra até 10Gbps', 'utilities', 'internet', 'https://example.com/meo', 'Instalação Grátis', 'Instalação gratuita em todo o país', NULL, false, 5, 4.1, 987),
('Vodafone', 'Internet ultra-rápida', 'utilities', 'internet', 'https://example.com/vodafone', 'Router Premium', 'Router de última geração incluído', NULL, false, 4, 4.3, 876),

-- Utilities - Água/Gás
('Galp', 'Gás natural e eletricidade', 'utilities', 'gas', 'https://example.com/galp', 'Fatura Única', 'Gás e luz numa só fatura', NULL, false, 5, 4.2, 456);