import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Plan configuration
const PLANS = {
  'prod_TiXHpO8ijpKqTp': { id: 'starter', name: 'Starter', credits: 250 },
  'prod_TiXHO7iMyHkneq': { id: 'growth', name: 'Growth', credits: 1000 },
  'prod_TiXH8Xv4s6tGGb': { id: 'scale', name: 'Scale', credits: 2500 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      
      // Update subscription record in database
      await supabaseClient
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: 'free',
          status: 'active',
          credits_limit: 10,
        }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({
        subscribed: false,
        plan_id: 'free',
        plan_name: 'Free',
        credits_limit: 10,
        credits_used: 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let planId = 'free';
    let planName = 'Free';
    let creditsLimit = 10;
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      stripeSubscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      const productId = subscription.items.data[0].price.product as string;
      const planConfig = PLANS[productId as keyof typeof PLANS];
      
      if (planConfig) {
        planId = planConfig.id;
        planName = planConfig.name;
        creditsLimit = planConfig.credits;
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        productId, 
        planId, 
        creditsLimit 
      });
    }

    // Get current credits used from database
    const { data: subData } = await supabaseClient
      .from('subscriptions')
      .select('credits_used')
      .eq('user_id', user.id)
      .single();

    const creditsUsed = subData?.credits_used || 0;

    // Update subscription record
    await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: stripeSubscriptionId,
        plan_id: planId,
        status: hasActiveSub ? 'active' : 'inactive',
        credits_limit: creditsLimit,
        current_period_end: subscriptionEnd,
      }, { onConflict: 'user_id' });

    logStep("Subscription data updated in database");

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan_id: planId,
      plan_name: planName,
      credits_limit: creditsLimit,
      credits_used: creditsUsed,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
