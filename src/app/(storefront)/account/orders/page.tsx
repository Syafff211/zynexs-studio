import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ArrowRight, ChevronRight } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { getUserOrders } from "@/services/account";
import { GlassCard, EmptyState } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatIDR, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pesanan Saya",
  description: "Riwayat lengkap pesanan Zynex Studio kamu.",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/account/orders");

  const orders = await getUserOrders(profile.id);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Pesanan Saya</h1>
        <p className="mt-1.5 text-[14.5px] text-white/50">
          {orders.length
            ? `${orders.length} pesanan tercatat di akun kamu.`
            : "Riwayat pesanan kamu akan muncul di sini."}
        </p>
      </header>

      {orders.length ? (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <GlassCard solid hover className="p-4 sm:p-5">
                <Link href={`/account/orders/${order.id}`} className="block">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[14px] font-bold text-white">
                        {order.order_number}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-white/45">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <ul className="mt-3 space-y-1">
                    {order.order_items.slice(0, 3).map((item) => (
                      <li key={item.id} className="truncate text-[13.5px] text-white/55">
                        {item.product_name} × {item.quantity}
                      </li>
                    ))}
                    {order.order_items.length > 3 && (
                      <li className="text-[12.5px] text-white/35">
                        +{order.order_items.length - 3} produk lainnya
                      </li>
                    )}
                  </ul>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3.5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[12.5px] text-white/40">Total</span>
                      <span className="text-[16px] font-bold text-white">
                        {formatIDR(order.total)}
                      </span>
                      {order.discount > 0 && (
                        <span className="text-[12px] text-emerald-300">
                          hemat {formatIDR(order.discount)}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-200">
                      Detail
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </GlassCard>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Belum ada pesanan"
          description="Setelah kamu checkout, semua pesanan akan tercatat di sini lengkap dengan statusnya."
          action={
            <Link href="/store" className={buttonStyles("primary", "lg")}>
              Mulai Belanja
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
      )}
    </div>
  );
}
