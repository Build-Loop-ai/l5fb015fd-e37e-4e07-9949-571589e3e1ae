import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const exaApiKey = Deno.env.get('EXA_API_KEY')!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { email, query } = await req.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate query
    if (!query || query.trim().length < 5) {
      return new Response(JSON.stringify({ error: 'Please describe who you\'re looking for (at least 5 characters)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get IP for rate limiting (from headers)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limiting - max 3 per email
    const { data: emailSubmissions } = await adminClient
      .from('lead_magnet_submissions')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('magnet_type', 'free_leads');

    if (emailSubmissions && emailSubmissions.length >= 3) {
      return new Response(JSON.stringify({ 
        error: 'You\'ve already used your free lead samples. Sign up to get unlimited leads!' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limiting - max 5 per IP per day
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: ipSubmissions } = await adminClient
      .from('lead_magnet_submissions')
      .select('id')
      .eq('ip_address', ip)
      .eq('magnet_type', 'free_leads')
      .gte('created_at', oneDayAgo);

    if (ipSubmissions && ipSubmissions.length >= 5) {
      return new Response(JSON.stringify({ 
        error: 'Too many requests. Please try again later or sign up for full access.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Searching for leads with query:', query);

    // Call Exa API directly for immediate results
    const exaResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${exaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `Find ${query} with contact information linkedin profile`,
        type: 'auto',
        numResults: 5,
        contents: {
          text: true,
          highlights: true,
        },
      }),
    });

    if (!exaResponse.ok) {
      const errorText = await exaResponse.text();
      console.error('Exa API error:', errorText);
      throw new Error('Failed to search for leads');
    }

    const exaData = await exaResponse.json();
    console.log('Exa response:', JSON.stringify(exaData).substring(0, 500));

    // Parse results into lead format
    const fullLeads = (exaData.results || []).map((result: any, index: number) => {
      // Extract name from title or URL
      const titleParts = (result.title || '').split(' - ');
      const name = titleParts[0] || `Lead ${index + 1}`;
      
      // Try to extract company from title
      const company = titleParts[1] || 'Company';
      
      // Extract title/role if present
      const text = result.text || '';
      const titleMatch = text.match(/(?:is a|works as|role:?|title:?)\s*([^.|\n]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Professional';

      // Check if it's a LinkedIn URL
      const isLinkedIn = result.url?.includes('linkedin.com');

      return {
        name: name.substring(0, 50),
        title: title.substring(0, 100),
        company: company.substring(0, 50),
        location: 'United States',
        url: result.url,
        isLinkedIn,
        hasEmail: Math.random() > 0.3, // Simulate email availability
        hasPhone: Math.random() > 0.6, // Simulate phone availability
      };
    });

    // Create blurred version for response (hide sensitive data)
    const blurredLeads = fullLeads.map((lead: any) => ({
      name: lead.name,
      title: lead.title,
      company: lead.company.substring(0, 3) + '***',
      location: lead.location,
      email_available: lead.hasEmail,
      linkedin_available: lead.isLinkedIn,
      phone_available: lead.hasPhone,
    }));

    // Store submission with full data
    const { error: insertError } = await adminClient
      .from('lead_magnet_submissions')
      .insert({
        email: email.toLowerCase(),
        magnet_type: 'free_leads',
        input_data: { query },
        output_data: { leads: fullLeads, count: fullLeads.length },
        ip_address: ip,
      });

    if (insertError) {
      console.error('Failed to store submission:', insertError);
      // Don't fail the request, just log
    }

    return new Response(JSON.stringify({
      success: true,
      leads: blurredLeads,
      total: blurredLeads.length,
      message: 'Sign up to unlock full contact details and get 250+ leads per month!'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Free lead sample error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
