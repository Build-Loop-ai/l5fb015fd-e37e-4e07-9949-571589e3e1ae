import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Filter to only keep actual LinkedIn profile URLs
function isValidProfileUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  // Must be a profile URL
  if (!lowerUrl.includes('linkedin.com/in/')) return false;
  // Exclude job pages, company pages, etc.
  if (lowerUrl.includes('/jobs/') || lowerUrl.includes('/job/')) return false;
  if (lowerUrl.includes('/company/')) return false;
  if (lowerUrl.includes('/pulse/')) return false;
  if (lowerUrl.includes('/posts/')) return false;
  return true;
}

// Check if the result looks like a real person profile (not a search/error page)
function isValidProfileContent(result: any): boolean {
  const title = (result.title || '').toLowerCase();
  const text = (result.text || '').toLowerCase();
  
  // Skip error/search pages
  const invalidPatterns = [
    "we couldn't find a match",
    "couldn't find a match",
    "jobs in",
    "job opportunities",
    "linkedin respects your privacy",
    "sign in to view",
    "this page doesn't exist",
    "page not found",
    "0 results",
    "no results found",
    "search results",
    "job search"
  ];
  
  for (const pattern of invalidPatterns) {
    if (title.includes(pattern) || text.slice(0, 500).includes(pattern)) {
      return false;
    }
  }
  
  // Must have some meaningful content
  if (text.length < 50) return false;
  
  return true;
}

// Parse LinkedIn profile from Exa result
function parseLinkedInResult(result: any): {
  name: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  email_available: boolean;
  linkedin_available: boolean;
  phone_available: boolean;
} | null {
  const url = result.url || '';
  const titleStr = result.title || '';
  const text = result.text || '';
  
  // Parse name from title (format: "Name - Title - Company | LinkedIn" or "Name | LinkedIn")
  let name = 'Unknown';
  let jobTitle = '';
  let company = '';
  
  // Remove " | LinkedIn" suffix first
  const cleanTitle = titleStr.replace(/\s*[|]\s*LinkedIn.*$/i, '').trim();
  
  // Split by " - " to get parts
  const parts = cleanTitle.split(/\s*[-–]\s*/);
  
  if (parts.length >= 1) {
    name = parts[0]?.trim() || 'Unknown';
  }
  
  if (parts.length >= 2) {
    // Second part could be "Title at Company" or just "Title" or "Company"
    const secondPart = parts[1]?.trim() || '';
    const atMatch = secondPart.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
    
    if (atMatch) {
      jobTitle = atMatch[1]?.trim() || '';
      company = atMatch[2]?.trim() || '';
    } else {
      jobTitle = secondPart;
    }
  }
  
  if (parts.length >= 3 && !company) {
    company = parts[2]?.trim() || '';
  }
  
  // Skip if name looks like a search query, job listing, or error
  const nameLower = name.toLowerCase();
  if (nameLower.includes('job') || 
      nameLower.includes('search') || 
      nameLower.includes('result') ||
      nameLower.includes("couldn't find") ||
      name.length < 2 ||
      name.length > 60) {
    return null;
  }
  
  // Try to extract location from text
  let location: string | null = null;
  const locationPatterns = [
    /(?:based in|located in|from|📍)\s*([^|\n,]+(?:,\s*[^|\n]+)?)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*(?:[A-Z]{2}|[A-Z][a-z]+))\s*(?:\||·|area|$)/,
    /(Netherlands|Amsterdam|Rotterdam|Germany|Berlin|Munich|France|Paris|United Kingdom|UK|London|USA|United States|New York|San Francisco|Canada|Toronto|Australia|Sydney|India|Bangalore)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length < 50) {
      location = match[1].trim();
      break;
    }
  }
  
  // Check for contact info indicators
  const hasEmail = /@[a-z0-9.-]+\.[a-z]{2,}/i.test(text) || 
    /\bemail\b/i.test(text) ||
    /contact/i.test(text);
  
  const hasPhone = /\+?[\d\s\-\(\)]{10,}/.test(text) ||
    /\bphone\b/i.test(text) ||
    /\bmobile\b/i.test(text);
  
  return {
    name: name.substring(0, 60),
    title: jobTitle || 'Professional',
    company: company?.substring(0, 60) || 'Company',
    location,
    url,
    email_available: hasEmail,
    linkedin_available: true,
    phone_available: hasPhone,
  };
}

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

    // Get IP for rate limiting
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
        error: 'You\'ve already used your free lead samples. Sign up to get unlimited leads!',
        limit_reached: true
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
        error: 'Too many requests. Please try again later or sign up for full access.',
        limit_reached: true
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Searching for leads with query:', query);

    // Call Exa API with LinkedIn-focused search - request more results to filter
    const exaResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${exaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${query} professional LinkedIn profile`,
        type: 'neural',
        useAutoprompt: true,
        numResults: 25, // Request more to filter down to 5 good ones
        contents: {
          text: { maxCharacters: 1500 },
        },
        includeDomains: ['linkedin.com'],
      }),
    });

    if (!exaResponse.ok) {
      const errorText = await exaResponse.text();
      console.error('Exa API error:', errorText);
      throw new Error('Failed to search for leads');
    }

    const exaData = await exaResponse.json();
    const results = exaData.results || [];
    
    console.log(`Exa returned ${results.length} results, filtering...`);

    // Filter and parse results - only keep valid profile pages
    const validLeads: NonNullable<ReturnType<typeof parseLinkedInResult>>[] = [];
    
    for (const result of results) {
      // Check URL is a profile
      if (!isValidProfileUrl(result.url)) {
        console.log('Skipping non-profile URL:', result.url);
        continue;
      }
      
      // Check content is valid
      if (!isValidProfileContent(result)) {
        console.log('Skipping invalid content:', result.title?.substring(0, 50));
        continue;
      }
      
      // Parse the result
      const parsed = parseLinkedInResult(result);
      if (parsed && parsed.name !== 'Unknown' && parsed.name.length >= 2) {
        validLeads.push(parsed);
        console.log('Valid lead found:', parsed.name);
      }
      
      // Stop once we have 5 good leads
      if (validLeads.length >= 5) break;
    }

    console.log(`Filtered to ${validLeads.length} valid leads`);

    // Create blurred version for response (hide sensitive data)
    const blurredLeads = validLeads.map((lead) => ({
      name: lead.name,
      title: lead.title,
      company: lead.company ? lead.company.substring(0, 3) + '***' : '***',
      location: lead.location,
      email_available: lead.email_available,
      linkedin_available: lead.linkedin_available,
      phone_available: lead.phone_available,
    }));

    // Store submission with full data
    const { error: insertError } = await adminClient
      .from('lead_magnet_submissions')
      .insert({
        email: email.toLowerCase(),
        magnet_type: 'free_leads',
        input_data: { query },
        output_data: { 
          leads: validLeads, 
          count: validLeads.length,
          raw_results_count: results.length 
        },
        ip_address: ip,
      });

    if (insertError) {
      console.error('Failed to store submission:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      leads: blurredLeads,
      total: blurredLeads.length,
      message: validLeads.length > 0 
        ? 'Sign up to unlock full contact details and get 250+ leads per month!'
        : 'No LinkedIn profiles found for that query. Try being more specific (e.g., "Marketing Director at SaaS companies in Amsterdam").',
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
