
-- Create property status enum
CREATE TYPE public.property_status AS ENUM ('active', 'rented', 'inactive');

-- Create offer status enum
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired', 'cancelled');

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  rent_amount DECIMAL(12,2) NOT NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  area_sqm DECIMAL(10,2),
  available_from DATE,
  pets_allowed BOOLEAN DEFAULT false,
  smoking_allowed BOOLEAN DEFAULT false,
  status property_status NOT NULL DEFAULT 'active',
  images TEXT[],
  amenities TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tenant_requests table (what tenants are looking for)
CREATE TABLE public.tenant_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  preferred_cities TEXT[],
  min_budget DECIMAL(12,2),
  max_budget DECIMAL(12,2),
  min_bedrooms INTEGER DEFAULT 1,
  move_in_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_request_id UUID REFERENCES public.tenant_requests(id) ON DELETE SET NULL,
  message TEXT,
  proposed_rent DECIMAL(12,2),
  proposed_move_in DATE,
  status offer_status NOT NULL DEFAULT 'pending',
  landlord_phone TEXT,
  landlord_email TEXT,
  response_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create saved_tenants table (landlords can save/bookmark tenants)
CREATE TABLE public.saved_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (landlord_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Anyone can view active properties" ON public.properties FOR SELECT USING (status = 'active');
CREATE POLICY "Owners can view own properties" ON public.properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can insert own properties" ON public.properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tenant_requests
CREATE POLICY "Anyone can view active tenant requests" ON public.tenant_requests FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can view own requests" ON public.tenant_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can insert own requests" ON public.tenant_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update own requests" ON public.tenant_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete own requests" ON public.tenant_requests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for offers
CREATE POLICY "Landlords can view sent offers" ON public.offers FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Tenants can view received offers" ON public.offers FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Landlords can create offers" ON public.offers FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can update pending offers" ON public.offers FOR UPDATE USING (auth.uid() = landlord_id AND status = 'pending');
CREATE POLICY "Tenants can respond to offers" ON public.offers FOR UPDATE USING (auth.uid() = tenant_id AND status = 'pending');

-- RLS Policies for saved_tenants
CREATE POLICY "Landlords can view saved tenants" ON public.saved_tenants FOR SELECT USING (auth.uid() = landlord_id);
CREATE POLICY "Landlords can save tenants" ON public.saved_tenants FOR INSERT WITH CHECK (auth.uid() = landlord_id);
CREATE POLICY "Landlords can unsave tenants" ON public.saved_tenants FOR DELETE USING (auth.uid() = landlord_id);

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('properties', 'properties', true);

-- Storage policies for properties bucket
CREATE POLICY "Anyone can view property images" ON storage.objects FOR SELECT USING (bucket_id = 'properties');
CREATE POLICY "Authenticated users can upload property images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'properties' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own property images" ON storage.objects FOR DELETE USING (
  bucket_id = 'properties' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Triggers for updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_requests_updated_at BEFORE UPDATE ON public.tenant_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
