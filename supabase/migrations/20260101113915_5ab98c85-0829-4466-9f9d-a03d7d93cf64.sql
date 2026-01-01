-- Create rental_reviews table for verified reviews
CREATE TABLE public.rental_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewed_id UUID NOT NULL,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('landlord', 'tenant')),
  
  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  payment_rating INTEGER CHECK (payment_rating >= 1 AND payment_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  property_condition_rating INTEGER CHECK (property_condition_rating >= 1 AND property_condition_rating <= 5),
  respect_rating INTEGER CHECK (respect_rating >= 1 AND respect_rating <= 5),
  
  -- Review content
  review_text TEXT,
  pros TEXT[],
  cons TEXT[],
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  cross_verified BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'disputed', 'hidden')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one review per contract per reviewer
  UNIQUE(contract_id, reviewer_id)
);

-- Create user_badges table for earned badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(user_id, badge_type)
);

-- Create user_reputation table for aggregated stats
CREATE TABLE public.user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Aggregated ratings
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Landlord-specific
  avg_payment_rating NUMERIC(3,2),
  avg_communication_rating NUMERIC(3,2),
  avg_property_condition_rating NUMERIC(3,2),
  
  -- Tenant-specific  
  avg_respect_rating NUMERIC(3,2),
  
  -- Rental history
  completed_rentals INTEGER DEFAULT 0,
  total_months_rented INTEGER DEFAULT 0,
  
  -- Flags
  is_good_payer BOOLEAN DEFAULT false,
  is_good_landlord BOOLEAN DEFAULT false,
  is_verified_renter BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reputation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rental_reviews
CREATE POLICY "Users can view published reviews"
  ON public.rental_reviews FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can view own reviews"
  ON public.rental_reviews FOR SELECT
  USING (auth.uid() = reviewer_id OR auth.uid() = reviewed_id);

CREATE POLICY "Users can create reviews for their contracts"
  ON public.rental_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own pending reviews"
  ON public.rental_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id AND status = 'pending');

-- RLS Policies for user_badges
CREATE POLICY "Anyone can view active badges"
  ON public.user_badges FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for user_reputation
CREATE POLICY "Anyone can view reputation"
  ON public.user_reputation FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX idx_rental_reviews_reviewed_id ON public.rental_reviews(reviewed_id);
CREATE INDEX idx_rental_reviews_contract_id ON public.rental_reviews(contract_id);
CREATE INDEX idx_rental_reviews_status ON public.rental_reviews(status);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_type ON public.user_badges(badge_type);
CREATE INDEX idx_user_reputation_user_id ON public.user_reputation(user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_rental_reviews_updated_at
  BEFORE UPDATE ON public.rental_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_reputation_updated_at
  BEFORE UPDATE ON public.user_reputation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to recalculate user reputation
CREATE OR REPLACE FUNCTION public.recalculate_user_reputation(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_overall NUMERIC(3,2);
  review_count INTEGER;
  avg_payment NUMERIC(3,2);
  avg_comm NUMERIC(3,2);
  avg_prop NUMERIC(3,2);
  avg_respect NUMERIC(3,2);
  rentals_count INTEGER;
BEGIN
  -- Calculate averages from published reviews
  SELECT 
    ROUND(AVG(overall_rating)::numeric, 2),
    COUNT(*),
    ROUND(AVG(payment_rating)::numeric, 2),
    ROUND(AVG(communication_rating)::numeric, 2),
    ROUND(AVG(property_condition_rating)::numeric, 2),
    ROUND(AVG(respect_rating)::numeric, 2)
  INTO avg_overall, review_count, avg_payment, avg_comm, avg_prop, avg_respect
  FROM rental_reviews
  WHERE reviewed_id = _user_id AND status = 'published';

  -- Count completed rentals
  SELECT COUNT(*) INTO rentals_count
  FROM contracts
  WHERE (landlord_id = _user_id OR tenant_id = _user_id)
    AND status = 'completed';

  -- Upsert reputation record
  INSERT INTO user_reputation (
    user_id, average_rating, total_reviews,
    avg_payment_rating, avg_communication_rating,
    avg_property_condition_rating, avg_respect_rating,
    completed_rentals,
    is_good_payer, is_good_landlord, is_verified_renter
  ) VALUES (
    _user_id, 
    COALESCE(avg_overall, 0), 
    COALESCE(review_count, 0),
    avg_payment, avg_comm, avg_prop, avg_respect,
    COALESCE(rentals_count, 0),
    COALESCE(avg_payment, 0) >= 4.0 AND review_count >= 2,
    COALESCE(avg_prop, 0) >= 4.0 AND COALESCE(avg_comm, 0) >= 4.0 AND review_count >= 2,
    rentals_count >= 1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    avg_payment_rating = EXCLUDED.avg_payment_rating,
    avg_communication_rating = EXCLUDED.avg_communication_rating,
    avg_property_condition_rating = EXCLUDED.avg_property_condition_rating,
    avg_respect_rating = EXCLUDED.avg_respect_rating,
    completed_rentals = EXCLUDED.completed_rentals,
    is_good_payer = EXCLUDED.is_good_payer,
    is_good_landlord = EXCLUDED.is_good_landlord,
    is_verified_renter = EXCLUDED.is_verified_renter,
    updated_at = now();
END;
$$;

-- Trigger to update reputation when review is published
CREATE OR REPLACE FUNCTION public.trigger_update_reputation_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published' THEN
    PERFORM recalculate_user_reputation(NEW.reviewed_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_reputation_on_review
  AFTER INSERT OR UPDATE ON public.rental_reviews
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_reputation_on_review();