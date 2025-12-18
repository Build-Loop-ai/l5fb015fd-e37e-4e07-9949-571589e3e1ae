import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-exa-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await req.json();
    
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    const eventType = payload.type;
    const data = payload.data;

    if (!eventType || !data) {
      console.error('Invalid webhook payload - missing type or data');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle webset.item.enriched - individual lead is ready
    if (eventType === 'webset.item.enriched') {
      console.log('Processing enriched item for webset:', data.websetId);
      
      // Get the webset search record to find campaign_id
      const { data: searchRecord, error: searchError } = await supabase
        .from('webset_searches')
        .select('*')
        .eq('webset_id', data.websetId)
        .maybeSingle();

      if (searchError) {
        console.error('Error fetching search record:', searchError);
      }

      const campaignId = searchRecord?.campaign_id || null;
      const item = data.item || data;

      // Parse lead data from enriched item
      const lead = parseLeadFromItem(item);
      lead.campaign_id = campaignId;

      console.log('Parsed lead:', JSON.stringify(lead, null, 2));

      // VALIDATE: Only save leads with meaningful data
      const hasValidName = lead.name && lead.name !== 'Unknown' && lead.name.trim().length > 0;
      const hasLinkedIn = lead.linkedin_url && lead.linkedin_url.includes('linkedin.com');
      const hasEmail = lead.email && lead.email.includes('@');

      if (!hasValidName && !hasLinkedIn && !hasEmail) {
        console.log('Skipping invalid lead - no name, linkedin, or email');
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Save lead to database
      const { error: insertError } = await supabase.from('leads').insert(lead);
      
      if (insertError) {
        console.error('Error inserting lead:', insertError);
      } else {
        console.log('Lead saved successfully:', lead.name);

        // Update items_received count
        if (searchRecord) {
          await supabase
            .from('webset_searches')
            .update({ items_received: (searchRecord.items_received || 0) + 1 })
            .eq('webset_id', data.websetId);
        }

        // Update campaign lead count
        if (campaignId) {
          const { count } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('campaign_id', campaignId);

          await supabase
            .from('campaigns')
            .update({ lead_count: count || 0 })
            .eq('id', campaignId);
        }
      }
    }

    // Handle webset.idle - search is complete
    if (eventType === 'webset.idle') {
      console.log('Webset completed:', data.id || data.websetId);
      
      const websetId = data.id || data.websetId;
      
      await supabase
        .from('webset_searches')
        .update({ status: 'completed' })
        .eq('webset_id', websetId);

      console.log('Search marked as completed');
    }

    // Handle webset.item.created - item discovered but not yet enriched
    if (eventType === 'webset.item.created') {
      console.log('New item discovered for webset:', data.websetId);
      // We'll wait for webset.item.enriched to save the lead with full data
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseLeadFromItem(item: any): any {
  const enrichments = item.enrichments || [];

  // Log the raw enrichments for debugging
  console.log('Raw enrichments:', JSON.stringify(enrichments, null, 2));

  // Enrichments are returned in the order we requested them:
  // 0: LinkedIn URL, 1: Job title, 2: Company, 3: Location, 4: Email
  const getEnrichmentResult = (index: number): string => {
    const enrichment = enrichments[index];
    if (!enrichment) return '';
    
    // Try different possible field names
    const result = enrichment.result || enrichment.value || enrichment.answer;
    if (!result) return '';
    
    // result could be an array or a string
    if (Array.isArray(result)) {
      return result[0] || '';
    }
    return String(result);
  };

  const linkedinUrl = getEnrichmentResult(0) || item.url || '';
  const title = getEnrichmentResult(1) || '';
  const company = getEnrichmentResult(2) || '';
  const location = getEnrichmentResult(3) || '';
  const email = getEnrichmentResult(4) || '';

  // Extract name from enrichment references first (best source for real names)
  let name = '';
  
  // Try to get name from the first enrichment's references (LinkedIn profile title)
  if (enrichments.length > 0 && enrichments[0].references && enrichments[0].references.length > 0) {
    const refTitle = enrichments[0].references[0].title || '';
    // The reference title is usually the person's actual name
    if (refTitle && !refTitle.includes('linkedin.com') && refTitle.length < 50) {
      name = refTitle;
    }
  }
  
  // If no name from references, try reasoning field which sometimes has the name
  if (!name && enrichments.length > 0 && enrichments[0].reasoning) {
    const reasoning = enrichments[0].reasoning;
    // Try to extract a name from patterns like "John Smith's LinkedIn profile"
    const nameMatch = reasoning.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (nameMatch) {
      name = nameMatch[1];
    }
  }

  // Last resort: extract from LinkedIn URL slug
  if (!name && linkedinUrl) {
    const urlMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (urlMatch) {
      let slug = urlMatch[1];
      // Remove trailing IDs (e.g., "john-smith-12345678" -> "john-smith")
      slug = slug.replace(/-[a-f0-9]{6,}$/i, '');
      // Convert dashes to spaces
      name = slug.replace(/-/g, ' ');
    }
  }

  // Clean up and capitalize name
  name = name.trim();
  if (name) {
    name = name.split(' ').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  console.log(`Parsed: name=${name}, title=${title}, company=${company}, location=${location}`);

  return {
    name: name || 'Unknown',
    title: title || null,
    company: company || null,
    linkedin_url: linkedinUrl || null,
    location: location || null,
    email: email || null,
    industry: null,
    status: 'new',
    profile_data: {
      source: 'exa_websets_webhook',
      item_id: item.id,
      enrichments: enrichments,
    },
  };
}
