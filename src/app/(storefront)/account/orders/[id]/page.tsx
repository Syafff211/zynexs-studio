import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  Package,
  Tag,
  User,
  Mail,
  Phone,
  Copy,
} from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { getUserOrderDetail } from "@/services/account";
import { getSiteSettings } from "@/services/catalog";
import { GlassCard } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatIDR, formatDateTime, waLink } from "@/lib/utils";
import { buildOrderMessage } from "@/services/whatsapp";

export const metadata: Metadata = {
  title: "Detail Pesanan",
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=/account/orders/${id}`);

  const [order, settings] = await Promise.all([
    getUserOrderDetail(id, profile.id),
    getSiteSettings(),
  ]);
  if (!order) notFound();

  const message = buildOrderMessage({
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    items: order.order_items.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    promoCode: order.promo_code,
    notes: order.notes,
    status: order.status,
  });

  const whatsappUrl = order.whatsapp_url || waLink(settings.whatsapp_number, message);

  return (
    <div className="space-y-5">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Kembali ke daftar pesanan
      </Link>

      <GlassCard solid className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">
              Nomor Order
            </p>
            <h1 className="mt-1 font-mono text-xl font-bold tracking-wide text-white sm:text-2xl">
              {order.order_number}
            </h1>
            <p className="mt-1.5 text-[13px] text-white/45">
              Dibuat {formatDateTime(order.created_at)}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles("primary", "md", "w-full sm:w-auto")}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Lanjut via WhatsApp
          </a>
          <Link href="/store" className={buttonStyles("secondary", "md", "w-full sm:w-auto")}>
            Belanja Lagi
          </Link>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* Items */}
        <GlassCard solid className="p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
            <Package className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
            Produk Dipesan
          </h2>

          <ul className="mt-4 divide-y divide-white/[0.07]">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[14.5px] font-medium text-white">{item.product_name}</p>
                  <p className="mt-0.5 text-[12.5px] text-white/45">
                    {formatIDR(item.price)} × {item.quantity}
                    {item.duration ? ` · ${item.duration}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-[14.5px] font-semibold text-white">
                  {formatIDR(item.subtotal)}
                </p>
              </li>
            ))}
          </ul>

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

          {order.notes && (
            <div className="mt-4 rounded-xl border border-white/[0.09] bg-white/[0.03] p-3.5">
              <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">
                Catatan
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-white/65">{order.notes}</p>
            </div>
          )}
        </GlassCard>

        {/* Customer */}
        <GlassCard solid className="p-5 sm:p-6">
          <h2 className="text-[16px] font-semibold text-white">Data Pemesan</h2>
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
                <dd className="truncate font-medium text-white/85">{order.customer_email}</dd>
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
                  <dt className="text-[12px] text-white/40">Promo</dt>
                  <dd className="truncate font-mono font-bold tracking-wider text-violet-200">
                    {order.promo_code}
                  </dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Copy className="mt-0.5 h-4 w-4 shrink-0 text-white/35" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[12px] text-white/40">Terakhir diperbarui</dt>
                <dd className="font-medium text-white/85">{formatDateTime(order.updated_at)}</dd>
              </div>
            </div>
          </dl>
        </GlassCard>
      </div>
    </div>
  );
}
