import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/server";
import { getSiteSettings } from "@/services/catalog";
import { SettingsManager } from "@/components/admin/settings-manager";

export const metadata: Metadata = {
  title: "Landing Page CMS",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return <SettingsManager settings={settings} />;
}
