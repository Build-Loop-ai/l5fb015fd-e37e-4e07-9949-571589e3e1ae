export interface DefaultSettingRow {
  key: string;
  value: string;
  category: string;
  label: string;
  description: string;
  is_secret: boolean;
}

export const DEFAULT_PLATFORM_SETTINGS: DefaultSettingRow[] = [
  // Branding
  { key: 'app_name', value: 'LeadPulse', category: 'branding', label: 'App Name', description: 'The name of your application displayed across the platform', is_secret: false },
  { key: 'app_tagline', value: 'AI-Powered Lead Generation', category: 'branding', label: 'Tagline', description: 'Short description shown on the landing page and emails', is_secret: false },
  { key: 'support_email', value: 'support@yourdomain.com', category: 'branding', label: 'Support Email', description: 'Public-facing support email address', is_secret: false },

  // Email
  { key: 'email_from_name', value: 'LeadPulse', category: 'email', label: 'From Name', description: 'Sender name for transactional emails', is_secret: false },
  { key: 'email_from_address', value: 'onboarding@resend.dev', category: 'email', label: 'From Address', description: 'Must be a verified domain in Resend', is_secret: false },
  { key: 'dashboard_url', value: '', category: 'email', label: 'Dashboard URL', description: 'Your published app URL used in email links (e.g. https://yourapp.lovable.app)', is_secret: false },

  // Stripe
  { key: 'stripe_starter_price_id', value: '', category: 'stripe', label: 'Starter Price ID', description: 'Stripe Price ID for the Starter plan (starts with price_)', is_secret: false },
  { key: 'stripe_starter_product_id', value: '', category: 'stripe', label: 'Starter Product ID', description: 'Stripe Product ID for the Starter plan (starts with prod_)', is_secret: false },
  { key: 'stripe_growth_price_id', value: '', category: 'stripe', label: 'Growth Price ID', description: 'Stripe Price ID for the Growth plan', is_secret: false },
  { key: 'stripe_growth_product_id', value: '', category: 'stripe', label: 'Growth Product ID', description: 'Stripe Product ID for the Growth plan', is_secret: false },
  { key: 'stripe_scale_price_id', value: '', category: 'stripe', label: 'Scale Price ID', description: 'Stripe Price ID for the Scale plan', is_secret: false },
  { key: 'stripe_scale_product_id', value: '', category: 'stripe', label: 'Scale Product ID', description: 'Stripe Product ID for the Scale plan', is_secret: false },

  // Legal
  { key: 'privacy_email', value: 'privacy@yourdomain.com', category: 'legal', label: 'Privacy Email', description: 'Email for privacy-related inquiries', is_secret: false },
  { key: 'terms_url', value: '/terms', category: 'legal', label: 'Terms URL', description: 'Path or URL to your Terms of Service page', is_secret: false },
  { key: 'privacy_url', value: '/privacy', category: 'legal', label: 'Privacy URL', description: 'Path or URL to your Privacy Policy page', is_secret: false },
];
