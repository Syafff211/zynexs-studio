import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Package,
  Clock,
  CircleCheckBig,
  Wallet,
  Tag,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import {
  getUserOrders,
  getUserRedemptions,
  computeAccountStats,
} from "@/services/account";
import { StatTile, GlassCard, EmptyState, Badge } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { AccountSettings } from "@/components/account/account-settings";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatIDR, formatDateTime, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard Akun",
  description: "Kelola profil, pesanan, dan riwayat promo Zynex Studio kamu.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/account");

  const [orders, redemptions] = await Promise.all([
    getUserOrders(profile.id, 5),
    getUserRedemptions(profile.id),
  ]);

  const allOrders = await getUserOrders(profile.id);
  const stats = computeAccountStats(allOrders);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Halo, {profile.full_name?.split(" ")[0] ?? "Zynexer"} 👋
        </h1>
        <p className="mt-1.5 text-[14.5px] text-white/50">
          Ini ringkasan aktivitas belanja kamu di Zynex Studio.
        </p>
      </header>

      {/* Stats */}
      <section aria-label="Statistik akun" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total Pesanan"
          value={stats.total}
          icon={<Package className="h-5 w-5" />}
          tone="brand"
        />
        <StatTile
          label="Pending"
          value={stats.pending}
          icon={<Clock className="h-5 w-5" />}
          tone="warning"
        />
        <StatTile
          label="Selesai"
          value={stats.completed}
          icon={<CircleCheckBig className="h-5 w-5" />}
          tone="success"
        />
        <StatTile
          label="Total Belanja"
          value={formatIDR(stats.spent)}
          icon={<Wallet className="h-5 w-5" />}
          tone="violet"
        />
      </section>

      {/* Recent orders */}
      <section aria-labelledby="recent-orders">
        <GlassCard solid className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="recent-orders" className="text-lg font-semibold text-white">
              Pesanan Terbaru
            </h2>
            {orders.length > 0 && (
              <Link
                href="/account/orders"
                className="text-[13.5px] font-medium text-brand-200 hover:text-brand-100"
              >
                Lihat semua →
              </Link>
            )}
          </div>

          {orders.length ? (
            <ul className="mt-4 divide-y divide-white/[0.07]">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="-mx-2 flex flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-3.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[13.5px] font-semibold text-white">
                        {order.order_number}
                      </p>
                      <p className="mt-0.5 truncate text-[12.5px] text-white/45">
                        {order.order_items.length} item · {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-[14.5px] font-bold text-white">{formatIDR(order.total)}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={<ShoppingBag className="h-6 w-6" />}
                title="Belum ada pesanan"
                description="Pesanan pertama kamu akan muncul di sini."
                action={
                  <Link href="/store" className={buttonStyles("primary", "md")}>
                    Mulai Belanja
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                }
              />
            </div>
          )}
        </GlassCard>
      </section>

      {/* Promo history */}
      <section id="promo" className="scroll-mt-24" aria-labelledby="promo-history">
        <GlassCard solid className="p-5 sm:p-6">
          <h2 id="promo-history" className="flex items-center gap-2 text-lg font-semibold text-white">
            <Tag className="h-4.5 w-4.5 text-violet-300" aria-hidden="true" />
            Riwayat Kode Promo
          </h2>

          {redemptions.length ? (
            <ul className="mt-4 divide-y divide-white/[0.07]">
              {redemptions.map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[13.5px] font-bold tracking-wider text-violet-200">
                      {redemption.promo?.code ?? "—"}
                    </p>
                    <p className="mt-0.5 text-[12.5px] text-white/45">
                      {redemption.order?.order_number
                        ? `Order ${redemption.order.order_number} · `
                        : ""}
                      {formatDate(redemption.redeemed_at)}
                    </p>
                  </div>
                  <Badge tone="success">Hemat {formatIDR(redemption.amount)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[13.5px] text-white/40">
              Belum ada kode promo yang kamu gunakan.{" "}
              <Link href="/promo" className="font-medium text-brand-200 hover:text-brand-100">
                Lihat promo aktif →
              </Link>
            </p>
          )}
        </GlassCard>
      </section>

      <AccountSettings profile={profile} />
    </div>
  );
}
