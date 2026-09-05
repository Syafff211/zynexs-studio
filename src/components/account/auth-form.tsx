"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User as UserIcon, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { loginAction, registerAction, type ActionState } from "@/actions/auth";
import { Logo } from "@/components/layout/logo";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();
  const [pending, setPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [state, setState] = React.useState<ActionState | null>(null);

  const next = searchParams.get("next") || "/account";
  const isLogin = mode === "login";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setState(null);
    const formData = new FormData(event.currentTarget);

    try {
      const result = isLogin
        ? await loginAction(null, formData)
        : await registerAction(null, formData);

      setState(result);

      if (result.ok) {
        success(isLogin ? "Berhasil masuk" : "Akun dibuat", result.message);
        if (result.message.includes("Cek email")) {
          setPending(false);
          return;
        }
        router.replace(next);
        router.refresh();
      } else {
        toastError("Gagal", result.message);
        setPending(false);
      }
    } catch {
      toastError("Terjadi kesalahan", "Coba lagi dalam beberapa saat.");
      setPending(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-7 text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
          {isLogin ? "Selamat datang kembali" : "Buat akun Zynex"}
        </h1>
        <p className="mt-2 text-[14.5px] text-white/50">
          {isLogin
            ? "Masuk untuk melihat pesanan dan riwayat promo kamu."
            : "Daftar gratis, checkout lebih cepat, riwayat tersimpan rapi."}
        </p>
      </div>

      <GlassCard solid className="p-6 sm:p-7">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!isLogin && (
            <Field label="Nama Lengkap" htmlFor="fullName" required>
              <div className="relative">
                <UserIcon
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                  aria-hidden="true"
                />
                <Input
                  id="fullName"
                  name="fullName"
                  className="pl-10"
                  placeholder="Muhammad"
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </div>
            </Field>
          )}

          <Field label="Email" htmlFor="email" required>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                aria-hidden="true"
              />
              <Input
                id="email"
                name="email"
                type="email"
                className="pl-10"
                placeholder="kamu@email.com"
                autoComplete="email"
                required
              />
            </div>
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            hint={isLogin ? undefined : "Minimal 8 karakter"}
          >
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                aria-hidden="true"
              />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-11"
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                minLength={isLogin ? 6 : 8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/40 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {state && !state.ok && (
            <p
              role="alert"
              className="rounded-xl bg-rose-500/10 px-3.5 py-3 text-[13.5px] text-rose-200 ring-1 ring-inset ring-rose-400/25"
            >
              {state.message}
            </p>
          )}

          {state?.ok && state.message.includes("Cek email") && (
            <p
              role="status"
              className="rounded-xl bg-emerald-500/10 px-3.5 py-3 text-[13.5px] text-emerald-200 ring-1 ring-inset ring-emerald-400/25"
            >
              {state.message}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={pending}>
            {isLogin ? "Masuk" : "Daftar Sekarang"}
            {!pending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13.5px] text-white/50">
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-semibold text-brand-200 hover:text-brand-100"
          >
            {isLogin ? "Daftar gratis" : "Masuk di sini"}
          </Link>
        </p>
      </GlassCard>

      <p className="mt-5 text-center text-[12.5px] leading-relaxed text-white/35">
        Dengan melanjutkan, kamu menyetujui syarat layanan Zynex Studio.{" "}
        <Link href="/" className="underline underline-offset-2 hover:text-white/60">
          Kembali ke beranda
        </Link>
      </p>
    </div>
  );
}
