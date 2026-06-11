import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmailConnection } from "@/hooks/useEmailConnection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2, XCircle, AlertTriangle, Rocket, RefreshCw,
  Database, Search, Mail, PartyPopper,
} from "lucide-react";

interface Integration {
  name: string;
  configured: boolean;
  connected: boolean | null;
  error: string | null;
  secrets: string[];
}

interface HealthResponse {
  success: boolean;
  integrations: Integration[];
}

// Optional add-ons (Exa is core; Google/Resend are covered by the email step).
const UNLOCKS: Record<string, string> = {
  "Apify (Enrichment)": "Richer lead data and deeper enrichment",
  "Stripe (Payments)": "Charge clients and take payments",
};
const OPTIONAL = ["Apify (Enrichment)", "Stripe (Payments)"];

function StatusDot({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
    : <XCircle className="h-5 w-5 text-muted-foreground/50 shrink-0" />;
}

export function LaunchChecklist({ onConnectEmail }: { onConnectEmail?: () => void }) {
  const { connection } = useEmailConnection();
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);

  const run = async () => {
    setLoading(true);
    setDbError(null);

    // 1. DB probe — a core table erroring means migrations aren't applied or a
    //    free Supabase project is paused.
    const { error } = await supabase.from("leads").select("id").limit(1);
    if (error) {
      setDbReady(false);
      setDbError(error.message);
    } else {
      setDbReady(true);
    }

    // 2. Integration / secret status (best-effort)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check`,
        { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } },
      );
      if (res.ok) {
        const json: HealthResponse = await res.json();
        setIntegrations(json.integrations ?? []);
      }
    } catch {
      // leave null; core checks still render
    }

    setLoading(false);
  };

  useEffect(() => { run(); }, []);

  const exa = integrations?.find((i) => i.name.includes("Exa"));
  const searchReady = !!exa?.configured;
  const emailConnected = !!connection;
  const isLive = dbReady === true && searchReady;
  const optionalAddons = (integrations ?? []).filter((i) => OPTIONAL.includes(i.name));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero status */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 ${
        isLive ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            isLive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {isLive ? <PartyPopper className="h-6 w-6" /> : <Rocket className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight">
              {isLive ? "Ready to find leads" : "Let's get you set up"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLive
                ? "You can search for leads now. Connect email below to send outreach."
                : "Two checks before you can start finding leads."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={run} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Re-check
          </Button>
        </div>
      </div>

      {/* Core */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required to find leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <StatusDot ok={dbReady === true} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <Database className="h-4 w-4 text-muted-foreground" /> Database connected
              </div>
              {dbReady === true ? (
                <p className="text-sm text-muted-foreground mt-0.5">Your tables are set up and reachable.</p>
              ) : (
                <p className="text-sm text-destructive mt-0.5">
                  Can't reach your database. Apply the migrations in <code className="font-mono">supabase/migrations</code>,
                  and if this is a free Supabase project, make sure it isn't paused.
                  {dbError && <span className="block text-xs text-muted-foreground mt-1">({dbError})</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <StatusDot ok={searchReady} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <Search className="h-4 w-4 text-muted-foreground" /> Lead search ready
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {searchReady
                  ? "Exa is connected — the AI can find leads."
                  : "Add your Exa key in Settings → Backend → Secrets (EXA_API_KEY) to power lead search."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send outreach */}
      <Card className={isLive ? "border-primary/30" : ""}>
        <CardHeader>
          <CardTitle className="text-base">Send outreach</CardTitle>
          <CardDescription>Connect your inbox so the AI can send the emails it drafts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <StatusDot ok={emailConnected} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email connected
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {emailConnected
                  ? `Sending from ${connection?.email}.`
                  : "Connect your Gmail in Settings to send outreach from your own inbox."}
              </p>
            </div>
            {!emailConnected && onConnectEmail && (
              <Button size="sm" variant="outline" onClick={onConnectEmail} className="shrink-0">
                Connect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Free-tier warning */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-amber-900">Running this for clients?</p>
          <p className="text-amber-800 mt-0.5">
            Free Supabase projects pause after about a week of inactivity, and the app stops working until it's woken.
            For client work, use a paid Supabase project so it never sleeps.
          </p>
        </div>
      </div>

      {/* Optional add-ons */}
      {optionalAddons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unlock more (optional)</CardTitle>
            <CardDescription>
              Add a key in <span className="font-medium text-foreground">Settings → Backend → Secrets</span> to switch each on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {optionalAddons.map((it) => (
              <div key={it.name} className="flex items-start gap-3 rounded-xl border border-border p-4">
                <StatusDot ok={it.configured} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{it.name}</div>
                  <p className="text-sm text-muted-foreground mt-0.5">{UNLOCKS[it.name] ?? "Optional integration"}</p>
                  {!it.configured && (
                    <p className="text-xs text-muted-foreground/80 mt-1 font-mono">Needs: {it.secrets.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LaunchChecklist;
