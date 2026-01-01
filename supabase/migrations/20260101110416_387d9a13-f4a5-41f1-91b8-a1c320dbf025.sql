-- Create enum for guarantee status
CREATE TYPE public.guarantee_status AS ENUM ('pending', 'quoted', 'active', 'claimed', 'expired', 'cancelled');

-- Create enum for claim status
CREATE TYPE public.claim_status AS ENUM ('pending', 'under_review', 'approved', 'paid', 'rejected');

-- Create rent_guarantees table
CREATE TABLE public.rent_guarantees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  property_id UUID NOT NULL,
  
  -- Coverage details
  monthly_rent NUMERIC NOT NULL,
  coverage_months INTEGER NOT NULL DEFAULT 12,
  max_coverage_amount NUMERIC GENERATED ALWAYS AS (monthly_rent * coverage_months) STORED,
  
  -- Premium calculation
  base_premium_rate NUMERIC NOT NULL DEFAULT 0.04, -- 4% base rate
  trust_score_discount NUMERIC DEFAULT 0, -- Discount based on tenant trust score
  final_premium_rate NUMERIC NOT NULL,
  annual_premium NUMERIC NOT NULL,
  
  -- Trust score snapshot at time of quote
  tenant_trust_score INTEGER,
  has_open_banking BOOLEAN DEFAULT false,
  
  -- Status and dates
  status guarantee_status NOT NULL DEFAULT 'pending',
  quote_valid_until TIMESTAMP WITH TIME ZONE,
  coverage_start_date DATE,
  coverage_end_date DATE,
  
  -- Insurer reference (for future integration)
  insurer_reference TEXT,
  insurer_policy_number TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create guarantee_claims table
CREATE TABLE public.guarantee_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guarantee_id UUID REFERENCES public.rent_guarantees(id) ON DELETE CASCADE NOT NULL,
  landlord_id UUID NOT NULL,
  
  -- Claim details
  claim_type TEXT NOT NULL DEFAULT 'unpaid_rent', -- unpaid_rent, legal_expenses
  months_unpaid INTEGER NOT NULL,
  amount_claimed NUMERIC NOT NULL,
  amount_approved NUMERIC,
  
  -- Documentation
  evidence_urls TEXT[],
  notes TEXT,
  
  -- Status
  status claim_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rent_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantee_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for rent_guarantees
CREATE POLICY "Landlords can view own guarantees"
ON public.rent_guarantees FOR SELECT
USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view guarantees on their contracts"
ON public.rent_guarantees FOR SELECT
USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can create guarantees"
ON public.rent_guarantees FOR INSERT
WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update pending guarantees"
ON public.rent_guarantees FOR UPDATE
USING (auth.uid() = landlord_id AND status IN ('pending', 'quoted'));

-- RLS policies for guarantee_claims
CREATE POLICY "Landlords can view own claims"
ON public.guarantee_claims FOR SELECT
USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can create claims"
ON public.guarantee_claims FOR INSERT
WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update pending claims"
ON public.guarantee_claims FOR UPDATE
USING (auth.uid() = landlord_id AND status = 'pending');

-- Create indexes
CREATE INDEX idx_rent_guarantees_landlord ON public.rent_guarantees(landlord_id);
CREATE INDEX idx_rent_guarantees_contract ON public.rent_guarantees(contract_id);
CREATE INDEX idx_rent_guarantees_status ON public.rent_guarantees(status);
CREATE INDEX idx_guarantee_claims_guarantee ON public.guarantee_claims(guarantee_id);

-- Add triggers for updated_at
CREATE TRIGGER update_rent_guarantees_updated_at
BEFORE UPDATE ON public.rent_guarantees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guarantee_claims_updated_at
BEFORE UPDATE ON public.guarantee_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();