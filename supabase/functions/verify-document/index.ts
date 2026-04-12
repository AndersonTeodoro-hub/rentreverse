import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://rentreverse.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  documentUrl: string;
  documentType: "identity" | "income" | "employment" | "address";
  verificationId: string;
}

interface AIAnalysisResult {
  isValid: boolean;
  confidence: number;
  extractedData: Record<string, string>;
  fraudIndicators: string[];
  recommendations: string[];
  summary: string;
}

const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

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

  // Reject oversized payloads up-front (before reading the body)
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({ error: "Payload too large. Maximum size is 5MB." }),
      { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const { documentUrl, documentType, verificationId }: VerificationRequest = await req.json();

    if (!documentUrl || !documentType || !verificationId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Authorization: ensure the caller owns the verification record
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

    const { data: ownerCheck, error: ownerError } = await supabase
      .from("user_verifications")
      .select("user_id")
      .eq("id", verificationId)
      .single();

    if (ownerError || !ownerCheck) {
      return new Response(
        JSON.stringify({ error: "Verification record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (ownerCheck.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the system prompt based on document type
    const systemPrompts: Record<string, string> = {
      identity: `You are a document verification AI specialist. Analyze the identity document image and extract:
- Document type (ID card, passport, driver's license)
- Full name
- Document number
- Date of birth
- Expiry date
- Issuing country/authority

Check for fraud indicators:
- Image quality issues (blur, low resolution)
- Visible tampering or editing
- Inconsistent fonts or layouts
- Missing security features
- Suspicious patterns

Respond in JSON format with the analysis.`,

      income: `You are a financial document verification AI. Analyze the income proof document and extract:
- Document type (pay slip, bank statement, tax return)
- Name of the person
- Employer/Source name
- Period covered
- Gross income amount
- Net income amount
- Currency

Check for fraud indicators:
- Inconsistent formatting
- Unusual amounts
- Missing required fields
- Suspicious alterations

Respond in JSON format with the analysis.`,

      employment: `You are an employment verification AI. Analyze the employment document and extract:
- Document type (employment letter, contract, certificate)
- Employee name
- Employer name
- Position/Job title
- Start date
- Employment type (full-time, part-time, contract)
- Salary information if present

Check for fraud indicators:
- Missing company letterhead
- No contact information
- Generic or template-like text
- Inconsistent dates

Respond in JSON format with the analysis.`,

      address: `You are an address verification AI. Analyze the address proof document and extract:
- Document type (utility bill, bank statement, official letter)
- Full name
- Complete address
- Document date
- Issuing organization

Check for fraud indicators:
- Document too old (usually valid up to 3 months)
- Address inconsistencies
- Missing official headers
- Signs of editing

Respond in JSON format with the analysis.`,
    };

    const prompt = systemPrompts[documentType] + `

IMPORTANT: Always respond with valid JSON in this exact structure:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "extractedData": { key-value pairs of extracted information },
  "fraudIndicators": [ array of any suspicious findings ],
  "recommendations": [ array of suggestions for the user ],
  "summary": "Brief summary of the analysis"
}

Please analyze this ${documentType} document (URL: ${documentUrl}) for verification. Provide detailed analysis and fraud detection.`;

    // Call Gemini API directly
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiContent) {
      throw new Error("No response from AI");
    }

    // Parse AI response - extract JSON from the response
    let analysis: AIAnalysisResult;
    try {
      // Try to extract JSON from markdown code blocks or raw JSON
      const jsonMatch = aiContent.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiContent.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, aiContent];
      const jsonString = jsonMatch[1] || aiContent;
      analysis = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      // Create a fallback analysis
      analysis = {
        isValid: false,
        confidence: 0,
        extractedData: {},
        fraudIndicators: ["Unable to properly analyze document"],
        recommendations: ["Please upload a clearer image", "Ensure the document is fully visible"],
        summary: "Document analysis could not be completed. Please try again with a clearer image.",
      };
    }

    // Determine verification status based on AI analysis
    const status = analysis.isValid && analysis.confidence >= 70 && analysis.fraudIndicators.length === 0
      ? "approved"
      : analysis.confidence >= 50 && analysis.fraudIndicators.length <= 1
        ? "pending" // Needs manual review
        : "rejected";

    // Build notes from analysis
    const notes = [
      `AI Confidence: ${analysis.confidence}%`,
      `Summary: ${analysis.summary}`,
      analysis.fraudIndicators.length > 0 
        ? `Fraud Indicators: ${analysis.fraudIndicators.join(", ")}` 
        : "No fraud indicators detected",
      `Extracted Data: ${JSON.stringify(analysis.extractedData)}`,
    ].join("\n\n");

    // Update verification record in database
    const { error: updateError } = await supabase
      .from("user_verifications")
      .update({
        status,
        notes,
        verified_at: status === "approved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", verificationId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to update verification status");
    }

    // If approved, trigger trust score recalculation
    if (status === "approved") {
      // Get user_id from the verification
      const { data: verification } = await supabase
        .from("user_verifications")
        .select("user_id")
        .eq("id", verificationId)
        .single();

      if (verification) {
        await supabase.rpc("calculate_trust_score", { _user_id: verification.user_id });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status,
        analysis: {
          isValid: analysis.isValid,
          confidence: analysis.confidence,
          extractedData: analysis.extractedData,
          fraudIndicators: analysis.fraudIndicators,
          recommendations: analysis.recommendations,
          summary: analysis.summary,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-document function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
