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
    const { lead, campaignGoal, tone } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!lead) {
      throw new Error('Lead information is required');
    }

    console.log('Generating outreach for:', lead.name);
    console.log('Campaign goal:', campaignGoal);

    // Extract rich context from Exa enrichment data
    const enrichments = lead.profile_data?.enrichments || [];
    const enrichmentSnippets = enrichments
      .map((e: any) => e.references?.[0]?.snippet)
      .filter(Boolean)
      .join('\n\n');

    // Get any additional context from profile_data
    const profileSummary = lead.profile_data?.summary || '';
    const profileHeadline = lead.profile_data?.headline || '';

    console.log('Enrichment snippets length:', enrichmentSnippets.length);

    const systemPrompt = `You are an elite cold email copywriter. Your messages get 40%+ open rates and 15%+ reply rates. You write like a human, not a marketer.

Your style:
- Short, punchy sentences. Never more than 2 lines per paragraph
- No generic phrases like "I hope this finds you well" or "I came across your profile"
- Pattern interrupt opening lines that make them curious
- Reference SPECIFIC details from their background - be precise
- Connect their experience to value, don't sell features
- Soft CTAs that are easy to say yes to
- Write like you're texting a colleague, not writing a formal letter
- Use their first name naturally, not repeatedly

Tone: ${tone || 'professional but human'}

CRITICAL: The outreach must feel 1:1 personalized, not templated. Reference actual things from their profile.`;

    const userPrompt = `Write a high-converting cold outreach for this lead:

**LEAD PROFILE:**
Name: ${lead.name}
Title: ${lead.title || 'Professional'}
Company: ${lead.company || 'their company'}
Location: ${lead.location || 'Unknown'}
Industry: ${lead.industry || ''}

**BACKGROUND (from their LinkedIn - USE THIS for personalization):**
${enrichmentSnippets || profileSummary || profileHeadline || 'No additional background available'}

**CAMPAIGN GOAL:**
${campaignGoal || 'Connect and explore potential collaboration'}

Write outreach that:
1. Opens with something specific about THEM (not us)
2. Connects their experience/role to our value proposition
3. Has a low-friction CTA aligned with the campaign goal
4. Feels like it was written specifically for them

Return JSON with:
- subject: Compelling, curiosity-driven subject line (max 50 chars, no clickbait)
- body: Email body - short paragraphs, specific personalization, clear value
- linkedin_message: Shorter LinkedIn version (max 280 chars) - direct, personal, ends with soft question`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_outreach',
              description: 'Generate personalized outreach messages',
              parameters: {
                type: 'object',
                properties: {
                  subject: { type: 'string', description: 'Email subject line' },
                  body: { type: 'string', description: 'Email body' },
                  linkedin_message: { type: 'string', description: 'Short LinkedIn message' },
                },
                required: ['subject', 'body', 'linkedin_message'],
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'generate_outreach' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const outreach = JSON.parse(toolCall.function.arguments);
    
    console.log('Generated outreach subject:', outreach.subject);

    return new Response(
      JSON.stringify({ success: true, outreach }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in generate-outreach:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
