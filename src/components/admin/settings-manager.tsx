"use client";

import * as React from "react";
import { Save, Sparkles, Megaphone, Layout, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { saveSiteSettingsAction } from "@/actions/admin";
import type { SiteSettings } from "@/types";

export function SettingsManager({ settings }: { settings: SiteSettings }) {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = React.useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const result = await saveSiteSettingsAction(null, new FormData(event.currentTarget));
    if (result.ok) success(result.message);
    else toastError("Gagal", result.message);
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Landing CMS</h1>
          <p className="mt-1.5 text-[14.5px] text-white/50">
            Ubah konten landing page tanpa menyentuh kode.
          </p>
        </div>
        <Button type="submit" loading={saving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Simpan Semua
        </Button>
      </header>

      {/* Hero */}
      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
          <Sparkles className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
          Hero Section
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Badge" htmlFor="hero_badge" className="sm:col-span-2">
            <Input id="hero_badge" name="hero_badge" defaultValue={settings.hero_badge} maxLength={80} />
          </Field>
          <Field label="Judul" htmlFor="hero_title" required>
            <Input id="hero_title" name="hero_title" defaultValue={settings.hero_title} required />
          </Field>
          <Field label="Judul Highlight" htmlFor="hero_highlight" hint="Bagian dengan gradient">
            <Input id="hero_highlight" name="hero_highlight" defaultValue={settings.hero_highlight} />
          </Field>
          <Field label="Subjudul" htmlFor="hero_subtitle" className="sm:col-span-2" required>
            <Textarea
              id="hero_subtitle"
              name="hero_subtitle"
              defaultValue={settings.hero_subtitle}
              rows={2}
              required
            />
          </Field>
          <Field label="CTA Utama — Label" htmlFor="hero_cta_label" required>
            <Input id="hero_cta_label" name="hero_cta_label" defaultValue={settings.hero_cta_label} required />
          </Field>
          <Field label="CTA Utama — Link" htmlFor="hero_cta_href" required>
            <Input id="hero_cta_href" name="hero_cta_href" defaultValue={settings.hero_cta_href} required />
          </Field>
          <Field label="CTA Kedua — Label" htmlFor="hero_secondary_label" required>
            <Input
              id="hero_secondary_label"
              name="hero_secondary_label"
              defaultValue={settings.hero_secondary_label}
              required
            />
          </Field>
          <Field label="CTA Kedua — Link" htmlFor="hero_secondary_href" required>
            <Input
              id="hero_secondary_href"
              name="hero_secondary_href"
              defaultValue={settings.hero_secondary_href}
              required
            />
          </Field>
          <Field
            label="Statistik"
            htmlFor="stats"
            className="sm:col-span-2"
            hint="Satu per baris — format: nilai | label"
          >
            <Textarea
              id="stats"
              name="stats"
              rows={4}
              defaultValue={settings.stats.map((s) => `${s.value} | ${s.label}`).join("\n")}
            />
          </Field>
        </div>
      </GlassCard>

      {/* Benefits */}
      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
          <Layout className="h-4.5 w-4.5 text-emerald-300" aria-hidden="true" />
          Benefits
        </h2>
        <Field
          label="Daftar Benefit"
          htmlFor="benefits"
          className="mt-4"
          hint="Satu per baris — format: IconLucide | Judul | Deskripsi. Contoh icon: Wallet, Zap, Sparkles, Headphones, MousePointerClick, ShieldCheck"
        >
          <Textarea
            id="benefits"
            name="benefits"
            rows={7}
            defaultValue={settings.benefits
              .map((b) => `${b.icon} | ${b.title} | ${b.description}`)
              .join("\n")}
          />
        </Field>
      </GlassCard>

      {/* Promo banner */}
      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
          <Megaphone className="h-4.5 w-4.5 text-violet-300" aria-hidden="true" />
          Promo Banner
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Checkbox
              name="promo_banner_enabled"
              label="Tampilkan promo banner di landing page"
              defaultChecked={settings.promo_banner_enabled}
            />
          </div>
          <Field label="Judul Banner" htmlFor="promo_banner_title">
            <Input
              id="promo_banner_title"
              name="promo_banner_title"
              defaultValue={settings.promo_banner_title}
            />
          </Field>
          <Field label="Kode Promo Ditampilkan" htmlFor="promo_banner_code">
            <Input
              id="promo_banner_code"
              name="promo_banner_code"
              defaultValue={settings.promo_banner_code}
              className="font-mono uppercase"
            />
          </Field>
          <Field label="Teks Banner" htmlFor="promo_banner_text" className="sm:col-span-2">
            <Input
              id="promo_banner_text"
              name="promo_banner_text"
              defaultValue={settings.promo_banner_text}
            />
          </Field>
        </div>
      </GlassCard>

      {/* Footer & contact */}
      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
          <Share2 className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
          Footer &amp; Kontak
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Deskripsi Footer" htmlFor="footer_description" className="sm:col-span-2">
            <Textarea
              id="footer_description"
              name="footer_description"
              rows={2}
              defaultValue={settings.footer_description}
            />
          </Field>
          <Field label="Copyright" htmlFor="footer_copyright">
            <Input
              id="footer_copyright"
              name="footer_copyright"
              defaultValue={settings.footer_copyright}
            />
          </Field>
          <Field
            label="Nomor WhatsApp"
            htmlFor="whatsapp_number"
            required
            hint="Format internasional tanpa +, contoh: 6285141308100"
          >
            <Input
              id="whatsapp_number"
              name="whatsapp_number"
              defaultValue={settings.whatsapp_number}
              pattern="[0-9]{8,20}"
              required
            />
          </Field>
          <Field label="Email Support" htmlFor="support_email" required>
            <Input
              id="support_email"
              name="support_email"
              type="email"
              defaultValue={settings.support_email}
              required
            />
          </Field>
          <Field
            label="Social Links"
            htmlFor="social_links"
            className="sm:col-span-2"
            hint="Satu per baris — format: Label | URL | IconLucide"
          >
            <Textarea
              id="social_links"
              name="social_links"
              rows={4}
              defaultValue={settings.social_links
                .map((s) => `${s.label} | ${s.url} | ${s.icon}`)
                .join("\n")}
            />
          </Field>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={saving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Simpan Semua Perubahan
        </Button>
      </div>
    </form>
  );
}
