import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured, serviceRoleKey } from "@/lib/env";
import type { Profile } from "@/types";

/**
 * Server client bound to the request cookies — respects Row Level Security
 * and carries the signed-in user's identity.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — middleware refreshes the session.
        }
      },
    },
  });
}

/**
 * Anonymous, cookie-less client for PUBLIC data (catalog, CMS content).
 *
 * Why this exists: `createClient()` reads request cookies, and `cookies()`
 * throws in build-time contexts such as `generateStaticParams`, `sitemap.ts`
 * and static prerendering. Public catalog rows are identical for every
 * visitor, so there is nothing to personalise — reading them without a
 * session is both correct and cacheable.
 *
 * It still runs as the `anon` role, so RLS applies exactly as it would for a
 * signed-out visitor: only `is_active` rows are visible.
 */
let publicClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createPublicClient() {
  publicClient ??= createSupabaseClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "X-Client-Info": "zynex-studio-public" } },
  });
  return publicClient;
}

/**
 * Service-role client. Bypasses RLS, so it is used ONLY for trusted
 * server-side mutations (checkout pricing, promo redemption, admin writes).
 * Never import this module from a "use client" file.
 */
export function createAdminClient() {
  return createSupabaseClient(env.supabaseUrl, serviceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "X-Client-Info": "zynex-studio-server" } },
  });
}

export async function getSessionUser() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile) ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Server-side authorization gate for every admin action. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    throw new Error("FORBIDDEN");
  }
  return profile;
}

export async function isAdmin(): Promise<boolean> {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
