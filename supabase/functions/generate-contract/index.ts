import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { offerId, templateId, startDate, endDate, depositMonths } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch offer details with property and tenant info
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*, properties(*)')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      throw new Error('Offer not found');
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

    // Replace placeholders in template
    let contractContent = template.content
      .replace(/\{\{landlord_name\}\}/g, landlordProfile?.full_name || 'Senhorio')
      .replace(/\{\{landlord_email\}\}/g, offer.landlord_email || '')
      .replace(/\{\{landlord_phone\}\}/g, offer.landlord_phone || '')
      .replace(/\{\{tenant_name\}\}/g, tenantProfile?.full_name || 'Inquilino')
      .replace(/\{\{tenant_email\}\}/g, '')
      .replace(/\{\{property_address\}\}/g, `${property.address}, ${property.city}`)
      .replace(/\{\{property_type\}\}/g, property.property_type)
      .replace(/\{\{start_date\}\}/g, startDate)
      .replace(/\{\{end_date\}\}/g, endDate)
      .replace(/\{\{rent_amount\}\}/g, rentAmount.toString())
      .replace(/\{\{deposit_amount\}\}/g, depositAmount.toString())
      .replace(/\{\{deposit_months\}\}/g, (depositMonths || 2).toString())
      .replace(/\{\{pets_allowed\}\}/g, property.pets_allowed ? 'Permitido' : 'Não permitido')
      .replace(/\{\{smoking_allowed\}\}/g, property.smoking_allowed ? 'Permitido' : 'Não permitido')
      .replace(/\{\{signature_date\}\}/g, new Date().toLocaleDateString());

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
