import type { Metadata } from "next";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { PromoManager, type RedemptionRow } from "@/components/admin/promo-manager";
import type { PromoCode, PromoCodeWithProducts, PromoProductOption } from "@/types";

export const metadata: Metadata = {
  title: "Kelola Promo",
  robots: { index: false, follow: false },
};

interface PromoQueryRow extends PromoCode {
  promo_products: { product_id: string }[] | null;
}

export default async function AdminPromoPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const [promosResult, redemptionsResult, productsResult] = await Promise.all([
    admin
      .from("promo_codes")
      .select("*, promo_products(product_id)")
      .order("created_at", { ascending: false }),
    admin
      .from("promo_redemptions")
      .select(
        "id, promo_id, redeemed_at, amount, guest_email, user:profiles(full_name, email), order:orders(order_number)"
      )
      .order("redeemed_at", { ascending: false })
      .limit(200),
    admin
      .from("products")
      .select("id, name, slug, is_active, is_custom_price, category:categories(name)")
      .order("name", { ascending: true }),
  ]);

  const promos = ((promosResult.data ?? []) as unknown as PromoQueryRow[]).map(
    ({ promo_products: links, ...promo }): PromoCodeWithProducts => ({
      ...promo,
      product_ids: (links ?? []).map((link) => link.product_id),
    })
  );

  return (
    <PromoManager
      promos={promos}
      products={(productsResult.data ?? []) as unknown as PromoProductOption[]}
      redemptions={(redemptionsResult.data ?? []) as unknown as RedemptionRow[]}
    />
  );
}
