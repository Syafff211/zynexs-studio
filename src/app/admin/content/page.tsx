import type { Metadata } from "next";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { ContentManager } from "@/components/admin/content-manager";
import type { Announcement, Faq } from "@/types";

export const metadata: Metadata = {
  title: "Kelola Konten",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [faqsResult, announcementsResult] = await Promise.all([
    admin.from("faqs").select("*").order("sort_order", { ascending: true }),
    admin.from("announcements").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <ContentManager
      faqs={(faqsResult.data ?? []) as Faq[]}
      announcements={(announcementsResult.data ?? []) as Announcement[]}
    />
  );
}
