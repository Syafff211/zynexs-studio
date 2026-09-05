import type { Metadata } from "next";
import Link from "next/link";
import {
  Wallet,
  ShoppingBag,
  Clock,
  CircleCheckBig,
  Users,
  Package,
  Tag,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { getAdminStats, getDailySeries } from "@/services/account";
import { StatTile, GlassCard, EmptyState } from "@/components/ui/card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { buttonStyles } from "@/components/ui/button";
import { formatIDR, formatDateTime } from "@/lib/utils";
import type { Order } from "@/types";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [stats, series] = await Promise.all([getAdminStats(), getDailySeries(14)]);

  const admin = createAdminClient();
  const { data: recentOrders } = await admin
    .from("orders")
    .select("id, order_number, customer_name, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  const orders = (recentOrders ?? []) as Pick<
    Order,
    "id" | "order_number" | "customer_name" | "total" | "status" | "created_at"
  >[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard</h1>
          <p className="mt-1.5 text-[14.5px] text-white/50">
            Ringkasan performa Zynex Studio secara realtime.
          </p>
        </div>
        <Link href="/admin/orders" className={buttonStyles("secondary", "md")}>
          Kelola Pesanan
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section aria-label="Statistik utama" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total Revenue"
          value={formatIDR(stats.total_revenue)}
          hint={`${formatIDR(stats.pending_revenue)} menunggu`}
          icon={<Wallet className="h-5 w-5" />}
          tone="success"
        />
        <StatTile
          label="Total Orders"
          value={stats.total_orders}
          icon={<ShoppingBag className="h-5 w-5" />}
          tone="brand"
        />
        <StatTile
          label="Pending Orders"
          value={stats.pending_orders}
          hint={`${stats.processing_orders} diproses`}
          icon={<Clock className="h-5 w-5" />}
          tone="warning"
        />
        <StatTile
          label="Completed Orders"
          value={stats.completed_orders}
          icon={<CircleCheckBig className="h-5 w-5" />}
          tone="success"
        />
      </section>

      <section aria-label="Statistik sekunder" className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Total Users"
          value={stats.total_users}
          icon={<Users className="h-5 w-5" />}
          tone="violet"
        />
        <StatTile
          label="Active Products"
          value={`${stats.active_products} / ${stats.total_products}`}
          icon={<Package className="h-5 w-5" />}
          tone="brand"
        />
        <StatTile
          label="Active Promo Codes"
          value={stats.active_promos}
          hint={`${stats.total_redemptions} redemption tercatat`}
          icon={<Tag className="h-5 w-5" />}
          tone="warning"
        />
      </section>

      <RevenueChart data={series} />

      <GlassCard solid className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
            <TrendingUp className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
            Pesanan Terbaru
          </h2>
          <Link
            href="/admin/orders"
            className="text-[13px] font-medium text-brand-200 hover:text-brand-100"
          >
            Lihat semua →
          </Link>
        </div>

        {orders.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-white/40">
                  <th scope="col" className="pb-2.5 pr-4 font-medium">Order</th>
                  <th scope="col" className="pb-2.5 pr-4 font-medium">Customer</th>
                  <th scope="col" className="pb-2.5 pr-4 font-medium">Tanggal</th>
                  <th scope="col" className="pb-2.5 pr-4 font-medium">Status</th>
                  <th scope="col" className="pb-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-semibold text-brand-200 hover:text-brand-100"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="max-w-[10rem] truncate py-3 pr-4 text-white/70">
                      {order.customer_name}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-white/45">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap py-3 text-right font-semibold text-white">
                      {formatIDR(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={<ShoppingBag className="h-6 w-6" />}
              title="Belum ada pesanan"
              description="Pesanan yang masuk akan muncul di sini."
            />
          </div>
        )}
      </GlassCard>
    </div>
  );
}
