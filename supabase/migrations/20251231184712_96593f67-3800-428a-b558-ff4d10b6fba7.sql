
-- Create verification types enum
CREATE TYPE public.verification_type AS ENUM ('identity', 'income', 'employment', 'reference', 'address');

-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- Create user_verifications table
CREATE TABLE public.user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type verification_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  document_url TEXT,
  notes TEXT,
  points_awarded INTEGER DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

-- Create trust_scores table (cached calculation)
CREATE TABLE public.trust_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_score INTEGER DEFAULT 0,
  identity_verified BOOLEAN DEFAULT false,
  income_verified BOOLEAN DEFAULT false,
  employment_verified BOOLEAN DEFAULT false,
  reference_count INTEGER DEFAULT 0,
  address_verified BOOLEAN DEFAULT false,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create references table (for reference verification)
CREATE TABLE public.user_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reference_name TEXT NOT NULL,
  reference_email TEXT NOT NULL,
  reference_phone TEXT,
  relationship TEXT NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  verification_token TEXT UNIQUE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_references ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_verifications
CREATE POLICY "Users can view own verifications" ON public.user_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own verifications" ON public.user_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pending verifications" ON public.user_verifications FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- RLS policies for trust_scores
CREATE POLICY "Users can view own trust score" ON public.trust_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view other trust scores" ON public.trust_scores FOR SELECT TO authenticated USING (true);

-- RLS policies for user_references
CREATE POLICY "Users can view own references" ON public.user_references FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own references" ON public.user_references FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pending references" ON public.user_references FOR DELETE USING (auth.uid() = user_id AND status = 'pending');

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', false);

-- Storage policies for verifications bucket
CREATE POLICY "Users can upload own verification docs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'verifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own verification docs" ON storage.objects FOR SELECT USING (
  bucket_id = 'verifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own verification docs" ON storage.objects FOR DELETE USING (
  bucket_id = 'verifications' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to calculate trust score
CREATE OR REPLACE FUNCTION public.calculate_trust_score(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INTEGER := 0;
  v_identity BOOLEAN := false;
  v_income BOOLEAN := false;
  v_employment BOOLEAN := false;
  v_address BOOLEAN := false;
  v_ref_count INTEGER := 0;
BEGIN
  -- Check verifications
  SELECT 
    COALESCE(bool_or(type = 'identity' AND status = 'approved'), false),
    COALESCE(bool_or(type = 'income' AND status = 'approved'), false),
    COALESCE(bool_or(type = 'employment' AND status = 'approved'), false),
    COALESCE(bool_or(type = 'address' AND status = 'approved'), false)
  INTO v_identity, v_income, v_employment, v_address
  FROM public.user_verifications
  WHERE user_id = _user_id;

  -- Count verified references
  SELECT COUNT(*) INTO v_ref_count
  FROM public.user_references
  WHERE user_id = _user_id AND status = 'approved';

  -- Calculate score (max 100)
  -- Identity: 25 points
  IF v_identity THEN score := score + 25; END IF;
  -- Income: 25 points
  IF v_income THEN score := score + 25; END IF;
  -- Employment: 20 points
  IF v_employment THEN score := score + 20; END IF;
  -- Address: 10 points
  IF v_address THEN score := score + 10; END IF;
  -- References: 5 points each, max 20
  score := score + LEAST(v_ref_count * 5, 20);

  -- Update or insert trust score record
  INSERT INTO public.trust_scores (user_id, total_score, identity_verified, income_verified, employment_verified, address_verified, reference_count, last_calculated_at)
  VALUES (_user_id, score, v_identity, v_income, v_employment, v_address, v_ref_count, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    identity_verified = EXCLUDED.identity_verified,
    income_verified = EXCLUDED.income_verified,
    employment_verified = EXCLUDED.employment_verified,
    address_verified = EXCLUDED.address_verified,
    reference_count = EXCLUDED.reference_count,
    last_calculated_at = now(),
    updated_at = now();

  RETURN score;
END;
$$;

-- Trigger to recalculate trust score when verifications change
CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM calculate_trust_score(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_verification_change
  AFTER INSERT OR UPDATE ON public.user_verifications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_trust_score();

CREATE TRIGGER on_reference_change
  AFTER INSERT OR UPDATE ON public.user_references
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_trust_score();

-- Trigger for updated_at
CREATE TRIGGER update_user_verifications_updated_at BEFORE UPDATE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trust_scores_updated_at BEFORE UPDATE ON public.trust_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize trust score for new users
CREATE OR REPLACE FUNCTION public.initialize_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.trust_scores (user_id, total_score)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_trust_score
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_trust_score();
