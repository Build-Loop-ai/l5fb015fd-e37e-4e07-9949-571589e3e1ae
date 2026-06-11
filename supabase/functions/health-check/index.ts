import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IntegrationStatus {
  name: string;
  configured: boolean;
  connected: boolean | null;
  error: string | null;
  secrets: string[];
}

// Presence-only check (never calls the external APIs, never leaks values) — enough
// to drive the in-app "Go Live" checklist.
const CHECKS: { name: string; secrets: string[] }[] = [
  { name: "Exa (Lead Search)", secrets: ["EXA_API_KEY"] },
  { name: "Apify (Enrichment)", secrets: ["APIFY_API_KEY"] },
  { name: "Resend (Email)", secrets: ["RESEND_API_KEY"] },
  { name: "Stripe (Payments)", secrets: ["STRIPE_SECRET_KEY"] },
  { name: "Google (Gmail OAuth)", secrets: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const results: IntegrationStatus[] = CHECKS.map(({ name, secrets }) => ({
      name,
      configured: secrets.every((s) => !!Deno.env.get(s)),
      connected: null,
      error: null,
      secrets,
    }));

    const configured = results.filter((r) => r.configured).length;
    const total = results.length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: { configured: `${configured}/${total}`, allConfigured: configured === total },
        integrations: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Health check failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
