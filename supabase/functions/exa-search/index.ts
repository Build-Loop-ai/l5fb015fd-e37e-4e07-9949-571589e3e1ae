import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXA_WEBSETS_BASE = 'https://api.exa.ai/websets/v0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
    if (!EXA_API_KEY) {
      throw new Error('EXA_API_KEY is not configured');
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    const searchQuery = query.trim();
    console.log('Creating Webset with query:', searchQuery);

    // Step 1: Create a Webset with search and enrichments
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
          {
            description: "LinkedIn profile URL of this person",
            format: "text",
          },
          {
            description: "Current job title",
            format: "text",
          },
          {
            description: "Current company name",
            format: "text",
          },
          {
            description: "Location (city, country)",
            format: "text",
          },
          {
            description: "Professional email address if available",
            format: "text",
          },
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

    // Step 2: Poll until the Webset is idle (completed processing)
    let status = webset.status;
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max wait
    
    while (status !== 'idle' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const statusResponse = await fetch(`${EXA_WEBSETS_BASE}/websets/${webset.id}`, {
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
      console.log(`Webset status: ${status} (attempt ${attempts + 1})`);
      attempts++;
    }

    if (status !== 'idle') {
      console.warn('Webset did not complete in time, fetching partial results');
    }

    // Step 3: Retrieve Webset Items
    const itemsResponse = await fetch(`${EXA_WEBSETS_BASE}/websets/${webset.id}/items?limit=50`, {
      method: 'GET',
      headers: {
        'x-api-key': EXA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!itemsResponse.ok) {
      const errorText = await itemsResponse.text();
      console.error('Exa Websets items error:', itemsResponse.status, errorText);
      throw new Error(`Failed to retrieve webset items: ${itemsResponse.status}`);
    }

    const itemsData = await itemsResponse.json();
    console.log('Webset returned', itemsData.data?.length || 0, 'items');

    // Parse items into lead format
    const leads = (itemsData.data || []).map((item: any) => {
      const enrichments = item.enrichments || [];
      
      // Extract enrichment values by description
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

      // Extract name from item or URL
      let name = item.title || '';
      if (!name && linkedinUrl) {
        const urlMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
        name = urlMatch ? urlMatch[1].replace(/-/g, ' ') : '';
      }

      return {
        name: name || 'Unknown',
        title,
        company,
        linkedin_url: linkedinUrl,
        location,
        email: email || null,
        industry: '',
        profile_data: {
          source: 'exa_websets',
          webset_id: webset.id,
          item_id: item.id,
          enrichments: enrichments,
          raw_item: item,
        },
      };
    });

    return new Response(JSON.stringify({ success: true, leads, websetId: webset.id }), {
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
