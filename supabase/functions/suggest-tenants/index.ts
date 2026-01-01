import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TenantRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  preferred_cities: string[] | null;
  min_budget: number | null;
  max_budget: number | null;
  min_bedrooms: number | null;
  move_in_date: string | null;
}

interface TenantProfile {
  profession: string | null;
  has_pets: boolean;
  is_smoker: boolean;
  monthly_income: number | null;
}

interface Profile {
  full_name: string | null;
}

interface TrustScore {
  total_score: number;
  identity_verified: boolean;
  income_verified: boolean;
}

interface Property {
  id: string;
  title: string;
  city: string;
  rent_amount: number;
  bedrooms: number;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  available_from: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id } = await req.json();

    if (!property_id) {
      return new Response(JSON.stringify({ error: "property_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch property details
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select("id, title, city, rent_amount, bedrooms, pets_allowed, smoking_allowed, available_from")
      .eq("id", property_id)
      .single();

    if (propError || !property) {
      console.error("Error fetching property:", propError);
      return new Response(JSON.stringify({ error: "Property not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch active tenant requests
    const { data: tenantRequests, error: reqError } = await supabase
      .from("tenant_requests")
      .select("id, user_id, title, description, preferred_cities, min_budget, max_budget, min_bedrooms, move_in_date")
      .eq("is_active", true);

    if (reqError) {
      console.error("Error fetching tenant requests:", reqError);
      throw reqError;
    }

    if (!tenantRequests || tenantRequests.length === 0) {
      return new Response(JSON.stringify({ suggestions: [], message: "No active tenant requests found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch additional data for each tenant
    const tenantsWithDetails = await Promise.all(
      tenantRequests.map(async (req: TenantRequest) => {
        const [profileRes, trustRes, tenantProfileRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("user_id", req.user_id).maybeSingle(),
          supabase.from("trust_scores").select("total_score, identity_verified, income_verified").eq("user_id", req.user_id).maybeSingle(),
          supabase.from("tenant_profiles").select("profession, has_pets, is_smoker, monthly_income").eq("user_id", req.user_id).maybeSingle(),
        ]);

        return {
          request: req,
          profile: profileRes.data as Profile | null,
          trust_score: trustRes.data as TrustScore | null,
          tenant_profile: tenantProfileRes.data as TenantProfile | null,
        };
      })
    );

    // Prepare data for AI analysis
    const propertyInfo = {
      title: property.title,
      city: property.city,
      rent: property.rent_amount,
      bedrooms: property.bedrooms,
      pets_allowed: property.pets_allowed,
      smoking_allowed: property.smoking_allowed,
      available_from: property.available_from,
    };

    const tenantsInfo = tenantsWithDetails.map((t) => ({
      id: t.request.id,
      user_id: t.request.user_id,
      name: t.profile?.full_name || "Anonymous",
      title: t.request.title,
      preferred_cities: t.request.preferred_cities,
      budget_range: { min: t.request.min_budget, max: t.request.max_budget },
      min_bedrooms: t.request.min_bedrooms,
      move_in_date: t.request.move_in_date,
      profession: t.tenant_profile?.profession,
      has_pets: t.tenant_profile?.has_pets || false,
      is_smoker: t.tenant_profile?.is_smoker || false,
      monthly_income: t.tenant_profile?.monthly_income,
      trust_score: t.trust_score?.total_score || 0,
      identity_verified: t.trust_score?.identity_verified || false,
      income_verified: t.trust_score?.income_verified || false,
    }));

    const systemPrompt = `You are an intelligent real estate matching assistant. Your task is to analyze tenant requests and match them with a property.

Analyze each tenant based on these criteria:
1. **Budget Match (25 points)**: Does the property rent fall within tenant's budget?
2. **Location Match (25 points)**: Is the property city in tenant's preferred locations?
3. **Room Requirements (15 points)**: Does the property meet bedroom requirements?
4. **Lifestyle Compatibility (15 points)**: Pet/smoking policy alignment
5. **Financial Reliability (10 points)**: Income to rent ratio (ideal: 3x rent), income verified
6. **Trust Score (10 points)**: Based on tenant's verified trust score

Return a JSON array with the tool call. For each tenant, provide:
- compatibility_score: 0-100
- match_reasons: array of positive match factors
- concerns: array of potential issues
- recommendation: brief text explaining why this is a good/bad match`;

    const userPrompt = `Analyze these tenants for the following property and rank them by compatibility:

**Property:**
${JSON.stringify(propertyInfo, null, 2)}

**Tenant Requests:**
${JSON.stringify(tenantsInfo, null, 2)}

Evaluate each tenant and return rankings. Focus on practical compatibility factors.`;

    console.log("Calling Lovable AI for tenant matching...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "rank_tenants",
              description: "Returns ranked list of tenants with compatibility scores",
              parameters: {
                type: "object",
                properties: {
                  rankings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tenant_id: { type: "string", description: "The tenant request ID" },
                        user_id: { type: "string", description: "The tenant user ID" },
                        compatibility_score: { type: "number", minimum: 0, maximum: 100 },
                        match_reasons: {
                          type: "array",
                          items: { type: "string" },
                        },
                        concerns: {
                          type: "array",
                          items: { type: "string" },
                        },
                        recommendation: { type: "string" },
                      },
                      required: ["tenant_id", "user_id", "compatibility_score", "match_reasons", "recommendation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["rankings"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "rank_tenants" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log("AI Response received:", JSON.stringify(aiResult).substring(0, 500));

    // Extract rankings from tool call
    let rankings = [];
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        rankings = args.rankings || [];
      } catch (e) {
        console.error("Error parsing tool call arguments:", e);
      }
    }

    // Sort by compatibility score descending
    rankings.sort((a: any, b: any) => b.compatibility_score - a.compatibility_score);

    // Enrich rankings with tenant details
    const enrichedRankings = rankings.map((ranking: any) => {
      const tenant = tenantsWithDetails.find((t) => t.request.id === ranking.tenant_id);
      return {
        ...ranking,
        tenant_name: tenant?.profile?.full_name || "Anonymous",
        tenant_title: tenant?.request.title,
        tenant_budget: tenant?.request.max_budget,
        tenant_cities: tenant?.request.preferred_cities,
        tenant_profession: tenant?.tenant_profile?.profession,
        trust_score: tenant?.trust_score?.total_score || 0,
        has_pets: tenant?.tenant_profile?.has_pets || false,
        is_smoker: tenant?.tenant_profile?.is_smoker || false,
      };
    });

    console.log(`Successfully ranked ${enrichedRankings.length} tenants`);

    return new Response(
      JSON.stringify({
        property: propertyInfo,
        suggestions: enrichedRankings.slice(0, 10), // Top 10 matches
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in suggest-tenants function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
