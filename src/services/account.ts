import "server-only";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { Order, OrderWithItems, PromoRedemption, PromoCode } from "@/types";

export interface AccountStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  spent: number;
}

export async function getUserOrders(userId: string, limit = 100): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as unknown as OrderWithItems[];
}

export function computeAccountStats(orders: Order[]): AccountStats {
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing" || o.status === "paid").length,
    completed: orders.filter((o) => o.status === "completed").length,
    spent: orders
      .filter((o) => ["paid", "processing", "completed"].includes(o.status))
      .reduce((sum, o) => sum + o.total, 0),
  };
}

export interface RedemptionWithPromo extends PromoRedemption {
  promo: Pick<PromoCode, "code" | "discount_type" | "discount_value"> | null;
  order: Pick<Order, "order_number"> | null;
}

export async function getUserRedemptions(userId: string): Promise<RedemptionWithPromo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_redemptions")
    .select("*, promo:promo_codes(code, discount_type, discount_value), order:orders(order_number)")
    .eq("user_id", userId)
    .order("redeemed_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as unknown as RedemptionWithPromo[];
}

export async function getUserOrderDetail(
  orderId: string,
  userId: string
): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as OrderWithItems;
}

/* ------------------------------------------------------------------ */
/*  Admin reads (service role — RLS bypassed after requireAdmin())      */
/* ------------------------------------------------------------------ */

export interface AdminStats {
  total_revenue: number;
  pending_revenue: number;
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_users: number;
  active_products: number;
  total_products: number;
  active_promos: number;
  total_redemptions: number;
}

const EMPTY_STATS: AdminStats = {
  total_revenue: 0,
  pending_revenue: 0,
  total_orders: 0,
  pending_orders: 0,
  processing_orders: 0,
  completed_orders: 0,
  cancelled_orders: 0,
  total_users: 0,
  active_products: 0,
  total_products: 0,
  active_promos: 0,
  total_redemptions: 0,
};

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("admin_dashboard_stats");
    if (error || !data) return EMPTY_STATS;
    return { ...EMPTY_STATS, ...(data as Partial<AdminStats>) };
  } catch {
    return EMPTY_STATS;
  }
}

export interface DailyPoint {
  date: string;
  orders: number;
  revenue: number;
}

/** Revenue + order counts for the last N days (for the dashboard chart). */
export async function getDailySeries(days = 14): Promise<DailyPoint[]> {
  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const { data } = await admin
    .from("orders")
    .select("created_at, total, status")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const buckets = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(since);
    date.setDate(since.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, { date: key, orders: 0, revenue: 0 });
  }

  for (const row of (data ?? []) as { created_at: string; total: number; status: string }[]) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    if (["paid", "processing", "completed"].includes(row.status)) bucket.revenue += row.total;
  }

  return [...buckets.values()];
}
