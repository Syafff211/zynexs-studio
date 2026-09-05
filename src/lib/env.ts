/**
 * Centralised, typed access to environment variables.
 *
 * NEXT_PUBLIC_* values are inlined at build time and safe for the browser.
 * SUPABASE_SERVICE_ROLE_KEY is read lazily and only ever from server code —
 * `serviceRoleKey()` throws if it is somehow reached from a client bundle.
 */

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const env = {
  supabaseUrl: publicUrl,
  supabaseAnonKey: publicAnonKey,
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6285141308100",
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(publicUrl && publicAnonKey && publicUrl.startsWith("http"));
}

export function serviceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must never be read on the client.");
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diset. Tambahkan di .env.local (server-side only)."
    );
  }
  return key;
}

export function hasServiceRole(): boolean {
  return typeof window === "undefined" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
