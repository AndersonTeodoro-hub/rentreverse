import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://rentreverse.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TenantRiskAnalysis {
  default_probability: number;
  risk_level: "low" | "medium" | "high" | "very_high";
  behavioral_patterns: {
    pattern: string;
    impact: "positive" | "neutral" | "negative";
    description: string;
  }[];
  market_insights: {
    recommended_rent_range: { min: number; max: number };
    market_comparison: string;
    demand_level: "low" | "medium" | "high";
  };
  recommendations: string[];
  confidence_score: number;
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
    const { tenant_id, property_id } = await req.json();

    if (!tenant_id || !UUID_RE.test(tenant_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing tenant_id (must be UUID)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (property_id && !UUID_RE.test(property_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid property_id format (must be UUID)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authorization: only landlords may run risk analysis. If a property_id
    // is supplied, the caller must own that property. Otherwise the caller
    // must at least hold the 'landlord' role (used by the BrowseTenants UI).
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (property_id) {
      const { data: propertyOwner, error: propertyOwnerError } = await supabase
        .from("properties")
        .select("user_id")
        .eq("id", property_id)
        .single();

      if (propertyOwnerError || !propertyOwner) {
        return new Response(
          JSON.stringify({ error: "Property not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (propertyOwner.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Forbidden: not the owner of this property" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "landlord")
        .maybeSingle();

      if (roleError || !roleRow) {
        return new Response(
          JSON.stringify({ error: "Forbidden: only landlords can run risk analysis" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch tenant data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", tenant_id)
      .single();

    const { data: tenantProfile } = await supabase
      .from("tenant_profiles")
      .select("*")
      .eq("user_id", tenant_id)
      .single();

    const { data: trustScore } = await supabase
      .from("trust_scores")
      .select("*")
      .eq("user_id", tenant_id)
      .single();

    const { data: verifications } = await supabase
      .from("user_verifications")
      .select("*")
      .eq("user_id", tenant_id);

    const { data: references } = await supabase
      .from("user_references")
      .select("*")
      .eq("user_id", tenant_id);

    // Fetch property data if provided
    let propertyData = null;
    if (property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("*")
        .eq("id", property_id)
        .single();
      propertyData = property;
    }

    // Build context for AI analysis
    const tenantContext = {
      profile: profile || {},
      tenantProfile: tenantProfile || {},
      trustScore: trustScore || { total_score: 0 },
      verifications: verifications || [],
      references: references || [],
      verifiedCount: verifications?.filter(v => v.status === "approved").length || 0,
      referenceCount: references?.filter(r => r.status === "approved").length || 0,
    };

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert real estate risk analyst AI. Analyze tenant data to predict default probability and provide actionable insights.

Your analysis must be:
- Data-driven and objective
- Based on financial indicators and verification status
- Practical for landlord decision-making

Return a JSON object with this exact structure:
{
  "default_probability": <number 0-100>,
  "risk_level": "<low|medium|high|very_high>",
  "behavioral_patterns": [
    {
      "pattern": "<pattern name>",
      "impact": "<positive|neutral|negative>",
      "description": "<brief description>"
    }
  ],
  "market_insights": {
    "recommended_rent_range": { "min": <number>, "max": <number> },
    "market_comparison": "<brief market context>",
    "demand_level": "<low|medium|high>"
  },
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>", ...],
  "confidence_score": <number 0-100>
}

Risk Level Guidelines:
- low: default_probability < 15%, strong financials, verified docs
- medium: default_probability 15-35%, some concerns but manageable
- high: default_probability 35-60%, significant concerns
- very_high: default_probability > 60%, major red flags`;

    const userPrompt = `Analyze this tenant for rental risk:

TENANT DATA:
- Trust Score: ${tenantContext.trustScore.total_score || 0}/100
- Identity Verified: ${tenantContext.trustScore.identity_verified ? "Yes" : "No"}
- Income Verified: ${tenantContext.trustScore.income_verified ? "Yes" : "No"}
- Employment Verified: ${tenantContext.trustScore.employment_verified ? "Yes" : "No"}
- Address Verified: ${tenantContext.trustScore.address_verified ? "Yes" : "No"}
- Total Verifications Approved: ${tenantContext.verifiedCount}
- References Approved: ${tenantContext.referenceCount}
- Monthly Income: ${tenantContext.tenantProfile.monthly_income || "Not provided"}
- Max Budget: ${tenantContext.tenantProfile.max_budget || "Not provided"}
- Profession: ${tenantContext.tenantProfile.profession || "Not provided"}
- Has Pets: ${tenantContext.tenantProfile.has_pets ? "Yes" : "No"}
- Is Smoker: ${tenantContext.tenantProfile.is_smoker ? "Yes" : "No"}

${propertyData ? `
PROPERTY DATA:
- Rent Amount: €${propertyData.rent_amount}
- City: ${propertyData.city}
- Property Type: ${propertyData.property_type}
- Bedrooms: ${propertyData.bedrooms}
- Area: ${propertyData.area_sqm}m²
` : ""}

Provide comprehensive risk analysis in the exact JSON format specified.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const analysis: TenantRiskAnalysis = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        tenant_id,
        property_id,
        analyzed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Risk analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
