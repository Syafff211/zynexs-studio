"use client";

import * as React from "react";
import { Save, Lock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction, changePasswordAction } from "@/actions/auth";
import { uploadAvatarAction } from "@/actions/upload";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types";

export function AccountSettings({ profile }: { profile: Profile }) {
  const { success, error: toastError } = useToast();
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [avatar, setAvatar] = React.useState(profile.avatar_url);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const onProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    const formData = new FormData(event.currentTarget);
    formData.set("avatarUrl", avatar ?? "");
    const result = await updateProfileAction(null, formData);
    if (result.ok) success("Tersimpan", result.message);
    else toastError("Gagal", result.message);
    setSavingProfile(false);
  };

  const onPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    const form = event.currentTarget;
    const result = await changePasswordAction(null, new FormData(form));
    if (result.ok) {
      success("Password diubah", result.message);
      form.reset();
    } else {
      toastError("Gagal", result.message);
    }
    setSavingPassword(false);
  };

  const onAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadAvatarAction(formData);
    if (result.ok && result.url) {
      setAvatar(result.url);
      success("Foto profil diperbarui");
    } else {
      toastError("Gagal upload", result.message);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div id="settings" className="scroll-mt-24 space-y-4">
      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Pengaturan Akun</h2>
        <p className="mt-1 text-[13.5px] text-white/50">
          Perbarui informasi profil kamu. Email tidak dapat diubah.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <div className="relative">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt="Foto profil"
                className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/12"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-bold text-white">
                {initials(profile.full_name)}
              </span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              id="avatar"
              type="file"
              accept="image/*"
              onChange={onAvatar}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Ganti Foto
            </Button>
            <p className="mt-1.5 text-[12px] text-white/35">PNG, JPG, atau WEBP. Maks 4 MB.</p>
          </div>
        </div>

        <form onSubmit={onProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap" htmlFor="fullName" required>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={profile.full_name ?? ""}
              required
              minLength={2}
            />
          </Field>

          <Field label="Nomor WhatsApp" htmlFor="phone" hint="Contoh: 081234567890">
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              placeholder="08xxxxxxxxxx"
            />
          </Field>

          <Field label="Email" htmlFor="email" className="sm:col-span-2">
            <Input id="email" value={profile.email ?? ""} disabled readOnly />
          </Field>

          <div className="sm:col-span-2">
            <Button type="submit" loading={savingProfile}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Lock className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
          Ubah Password
        </h2>

        <form onSubmit={onPassword} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Password Baru" htmlFor="password" required hint="Minimal 8 karakter">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </Field>
          <Field label="Konfirmasi Password" htmlFor="confirmPassword" required>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary" loading={savingPassword}>
              Ubah Password
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
