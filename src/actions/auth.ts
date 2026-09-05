"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient, getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured, hasServiceRole } from "@/lib/env";
import { loginSchema, registerSchema, profileSchema, firstError } from "@/lib/validations";

export interface ActionState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const NOT_CONFIGURED: ActionState = {
  ok: false,
  message: "Supabase belum dikonfigurasi. Lihat README untuk setup environment variables.",
};

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Email atau password salah.";
  if (normalized.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Cek inbox kamu terlebih dahulu.";
  if (normalized.includes("user already registered") || normalized.includes("already been registered"))
    return "Email ini sudah terdaftar. Silakan login.";
  if (normalized.includes("password should be at least"))
    return "Password terlalu pendek, minimal 8 karakter.";
  if (normalized.includes("rate limit") || normalized.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  return message || "Terjadi kesalahan. Coba lagi.";
}

/* ------------------------------------------------------------------ */

export async function loginAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { ok: false, message: mapAuthError(error.message) };

  revalidatePath("/", "layout");
  return { ok: true, message: "Berhasil masuk. Mengalihkan…" };
}

export async function registerAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });

  if (error) return { ok: false, message: mapAuthError(error.message) };

  // Safety net in case the auth trigger has not been installed yet.
  if (data.user && hasServiceRole()) {
    try {
      const admin = createAdminClient();
      await admin.from("profiles").upsert(
        {
          id: data.user.id,
          full_name: parsed.data.fullName,
          email: parsed.data.email,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );
    } catch {
      /* trigger already handled it */
    }
  }

  if (!data.session) {
    return {
      ok: true,
      message: "Akun dibuat. Cek email kamu untuk konfirmasi sebelum login.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Akun berhasil dibuat. Mengalihkan…" };
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateProfileAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Kamu harus login terlebih dahulu." };

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") ?? "",
    avatarUrl: formData.get("avatarUrl") ?? "",
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      avatar_url: parsed.data.avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: "Gagal menyimpan profil. Coba lagi." };

  revalidatePath("/account");
  return { ok: true, message: "Profil berhasil diperbarui." };
}

export async function changePasswordAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) return { ok: false, message: "Password minimal 8 karakter." };
  if (password !== confirm) return { ok: false, message: "Konfirmasi password tidak cocok." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { ok: false, message: mapAuthError(error.message) };
  return { ok: true, message: "Password berhasil diubah." };
}
