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
    const { linkedinUrl } = await req.json();
    
    const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY is not configured');
    }

    if (!linkedinUrl) {
      throw new Error('LinkedIn URL is required');
    }

    console.log('Scraping LinkedIn profile:', linkedinUrl);

    // Use Apify's LinkedIn Profile Scraper actor
    const actorId = 'anchor~linkedin-profile-scraper';
    
    const response = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrls: [linkedinUrl],
          proxy: {
            useApifyProxy: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apify API error:', response.status, errorText);
      
      // Return mock data if Apify fails (for demo purposes)
      const mockProfile = {
        name: extractNameFromUrl(linkedinUrl),
        headline: 'Professional',
        location: 'United States',
        summary: 'Experienced professional with a track record of success.',
        experience: [],
        education: [],
        skills: [],
      };
      
      return new Response(
        JSON.stringify({ success: true, profile: mockProfile, isMock: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Apify scrape completed');

    const profile = data[0] || {};
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        profile: {
          name: profile.fullName || profile.firstName + ' ' + profile.lastName || extractNameFromUrl(linkedinUrl),
          headline: profile.headline || profile.title || '',
          location: profile.location || profile.addressLocality || '',
          summary: profile.summary || profile.about || '',
          currentCompany: profile.currentCompany || profile.company || '',
          experience: profile.experience || profile.positions || [],
          education: profile.education || [],
          skills: profile.skills || [],
          connections: profile.connections || profile.connectionsCount,
          profilePicture: profile.profilePicture || profile.image,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in apify-scrape:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractNameFromUrl(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  if (match) {
    return match[1]
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return 'Unknown';
}
