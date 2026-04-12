import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://rentreverse.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PremiumRequest {
  contract_id: string;
  coverage_months?: number;
}

interface PremiumQuote {
  monthly_rent: number;
  coverage_months: number;
  max_coverage_amount: number;
  base_premium_rate: number;
  trust_score_discount: number;
  final_premium_rate: number;
  annual_premium: number;
  monthly_premium: number;
  tenant_trust_score: number;
  has_open_banking: boolean;
  quote_valid_until: string;
  savings_vs_base: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rate limiting: 10 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many requests" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contract_id, coverage_months = 12 }: PremiumRequest = await req.json();

    if (!contract_id || !UUID_RE.test(contract_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing contract_id (must be UUID)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Number.isInteger(coverage_months) || coverage_months < 1 || coverage_months > 24) {
      return new Response(
        JSON.stringify({ error: "coverage_months must be an integer between 1 and 24" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*, properties(*)")
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      console.error("Contract fetch error:", contractError);
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify landlord owns the contract
    if (contract.landlord_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Not authorized to request quote for this contract" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get tenant's trust score
    const { data: trustScore } = await supabase
      .from("trust_scores")
      .select("*")
      .eq("user_id", contract.tenant_id)
      .maybeSingle();

    const tenantTrustScore = trustScore?.total_score || 0;
    
    // Check if tenant has open banking verification (future feature)
    // For now, we'll check if they have income verified
    const hasOpenBanking = trustScore?.income_verified || false;

    // Calculate premium based on trust score
    // Base rate: 4% of annual rent
    // Discounts based on trust score:
    // - 0-30: No discount (high risk)
    // - 31-50: 10% discount
    // - 51-70: 20% discount
    // - 71-85: 30% discount
    // - 86-100: 40% discount
    // - Open Banking verified: Additional 10% discount
    
    const BASE_PREMIUM_RATE = 0.04; // 4%
    let discountPercentage = 0;

    if (tenantTrustScore > 85) {
      discountPercentage = 0.40;
    } else if (tenantTrustScore > 70) {
      discountPercentage = 0.30;
    } else if (tenantTrustScore > 50) {
      discountPercentage = 0.20;
    } else if (tenantTrustScore > 30) {
      discountPercentage = 0.10;
    }

    // Additional discount for Open Banking
    if (hasOpenBanking) {
      discountPercentage = Math.min(discountPercentage + 0.10, 0.50); // Max 50% discount
    }

    const trustScoreDiscount = BASE_PREMIUM_RATE * discountPercentage;
    const finalPremiumRate = BASE_PREMIUM_RATE - trustScoreDiscount;
    
    const monthlyRent = contract.rent_amount;
    const annualRent = monthlyRent * 12;
    const annualPremium = annualRent * finalPremiumRate;
    const monthlyPremium = annualPremium / 12;
    const maxCoverageAmount = monthlyRent * coverage_months;
    
    // Base premium without any discounts
    const basePremium = annualRent * BASE_PREMIUM_RATE;
    const savingsVsBase = basePremium - annualPremium;

    // Quote valid for 7 days
    const quoteValidUntil = new Date();
    quoteValidUntil.setDate(quoteValidUntil.getDate() + 7);

    const quote: PremiumQuote = {
      monthly_rent: monthlyRent,
      coverage_months: coverage_months,
      max_coverage_amount: maxCoverageAmount,
      base_premium_rate: BASE_PREMIUM_RATE,
      trust_score_discount: trustScoreDiscount,
      final_premium_rate: finalPremiumRate,
      annual_premium: Math.round(annualPremium * 100) / 100,
      monthly_premium: Math.round(monthlyPremium * 100) / 100,
      tenant_trust_score: tenantTrustScore,
      has_open_banking: hasOpenBanking,
      quote_valid_until: quoteValidUntil.toISOString(),
      savings_vs_base: Math.round(savingsVsBase * 100) / 100,
    };

    console.log("Premium quote calculated:", quote);

    return new Response(
      JSON.stringify(quote),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error calculating premium:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
