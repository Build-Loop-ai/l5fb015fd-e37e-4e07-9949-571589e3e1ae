import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare EdgeRuntime for background tasks
declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXA_WEBSETS_BASE = 'https://api.exa.ai/websets/v0';

async function pollAndSaveLeads(websetId: string, campaignId: string | null, EXA_API_KEY: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Background task started for webset ${websetId}`);

  // Poll until the Webset is idle (completed processing)
  let status = 'running';
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes max wait

  while (status !== 'idle' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const statusResponse = await fetch(`${EXA_WEBSETS_BASE}/websets/${websetId}`, {
      method: 'GET',
      headers: {
        'x-api-key': EXA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!statusResponse.ok) {
      console.error('Error checking webset status:', statusResponse.status);
      break;
    }

    const statusData = await statusResponse.json();
    status = statusData.status;
    console.log(`Webset ${websetId} status: ${status} (attempt ${attempts + 1})`);
    attempts++;
  }

  // Retrieve Webset Items
  const itemsResponse = await fetch(`${EXA_WEBSETS_BASE}/websets/${websetId}/items?limit=50`, {
    method: 'GET',
    headers: {
      'x-api-key': EXA_API_KEY,
      'Accept': 'application/json',
    },
  });

  if (!itemsResponse.ok) {
    console.error('Failed to retrieve webset items:', itemsResponse.status);
    return;
  }

  const itemsData = await itemsResponse.json();
  console.log(`Webset ${websetId} returned ${itemsData.data?.length || 0} items`);

  // Parse items into lead format and save to database
  const leads = (itemsData.data || []).map((item: any) => {
    const enrichments = item.enrichments || [];

    const getEnrichmentValue = (desc: string) => {
      const enrichment = enrichments.find((e: any) =>
        e.description?.toLowerCase().includes(desc.toLowerCase())
      );
      return enrichment?.value || '';
    };

    const linkedinUrl = getEnrichmentValue('linkedin') || item.url || '';
    const title = getEnrichmentValue('job title') || getEnrichmentValue('title') || '';
    const company = getEnrichmentValue('company') || '';
    const location = getEnrichmentValue('location') || '';
    const email = getEnrichmentValue('email') || '';

    let name = item.title || '';
    if (!name && linkedinUrl) {
      const urlMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
      name = urlMatch ? urlMatch[1].replace(/-/g, ' ') : '';
    }

    return {
      name: name || 'Unknown',
      title: title || null,
      company: company || null,
      linkedin_url: linkedinUrl || null,
      location: location || null,
      email: email || null,
      industry: null,
      campaign_id: campaignId,
      status: 'new',
      profile_data: {
        source: 'exa_websets',
        webset_id: websetId,
        item_id: item.id,
        enrichments: enrichments,
      },
    };
  });

  if (leads.length > 0) {
    const { error } = await supabase.from('leads').insert(leads);
    if (error) {
      console.error('Error saving leads to database:', error);
    } else {
      console.log(`Saved ${leads.length} leads to database`);

      // Update campaign lead count if campaignId provided
      if (campaignId) {
        const { data: countData } = await supabase
          .from('leads')
          .select('id', { count: 'exact' })
          .eq('campaign_id', campaignId);

        await supabase
          .from('campaigns')
          .update({ lead_count: countData?.length || leads.length })
          .eq('id', campaignId);
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, campaignId } = await req.json();

    const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
    if (!EXA_API_KEY) {
      throw new Error('EXA_API_KEY is not configured');
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    const searchQuery = query.trim();
    console.log('Creating Webset with query:', searchQuery);

    // Create a Webset with search and enrichments
    const createResponse = await fetch(`${EXA_WEBSETS_BASE}/websets/`, {
      method: 'POST',
      headers: {
        'x-api-key': EXA_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        search: {
          query: searchQuery,
          count: 10,
        },
        enrichments: [
          { description: "LinkedIn profile URL of this person", format: "text" },
          { description: "Current job title", format: "text" },
          { description: "Current company name", format: "text" },
          { description: "Location (city, country)", format: "text" },
          { description: "Professional email address if available", format: "text" },
        ],
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Exa Websets create error:', createResponse.status, errorText);
      throw new Error(`Exa Websets API error: ${createResponse.status}`);
    }

    const webset = await createResponse.json();
    console.log('Webset created with ID:', webset.id);

    // Start background task to poll and save leads
    EdgeRuntime.waitUntil(pollAndSaveLeads(webset.id, campaignId || null, EXA_API_KEY));

    // Return immediately with webset ID
    return new Response(JSON.stringify({
      success: true,
      websetId: webset.id,
      status: 'processing',
      message: 'Search started. Leads will be saved to the database automatically.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in exa-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});