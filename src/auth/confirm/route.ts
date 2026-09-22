import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Tujuan link verifikasi dari email Supabase (pola token_hash/PKCE).
 *
 * Template email membangun link seperti:
 *   <SITE_URL>/auth/confirm?token_hash=…&type=recovery&next=/reset-password
 *
 * Route ini menukar token_hash menjadi sesi (cookie server-side) lalu
 * mengarahkan user ke halaman `next`. Karena verifikasi terjadi lewat
 * aplikasi sendiri, link tidak lagi bergantung pada redirect `Site URL`
 * bawaan Supabase dan error-nya bisa ditampilkan dalam Bahasa Indonesia.
 */

const VERIFY_TYPES = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] as const);

type VerifyType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

/** Hanya izinkan path relatif — mencegah open redirect via `?next=//evil.com`. */
function safeRelativePath(value: string | null, fallback: string): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function describeVerifyError(raw: string): string {
  const normalized = raw.toLowerCase();
  if (normalized.includes("expired") || normalized.includes("invalid")) {
    return "Link email sudah kedaluwarsa atau pernah dipakai. Minta email baru lewat menu Lupa password / daftar lagi, lalu klik email yang PALING BARU segera.";
  }
  return "Verifikasi gagal. Minta email baru dan coba lagi.";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeRelativePath(url.searchParams.get("next"), "/");

  const verifyType =
    type && VERIFY_TYPES.has(type as VerifyType) ? (type as VerifyType) : null;

  if (!tokenHash || !verifyType) {
    return NextResponse.redirect(
      new URL(
        `/reset-password?error=invalid_link&error_description=${encodeURIComponent(
          "Link verifikasi tidak lengkap atau tidak dikenal."
        )}`,
        url.origin
      )
    );
  }

  let error: { message: string } | null = null;
  try {
    const supabase = await createClient();
    const result = await supabase.auth.verifyOtp({
      type: verifyType,
      token_hash: tokenHash,
    });
    error = result.error;
  } catch {
    error = { message: "network error" };
  }

  if (error) {
    // Untuk recovery tampilkan pesan di halaman reset-password; untuk
    // verifikasi signup arahkan ke /login agar user mencoba masuk lagi.
    const errorTarget = verifyType === "recovery" ? next : "/login";
    return NextResponse.redirect(
      new URL(
        `${errorTarget}?error=verify_failed&error_description=${encodeURIComponent(
          describeVerifyError(error.message)
        )}`,
        url.origin
      )
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
