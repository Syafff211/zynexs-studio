import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  User,
  Mail,
  Phone,
  Tag,
  Package,
  StickyNote,
} from "lucide-react";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { GlassCard, Badge } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatIDR, formatDateTime, waLink } from "@/lib/utils";
import type { OrderWithItems, Profile } from "@/types";

export const metadata: Metadata = {
  title: "Detail Pesanan",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as OrderWithItems;

  let customer: Profile | null = null;
  if (order.user_id) {
    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("id", order.user_id)
      .maybeSingle();
    customer = (profile as Profile) ?? null;
  }

  const chatUrl = waLink(
    order.customer_phone,
    `Halo ${order.customer_name} 👋\n\nIni admin Zynex Studio mengenai pesanan *${order.order_number}*.\n\nTotal: ${formatIDR(order.total)}\n\nAda yang bisa kami bantu?`
  );

  return (
    <div className="space-y-5">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar pesanan
      </Link>

      <GlassCard solid className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">
              Nomor Order
            </p>
            <h1 className="mt-1 font-mono text-xl font-bold tracking-wide text-white sm:text-2xl">
              {order.order_number}
            </h1>
            <p className="mt-1.5 text-[13px] text-white/45">
              Dibuat {formatDateTime(order.created_at)} · Diperbarui{" "}
              {formatDateTime(order.updated_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <a
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles("success", "md")}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Chat Customer
            </a>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-5">
          {/* Items */}
          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
              <Package className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
              Produk ({order.order_items.length})
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[26rem] text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[12px] uppercase tracking-wider text-white/40">
                    <th scope="col" className="pb-2.5 pr-4 font-medium">Produk</th>
                    <th scope="col" className="pb-2.5 pr-4 font-medium">Harga</th>
                    <th scope="col" className="pb-2.5 pr-4 font-medium">Qty</th>
                    <th scope="col" className="pb-2.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {order.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-white">{item.product_name}</p>
                        {item.duration && (
                          <p className="text-[11.5px] text-white/35">{item.duration}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-white/60">
                        {formatIDR(item.price)}
                      </td>
                      <td className="py-3 pr-4 text-white/60">{item.quantity}</td>
                      <td className="whitespace-nowrap py-3 text-right font-semibold text-white">
                        {formatIDR(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 space-y-2.5 border-t border-white/[0.09] pt-4 text-[14px]">
              <div className="flex justify-between">
                <dt className="text-white/50">Subtotal</dt>
                <dd className="font-medium text-white/85">{formatIDR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/50">
                  Diskon {order.promo_code ? `(${order.promo_code})` : ""}
                </dt>
                <dd className={order.discount > 0 ? "font-medium text-emerald-300" : "text-white/40"}>
                  {order.discount > 0 ? `-${formatIDR(order.discount)}` : formatIDR(0)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.09] pt-3">
                <dt className="font-semibold text-white">Total</dt>
                <dd className="text-xl font-bold text-white">{formatIDR(order.total)}</dd>
              </div>
            </dl>
          </GlassCard>

          {(order.notes || order.admin_notes) && (
            <GlassCard solid className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
                <StickyNote className="h-4.5 w-4.5 text-amber-300" aria-hidden="true" />
                Catatan
              </h2>
              {order.notes && (
                <div className="mt-3">
                  <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">
                    Dari customer
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/70">{order.notes}</p>
                </div>
              )}
              {order.admin_notes && (
                <div className="mt-3.5 border-t border-white/[0.08] pt-3.5">
                  <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">
                    Catatan admin
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/70">
                    {order.admin_notes}
                  </p>
                </div>
              )}
            </GlassCard>
          )}
        </div>

        <div className="space-y-5">
          {/* Customer */}
          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold text-white">Customer</h2>
            <dl className="mt-4 space-y-3.5 text-[14px]">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[12px] text-white/40">Nama</dt>
                  <dd className="truncate font-medium text-white/85">{order.customer_name}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[12px] text-white/40">Email</dt>
                  <dd className="truncate font-medium text-white/85">
                    <a href={`mailto:${order.customer_email}`} className="hover:text-brand-200">
                      {order.customer_email}
                    </a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[12px] text-white/40">WhatsApp</dt>
                  <dd className="truncate font-medium text-white/85">{order.customer_phone}</dd>
                </div>
              </div>
              {order.promo_code && (
                <div className="flex items-start gap-3">
                  <Tag className="mt-0.5 h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-[12px] text-white/40">Promo dipakai</dt>
                    <dd className="truncate font-mono font-bold tracking-wider text-violet-200">
                      {order.promo_code}
                    </dd>
                  </div>
                </div>
              )}
            </dl>

            <div className="mt-4 border-t border-white/[0.08] pt-3.5">
              {customer ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">Akun terdaftar</Badge>
                  <Link
                    href="/admin/users"
                    className="text-[12.5px] text-brand-200 hover:text-brand-100"
                  >
                    Lihat profil →
                  </Link>
                </div>
              ) : (
                <Badge tone="neutral">Guest checkout</Badge>
              )}
            </div>
          </GlassCard>

          {/* Status */}
          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold text-white">Ubah Status</h2>
            <p className="mt-1 text-[13px] text-white/45">
              Status pembayaran ikut tersinkron otomatis.
            </p>
            <div className="mt-4">
              <OrderStatusForm
                orderId={order.id}
                status={order.status}
                adminNotes={order.admin_notes}
              />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
