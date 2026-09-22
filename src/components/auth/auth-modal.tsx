"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, LogIn, MailCheck, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { loginAction, registerAction, requestPasswordResetAction } from "@/actions/auth";

type AuthMode = "login" | "register" | "forgot";

/**
 * Popup login / daftar / lupa password untuk checkout.
 * Tidak pernah mengarahkan ke /login atau /register — setelah berhasil,
 * `onAuthenticated()` dipanggil agar checkout langsung dilanjutkan.
 */
export function AuthModal({
  open,
  onClose,
  onAuthenticated,
  initialMode = "login",
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  initialMode?: AuthMode;
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<AuthMode>(initialMode);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");

  // Catatan: state tidak di-reset via effect — CheckoutView memasang komponen
  // ini secara kondisional (hanya saat terbuka) sehingga selalu mulai bersih.

  const finishAuthenticated = React.useCallback(() => {
    router.refresh(); // navbar & data server-component ikut segar
    onAuthenticated();
  }, [router, onAuthenticated]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    setNotice("");
    setPending(true);
    try {
      const formData = new FormData(event.currentTarget);
      const result = await loginAction(null, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      finishAuthenticated();
    } catch {
      setError("Terjadi kesalahan. Coba lagi beberapa saat.");
    } finally {
      setPending(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    setNotice("");
    setPending(true);
    try {
      const formData = new FormData(event.currentTarget);
      const password = String(formData.get("password") ?? "");
      const confirm = String(formData.get("confirmPassword") ?? "");
      if (password !== confirm) {
        setError("Konfirmasi password tidak cocok.");
        return;
      }
      const result = await registerAction(null, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (/konfirmasi/i.test(result.message)) {
        // Email confirmation aktif → belum ada sesi; user konfirmasi via email dulu.
        setNotice(result.message + " Setelah konfirmasi, masuk lagi di sini untuk melanjutkan checkout.");
        setMode("login");
        return;
      }
      finishAuthenticated();
    } catch {
      setError("Terjadi kesalahan. Coba lagi beberapa saat.");
    } finally {
      setPending(false);
    }
  };

  const handleForgot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    setNotice("");
    setPending(true);
    try {
      const formData = new FormData(event.currentTarget);
      const result = await requestPasswordResetAction(null, formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice(result.message);
    } catch {
      setError("Terjadi kesalahan. Coba lagi beberapa saat.");
    } finally {
      setPending(false);
    }
  };

  const title =
    mode === "login" ? "Masuk untuk lanjut checkout" : mode === "register" ? "Daftar akun baru" : "Reset password";

  const description =
    mode === "forgot"
      ? "Masukkan email terdaftar — kami kirim instruksi reset password."
      : "Pesanan hanya bisa dibuat dari akun. Setelah berhasil, checkout langsung dilanjutkan otomatis.";

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      {notice ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] p-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
            <p className="text-[13.5px] leading-relaxed text-emerald-100/90">{notice}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="md" className="flex-1" onClick={() => setNotice("")}>
              Kembali
            </Button>
            {mode === "login" && (
              <Button variant="primary" size="md" className="flex-1" onClick={() => setNotice("")}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Masuk
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {mode !== "forgot" && (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.05] p-1" role="tablist">
              {(["login", "register"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mode === tab}
                  onClick={() => {
                    setMode(tab);
                    setError("");
                  }}
                  className={
                    "rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors " +
                    (mode === tab ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80")
                  }
                >
                  {tab === "login" ? "Masuk" : "Daftar"}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-rose-400/25 bg-rose-500/[0.08] px-3.5 py-2.5 text-[13px] text-rose-200" role="alert">
              {error}
            </p>
          )}

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email" htmlFor="auth-login-email" required>
                <Input id="auth-login-email" name="email" type="email" placeholder="kamu@email.com" autoComplete="email" required />
              </Field>
              <Field label="Password" htmlFor="auth-login-password" required>
                <Input id="auth-login-password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
              </Field>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={pending}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Masuk &amp; Lanjut Checkout
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                }}
                className="mx-auto flex items-center gap-1.5 text-[13px] font-medium text-brand-200 hover:text-brand-100"
              >
                <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                Lupa password?
              </button>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="Nama Lengkap" htmlFor="auth-register-name" required>
                <Input id="auth-register-name" name="fullName" placeholder="Muhammad" autoComplete="name" required minLength={2} />
              </Field>
              <Field label="Email" htmlFor="auth-register-email" required>
                <Input id="auth-register-email" name="email" type="email" placeholder="kamu@email.com" autoComplete="email" required />
              </Field>
              <Field label="Password" htmlFor="auth-register-password" required hint="Minimal 8 karakter">
                <Input id="auth-register-password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" required minLength={8} />
              </Field>
              <Field label="Konfirmasi Password" htmlFor="auth-register-confirm" required>
                <Input id="auth-register-confirm" name="confirmPassword" type="password" placeholder="••••••••" autoComplete="new-password" required minLength={8} />
              </Field>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={pending}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Daftar &amp; Lanjut Checkout
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <Field label="Email terdaftar" htmlFor="auth-forgot-email" required>
                <Input id="auth-forgot-email" name="email" type="email" placeholder="kamu@email.com" autoComplete="email" required />
              </Field>
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={pending}>
                Kirim Email Reset
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="mx-auto flex items-center gap-1.5 text-[13px] font-medium text-white/55 hover:text-white/85"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Kembali ke masuk
              </button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
