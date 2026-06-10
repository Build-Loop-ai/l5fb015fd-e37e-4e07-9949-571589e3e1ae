-- Security hardening
--
-- 1. Billing bypass: "Users can update their own subscription" let any user
--    set their own credits_limit / credits_used to anything via the client
--    (e.g. unlimited credits, used = 0). Subscriptions are managed only by
--    the signup trigger and service-role edge functions (Stripe webhook,
--    credit increments), so users need no direct write access. Same for the
--    self-insert policy and the credit_usage audit table.
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own credit usage" ON public.credit_usage;

-- 2. Defense in depth: never let credit counters go negative.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_credits_nonneg') THEN
    UPDATE public.subscriptions SET credits_used = 0 WHERE credits_used < 0;
    UPDATE public.subscriptions SET credits_limit = 0 WHERE credits_limit < 0;
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_credits_nonneg
      CHECK (credits_used >= 0 AND credits_limit >= 0);
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping subscriptions credits check: %', SQLERRM;
END $$;

-- 3. Referential integrity: email_connections (Gmail OAuth tokens) stored
--    user_id with no foreign key, so tokens were orphaned when a user was
--    deleted. Cascade-delete them with the user.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_connections_user_id_fkey') THEN
    DELETE FROM public.email_connections ec
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ec.user_id);
    ALTER TABLE public.email_connections
      ADD CONSTRAINT email_connections_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping email_connections FK: %', SQLERRM;
END $$;

-- 4. A previous migration seeded a hardcoded admin user_id that only exists in
--    the template author's project. In a buyer's database it is an orphaned row
--    (no matching auth.users) and grants admin to a stranger's UUID if that id
--    is ever registered. Remove it; buyers assign their own admin after signup.
DELETE FROM public.user_roles
WHERE user_id = '634e0408-40f2-41e2-a974-1bae080d4fe4'
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = '634e0408-40f2-41e2-a974-1bae080d4fe4'
  );
