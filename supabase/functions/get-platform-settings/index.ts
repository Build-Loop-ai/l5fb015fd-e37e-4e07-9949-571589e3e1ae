import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SETTINGS = [
  { key: 'app_name', value: 'LeadPulse', category: 'branding', label: 'App Name', description: 'The name of your application displayed across the platform', is_secret: false },
  { key: 'app_tagline', value: 'AI-Powered Lead Generation', category: 'branding', label: 'Tagline', description: 'Short description shown on the landing page and emails', is_secret: false },
  { key: 'support_email', value: 'support@yourdomain.com', category: 'branding', label: 'Support Email', description: 'Public-facing support email address', is_secret: false },
  { key: 'email_from_name', value: 'LeadPulse', category: 'email', label: 'From Name', description: 'Sender name for transactional emails', is_secret: false },
  { key: 'email_from_address', value: 'onboarding@resend.dev', category: 'email', label: 'From Address', description: 'Must be a verified domain in Resend', is_secret: false },
  { key: 'dashboard_url', value: '', category: 'email', label: 'Dashboard URL', description: 'Your published app URL used in email links', is_secret: false },
  { key: 'stripe_starter_price_id', value: '', category: 'stripe', label: 'Starter Price ID', description: 'Stripe Price ID for the Starter plan', is_secret: false },
  { key: 'stripe_starter_product_id', value: '', category: 'stripe', label: 'Starter Product ID', description: 'Stripe Product ID for the Starter plan', is_secret: false },
  { key: 'stripe_growth_price_id', value: '', category: 'stripe', label: 'Growth Price ID', description: 'Stripe Price ID for the Growth plan', is_secret: false },
  { key: 'stripe_growth_product_id', value: '', category: 'stripe', label: 'Growth Product ID', description: 'Stripe Product ID for the Growth plan', is_secret: false },
  { key: 'stripe_scale_price_id', value: '', category: 'stripe', label: 'Scale Price ID', description: 'Stripe Price ID for the Scale plan', is_secret: false },
  { key: 'stripe_scale_product_id', value: '', category: 'stripe', label: 'Scale Product ID', description: 'Stripe Product ID for the Scale plan', is_secret: false },
  { key: 'privacy_email', value: 'privacy@yourdomain.com', category: 'legal', label: 'Privacy Email', description: 'Email for privacy-related inquiries', is_secret: false },
  { key: 'terms_url', value: '/terms', category: 'legal', label: 'Terms URL', description: 'Path or URL to your Terms of Service page', is_secret: false },
  { key: 'privacy_url', value: '/privacy', category: 'legal', label: 'Privacy URL', description: 'Path or URL to your Privacy Policy page', is_secret: false },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all non-secret settings
    let { data: settingsRows, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .eq('is_secret', false);

    if (error) {
      console.error('Error fetching settings:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Auto-seed if table is empty
    if (!settingsRows || settingsRows.length === 0) {
      console.log('No platform settings found — seeding defaults');
      const { error: seedError } = await supabase
        .from('platform_settings')
        .upsert(DEFAULT_SETTINGS, { onConflict: 'key' });

      if (seedError) {
        console.error('Error seeding defaults:', seedError);
      } else {
        // Re-fetch after seeding
        const refetch = await supabase
          .from('platform_settings')
          .select('key, value')
          .eq('is_secret', false);
        settingsRows = refetch.data;
      }
    }

    // Convert to key-value object
    const settings: Record<string, string> = {};
    settingsRows?.forEach(row => {
      settings[row.key] = row.value;
    });

    return new Response(
      JSON.stringify({ settings }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
