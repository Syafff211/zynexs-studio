import type { Metadata } from "next";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { UserManager, type UserRow } from "@/components/admin/user-manager";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "Kelola Pengguna",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin();
  const admin = createAdminClient();

  const [profilesResult, ordersResult, redemptionsResult] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("orders").select("user_id, total, status"),
    admin.from("promo_redemptions").select("user_id"),
  ]);

  const profiles = (profilesResult.data ?? []) as Profile[];
  const orders = (ordersResult.data ?? []) as {
    user_id: string | null;
    total: number;
    status: string;
  }[];
  const redemptions = (redemptionsResult.data ?? []) as { user_id: string | null }[];

  const users: UserRow[] = profiles.map((profile) => {
    const userOrders = orders.filter((order) => order.user_id === profile.id);
    return {
      ...profile,
      order_count: userOrders.length,
      total_spent: userOrders
        .filter((order) => ["paid", "processing", "completed"].includes(order.status))
        .reduce((sum, order) => sum + order.total, 0),
      redemption_count: redemptions.filter((r) => r.user_id === profile.id).length,
    };
  });

  return <UserManager users={users} currentUserId={currentAdmin.id} />;
}
