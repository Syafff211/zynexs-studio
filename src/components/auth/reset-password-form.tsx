"use client";

import * as React from "react";
import Link from "next/link";
import { Check, KeyRound, TriangleAlert } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Halaman tujuan link "reset password" dari email Supabase.
 *
 * Mendukung kedua flow auth Supabase:
 *  - PKCE: link berisi `?code=…` → supabase-js menukar kode menjadi sesi
 *    secara otomatis (detectSessionInUrl), komponen ini menunggu event-nya.
 *  - Implicit: link berisi `#access_token=…&refresh_token=…` → juga
 *    ditangani otomatis oleh supabase-js.
 * Setelah sesi terbentuk, user memasukkan password baru via updateUser().
 */
export function ResetPasswordForm({
  urlError,
  urlErrorDescription,
}: {
  urlError?: string;
  urlErrorDescription?: string;
}) {
  const configured = isSupabaseConfigured();

  // Kondisi error awal bersifat sinkron → dihitung di initial state,
  // bukan di effect (aturan react-hooks/set-state-in-effect).
  const [phase, setPhase] = React.useState<"waiting" | "ready" | "done" | "error">(() => {
    if (urlError || !configured) return "error";
    return "waiting";
  });
  const [notice, setNotice] = React.useState(() => {
    if (urlError) {
      return (
        urlErrorDescription ||
        "Link reset tidak valid atau sudah kedaluwarsa. Minta link baru lewat popup lupa password."
      );
    }
    if (!configured) return "Supabase belum dikonfigurasi di environment ini.";
    return "";
  });
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (phase !== "waiting") return;

    const supabase = createClient();

    let settled = false;
    const markReady = () => {
      if (!settled) {
        settled = true;
        setPhase("ready");
      }
    };

    // Recovery link sudah ditukar menjadi sesi oleh supabase-js.
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") markReady();
    });

    // Link rusak / browser aneh → jangan menggantung selamanya.
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        setPhase("error");
        setNotice(
          "Link reset tidak terdeteksi. Pastikan membuka link terbaru dari email, atau minta link reset baru."
        );
      }
    }, 6000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(
          updateError.message.includes("at least")
            ? "Password terlalu pendek, minimal 8 karakter."
            : "Gagal mengubah password. Coba lagi."
        );
        return;
      }
      setPhase("done");
    } catch {
      setError("Terjadi kesalahan. Coba lagi beberapa saat.");
    } finally {
      setSaving(false);
    }
  };

  if (phase === "waiting") {
    return (
      <GlassCard solid className="p-6 text-center">
        <p className="text-[14px] text-white/60">Memverifikasi link reset…</p>
      </GlassCard>
    );
  }

  if (phase === "error") {
    return (
      <GlassCard solid className="p-6">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
          <p className="text-[13.5px] leading-relaxed text-amber-100/85">{notice}</p>
        </div>
        <Link href="/login" className={buttonStyles("secondary", "md", "mt-5 w-full")}>
          Kembali ke halaman masuk
        </Link>
      </GlassCard>
    );
  }

  if (phase === "done") {
    return (
      <GlassCard solid className="p-6">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
          <div>
            <p className="font-semibold text-emerald-100">Password berhasil diubah</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-emerald-100/70">
              Silakan masuk dengan password barumu.
            </p>
          </div>
        </div>
        <Link href="/login" className={buttonStyles("primary", "md", "mt-5 w-full")}>
          Masuk sekarang
        </Link>
      </GlassCard>
    );
  }

  return (
    <GlassCard solid className="p-6">
      {error && (
        <p
          className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-[13px] text-rose-200"
          role="alert"
        >
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Password baru" htmlFor="reset-password" required hint="Minimal 8 karakter">
          <Input
            id="reset-password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
        <Field label="Konfirmasi password baru" htmlFor="reset-confirm" required>
          <Input
            id="reset-confirm"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          Simpan Password Baru
        </Button>
      </form>
    </GlassCard>
  );
}
