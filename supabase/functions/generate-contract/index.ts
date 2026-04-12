import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://rentreverse.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
};

const MAX_PAYLOAD_BYTES = 1 * 1024 * 1024; // 1 MB

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Rate limiting: 10 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_MAP_MAX = 10_000;
const RATE_LIMIT_CLEANUP_MS = 120_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function cleanupRateLimitMap() {
  const now = Date.now();
  if (rateLimitMap.size > RATE_LIMIT_MAP_MAX) {
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt + RATE_LIMIT_CLEANUP_MS) rateLimitMap.delete(key);
    }
  }
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupRateLimitMap();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count++;
  return {
    allowed: entry.count <= RATE_LIMIT_MAX,
    remaining: Math.max(0, RATE_LIMIT_MAX - entry.count),
    resetAt: entry.resetAt,
  };
}

function rateLimitHeaders(rl: { remaining: number; resetAt: number }) {
  return {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: "Payload too large. Maximum size is 1MB." }),
      { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const clientIp = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(clientIp);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ error: "Too many requests" }),
      {
        status: 429,
        headers: {
          ...corsHeaders, 'Content-Type': 'application/json',
          ...rateLimitHeaders(rl),
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  try {
    const { offerId, templateId, startDate, endDate, depositMonths } = await req.json();

    // Validate all parameters
    if (!offerId || !UUID_RE.test(offerId)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing offerId (must be UUID)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!templateId || !UUID_RE.test(templateId)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing templateId (must be UUID)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!startDate || !ISO_DATE_RE.test(startDate) || isNaN(Date.parse(startDate))) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing startDate (must be YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const today = new Date().toISOString().split('T')[0];
    if (startDate < today) {
      return new Response(
        JSON.stringify({ error: "startDate must be today or in the future" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!endDate || !ISO_DATE_RE.test(endDate) || isNaN(Date.parse(endDate))) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing endDate (must be YYYY-MM-DD)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (endDate <= startDate) {
      return new Response(
        JSON.stringify({ error: "endDate must be after startDate" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (depositMonths == null || !Number.isInteger(depositMonths) || depositMonths < 1 || depositMonths > 6) {
      return new Response(
        JSON.stringify({ error: "depositMonths must be an integer between 1 and 6" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authorization: caller must be the landlord or tenant on this offer
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch offer details with property and tenant info
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*, properties(*)')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      throw new Error('Offer not found');
    }

    if (offer.landlord_id !== user.id && offer.tenant_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: not a participant of this offer' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch landlord profile
    const { data: landlordProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', offer.landlord_id)
      .single();

    // Fetch tenant profile
    const { data: tenantProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', offer.tenant_id)
      .single();

    // Fetch tenant email from auth.users
    const { data: { user: tenantUser } } = await supabase.auth.admin.getUserById(offer.tenant_id);
    const tenantEmail = tenantUser?.email || '';

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    const property = offer.properties;
    const rentAmount = offer.proposed_rent || property.rent_amount;
    const depositAmount = rentAmount * (depositMonths || 2);

    // Localized text based on template country
    const localizedAllowed: Record<string, { yes: string; no: string }> = {
      PT: { yes: 'Permitido', no: 'Não permitido' },
      ES: { yes: 'Permitido', no: 'No permitido' },
      FR: { yes: 'Autorisé', no: 'Non autorisé' },
      EN: { yes: 'Allowed', no: 'Not allowed' },
    };
    const localeMap: Record<string, string> = { PT: 'pt-PT', ES: 'es-ES', FR: 'fr-FR', EN: 'en-GB' };

    const cc = template.country_code || 'PT';
    const allowed = localizedAllowed[cc] || localizedAllowed['PT'];
    const locale = localeMap[cc] || 'pt-PT';

    // Replace placeholders in template
    let contractContent = template.content
      .replace(/\{\{landlord_name\}\}/g, landlordProfile?.full_name || 'Senhorio')
      .replace(/\{\{landlord_email\}\}/g, offer.landlord_email || '')
      .replace(/\{\{landlord_phone\}\}/g, offer.landlord_phone || '')
      .replace(/\{\{tenant_name\}\}/g, tenantProfile?.full_name || 'Inquilino')
      .replace(/\{\{tenant_email\}\}/g, tenantEmail)
      .replace(/\{\{property_address\}\}/g, `${property.address}, ${property.city}`)
      .replace(/\{\{property_type\}\}/g, property.property_type)
      .replace(/\{\{start_date\}\}/g, startDate)
      .replace(/\{\{end_date\}\}/g, endDate)
      .replace(/\{\{rent_amount\}\}/g, rentAmount.toString())
      .replace(/\{\{deposit_amount\}\}/g, depositAmount.toString())
      .replace(/\{\{deposit_months\}\}/g, (depositMonths || 2).toString())
      .replace(/\{\{pets_allowed\}\}/g, property.pets_allowed ? allowed.yes : allowed.no)
      .replace(/\{\{smoking_allowed\}\}/g, property.smoking_allowed ? allowed.yes : allowed.no)
      .replace(/\{\{signature_date\}\}/g, new Date().toLocaleDateString(locale));

    // Create contract in database
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        offer_id: offerId,
        property_id: property.id,
        landlord_id: offer.landlord_id,
        tenant_id: offer.tenant_id,
        template_id: templateId,
        content: contractContent,
        rent_amount: rentAmount,
        start_date: startDate,
        end_date: endDate,
        deposit_amount: depositAmount,
        status: 'pending_landlord',
        renewal_reminder_date: new Date(new Date(endDate).setMonth(new Date(endDate).getMonth() - 1)).toISOString().split('T')[0]
      })
      .select()
      .single();

    if (contractError) {
      console.error('Contract creation error:', contractError);
      throw new Error('Failed to create contract');
    }

    console.log('Contract generated successfully:', contract.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contract,
        message: 'Contract generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
