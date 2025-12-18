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

      // ATOMIC UPSERT: Use database-level unique constraint to prevent duplicates
      // The unique index leads_linkedin_campaign_unique handles race conditions
      const { data: upsertedLead, error: upsertError } = await supabase
        .from('leads')
        .upsert(lead, { 
          onConflict: 'linkedin_url,campaign_id',
          ignoreDuplicates: false // Update on conflict
        })
        .select()
        .single();
      
      if (upsertError) {
        // If linkedin conflict fails, try email-based upsert
        if (upsertError.code === '23505' && lead.email) {
          console.log('LinkedIn conflict, trying email-based upsert');
          const { error: emailUpsertError } = await supabase
            .from('leads')
            .upsert(lead, { 
              onConflict: 'email,campaign_id',
              ignoreDuplicates: true // Just skip if email also exists
            });
          
          if (emailUpsertError) {
            console.log('Lead already exists (both linkedin and email match), skipping');
          } else {
            console.log('Lead upserted via email:', lead.name);
          }
        } else {
          console.error('Error upserting lead:', upsertError);
        }
      } else {
        console.log('Lead upserted:', lead.name, upsertedLead?.id);

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

  console.log('Raw enrichments:', JSON.stringify(enrichments, null, 2));

  // Helper to get result value from enrichment
  const getResult = (enrichment: any): string => {
    if (!enrichment) return '';
    const result = enrichment.result || enrichment.value || enrichment.answer;
    if (!result) return '';
    if (Array.isArray(result)) return result[0] || '';
    return String(result);
  };

  // SMART DETECTION: Identify fields by their content, not by array index
  let linkedinUrl = '';
  let email = '';
  let title = '';
  let company = '';
  let location = '';
  let name = '';

  for (const enrichment of enrichments) {
    const val = getResult(enrichment).trim();
    if (!val) continue;

    // Detect LinkedIn URL
    if (val.includes('linkedin.com/in/') && !linkedinUrl) {
      linkedinUrl = val;
      continue;
    }

    // Detect email
    if (val.includes('@') && val.includes('.') && !val.includes(' ') && !email) {
      email = val;
      continue;
    }

    // Use enrichment description/prompt to identify field type
    const desc = (enrichment.description || enrichment.prompt || '').toLowerCase();
    
    if ((desc.includes('title') || desc.includes('job') || desc.includes('role') || desc.includes('position')) && !title) {
      title = val;
    } else if ((desc.includes('company') || desc.includes('employer') || desc.includes('organization')) && !company) {
      company = val;
    } else if ((desc.includes('location') || desc.includes('city') || desc.includes('country') || desc.includes('based')) && !location) {
      location = val;
    }
  }

  // Fallback: use item.url if no LinkedIn found
  if (!linkedinUrl && item.url && item.url.includes('linkedin.com/in/')) {
    linkedinUrl = item.url;
  }

  // Extract name from enrichment references (best source)
  for (const enrichment of enrichments) {
    if (enrichment.references && enrichment.references.length > 0) {
      const refTitle = enrichment.references[0].title || '';
      if (refTitle && !refTitle.includes('linkedin.com') && refTitle.length < 50 && refTitle.length > 2) {
        name = refTitle;
        break;
      }
    }
  }

  // Fallback: extract name from LinkedIn URL slug
  if (!name && linkedinUrl) {
    const urlMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (urlMatch) {
      let slug = urlMatch[1];
      slug = slug.replace(/-[a-f0-9]{6,}$/i, '');
      name = slug.replace(/-/g, ' ');
    }
  }

  // Capitalize name
  name = name.trim();
  if (name) {
    name = name.split(' ').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  console.log(`Parsed: name=${name}, title=${title}, company=${company}, location=${location}, email=${email}, linkedin=${linkedinUrl}`);

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
