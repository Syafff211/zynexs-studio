import type { Metadata } from "next";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { PromoManager, type RedemptionRow } from "@/components/admin/promo-manager";
import type { PromoCode } from "@/types";

export const metadata: Metadata = {
  title: "Kelola Promo",
  robots: { index: false, follow: false },
};

export default async function AdminPromoPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [promosResult, redemptionsResult] = await Promise.all([
    admin.from("promo_codes").select("*").order("created_at", { ascending: false }),
    admin
      .from("promo_redemptions")
      .select("id, promo_id, redeemed_at, amount, guest_email, user:profiles(full_name, email), order:orders(order_number)")
      .order("redeemed_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <PromoManager
      promos={(promosResult.data ?? []) as PromoCode[]}
      redemptions={(redemptionsResult.data ?? []) as unknown as RedemptionRow[]}
    />
  );
}
