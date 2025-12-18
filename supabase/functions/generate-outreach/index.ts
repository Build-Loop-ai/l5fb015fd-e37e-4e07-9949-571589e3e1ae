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
    const { lead, template, tone } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!lead) {
      throw new Error('Lead information is required');
    }

    console.log('Generating outreach for:', lead.name);

    const systemPrompt = `You are an expert sales copywriter who writes personalized, high-converting cold outreach messages. Your messages are:
- Personalized based on the recipient's background
- Concise and respectful of their time
- Value-focused rather than sales-y
- Professional but warm
- Include a clear but soft call-to-action

Write in a ${tone || 'professional'} tone.`;

    const userPrompt = `Write a personalized cold outreach email for this lead:

Name: ${lead.name}
Title: ${lead.title || 'Professional'}
Company: ${lead.company || 'their company'}
Location: ${lead.location || ''}
Industry: ${lead.industry || ''}

${lead.profile_data?.summary ? `About them: ${lead.profile_data.summary}` : ''}
${lead.profile_data?.headline ? `Headline: ${lead.profile_data.headline}` : ''}
${lead.profile_data?.currentCompany ? `Current company: ${lead.profile_data.currentCompany}` : ''}

${template ? `Use this as inspiration for the message theme: ${template}` : 'Write about how we can help them grow their business.'}

Return a JSON object with:
- subject: A compelling email subject line (max 60 chars)
- body: The email body (use {{first_name}} as placeholder)
- linkedin_message: A shorter version for LinkedIn DM (max 300 chars)`;

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
                  body: { type: 'string', description: 'Email body with {{first_name}} placeholder' },
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
    
    // Replace placeholder with actual first name
    const firstName = lead.name.split(' ')[0];
    outreach.body = outreach.body.replace(/\{\{first_name\}\}/g, firstName);
    outreach.linkedin_message = outreach.linkedin_message.replace(/\{\{first_name\}\}/g, firstName);

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
