import type { Metadata } from "next";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { OrderTable } from "@/components/admin/order-table";
import type { OrderWithItems } from "@/types";

export const metadata: Metadata = {
  title: "Kelola Pesanan",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(300);

  return <OrderTable orders={(data ?? []) as unknown as OrderWithItems[]} />;
}
