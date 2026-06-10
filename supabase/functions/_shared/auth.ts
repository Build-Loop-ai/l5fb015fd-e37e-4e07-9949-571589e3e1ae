/**
 * Shared authentication helpers for edge functions.
 *
 * Every function here has verify_jwt = false (so public endpoints like the
 * tracking pixel and OAuth callbacks work), which means functions that act on
 * user data MUST authenticate the caller themselves.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface AuthResult {
  ok: boolean;
  status: number;
  error: string | null;
  isServiceRole: boolean;
  userId: string | null;
}

function deny(status: number, error: string): AuthResult {
  return { ok: false, status, error, isServiceRole: false, userId: null };
}

/**
 * Resolves the caller from the Authorization header. Accepts either the
 * service role key (internal calls) or a valid user JWT.
 */
export async function authenticate(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return deny(401, "Authorization required");
  }

  const token = authHeader.slice("Bearer ".length);
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (token === serviceRoleKey) {
    return { ok: true, status: 200, error: null, isServiceRole: true, userId: null };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return deny(401, "Unauthorized");
  }
  return { ok: true, status: 200, error: null, isServiceRole: false, userId: user.id };
}

/**
 * Like authenticate(), but also requires the user to have the 'admin' role.
 * Service-role callers are allowed through.
 */
export async function requireAdmin(req: Request): Promise<AuthResult> {
  const auth = await authenticate(req);
  if (!auth.ok || auth.isServiceRole) return auth;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) {
    return deny(403, "Admin access required");
  }
  return auth;
}

export function unauthorizedResponse(
  result: AuthResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
