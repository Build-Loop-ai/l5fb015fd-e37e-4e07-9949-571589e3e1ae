

## Problem
When someone remixes LeadPulse, the `platform_settings` table is created but the seed data (INSERT statements) from the migration may not carry over. This leaves the admin panel showing "No settings in this category" for every tab, with no way to fix it without running raw SQL.

## Solution: Auto-Seed on First Admin Visit

Add a "Seed Default Settings" button and auto-detection to the `PlatformSettings.tsx` admin component. When the table is empty, it will automatically insert all default rows so the admin can start configuring immediately.

### Changes

**1. Update `PlatformSettings.tsx` - Add empty state detection and seeding**

After fetching settings, if the result is an empty array, show a friendly message explaining this is a fresh remix and offer a single "Initialize Settings" button. When clicked, it inserts all default rows into `platform_settings` via the Supabase client, then reloads.

Default rows to seed (matching the original migration):
- **Branding**: `app_name`, `app_tagline`, `support_email`
- **Email**: `email_from_name`, `email_from_address`, `dashboard_url`
- **Stripe**: All 6 price/product ID fields (empty values for remixer to fill)
- **Legal**: `privacy_email`, `terms_url`, `privacy_url`

The component already has an INSERT RLS policy for admins, so this will work without any database changes.

**2. Update `get-platform-settings` edge function - Add fallback seeding**

As a second safety net, if the edge function (which uses the service role) finds zero rows, it will insert the defaults automatically before returning them. This ensures the frontend hook (`usePlatformSettings`) also works correctly even before the admin visits the settings page.

### User Experience After Fix

1. Remixer creates their copy
2. They sign up, assign themselves admin role
3. They visit `/admin` and go to Platform Settings
4. Instead of "No settings in this category", they see all fields pre-populated with defaults
5. They update values (app name, Stripe IDs, etc.) and click Save

No SQL required. No support tickets needed.

### Technical Details

- No database migration needed (the table and RLS policies already exist and support INSERT for admins)
- The default seed data uses empty strings for Stripe IDs so remixers know they need to add their own
- The edge function seeding uses the service role key, bypassing RLS
- `ON CONFLICT (key) DO NOTHING` ensures idempotency if some rows already exist
