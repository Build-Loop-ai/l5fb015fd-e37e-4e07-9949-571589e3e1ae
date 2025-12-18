import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, jobTitle, company, location, industry } = await req.json();
    
    const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
    if (!EXA_API_KEY) {
      throw new Error('EXA_API_KEY is not configured');
    }

    // Build search query from filters
    const searchParts = [];
    if (jobTitle) searchParts.push(`"${jobTitle}"`);
    if (company) searchParts.push(`"${company}"`);
    if (industry) searchParts.push(`${industry}`);
    if (location) searchParts.push(`${location}`);
    
    const searchQuery = query || searchParts.join(' ') || 'professional linkedin profile';
    
    console.log('Searching Exa with query:', searchQuery);

    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EXA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${searchQuery} site:linkedin.com/in`,
        type: 'neural',
        numResults: 10,
        contents: {
          text: true,
          highlights: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Exa API error:', response.status, errorText);
      throw new Error(`Exa API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Exa search returned', data.results?.length || 0, 'results');

    // Parse results to extract lead information
    const leads = (data.results || []).map((result: any) => {
      const url = result.url;
      const text = result.text || '';
      const title = result.title || '';
      
      // Extract name from LinkedIn URL or title
      const urlMatch = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
      const nameFromUrl = urlMatch ? urlMatch[1].replace(/-/g, ' ') : '';
      
      // Try to extract name from title (usually "Name - Title | LinkedIn")
      const nameMatch = title.match(/^([^-|]+)/);
      const name = nameMatch ? nameMatch[1].trim() : nameFromUrl;
      
      // Extract job title from title
      const titleMatch = title.match(/-\s*([^|]+)/);
      const extractedTitle = titleMatch ? titleMatch[1].trim() : '';

      return {
        name: name || 'Unknown',
        title: extractedTitle || jobTitle || '',
        company: company || '',
        linkedin_url: url,
        location: location || '',
        industry: industry || '',
        profile_data: {
          text: text.substring(0, 500),
          highlights: result.highlights || [],
          exa_score: result.score,
        },
      };
    });

    return new Response(JSON.stringify({ success: true, leads }), {
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
