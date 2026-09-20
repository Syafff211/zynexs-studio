import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  History,
  Mail,
  MessageCircle,
  Package,
  Phone,
  StickyNote,
  Tag,
  User,
} from "lucide-react";
import { requireAdmin, createAdminClient } from "@/lib/supabase/server";
import { GlassCard, Badge } from "@/components/ui/card";
import { buttonStyles } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { PaymentReviewPanel } from "@/components/admin/payment-review-panel";
import { formatIDR, formatDateTime, waLink } from "@/lib/utils";
import type {
  AuditLog,
  OrderWithItems,
  PaymentSubmission,
  Profile,
} from "@/types";

export const metadata: Metadata = {
  title: "Detail Pesanan",
  robots: { index: false, follow: false },
};

const AUDIT_LABELS: Record<string, string> = {
  "order.created": "Order dibuat",
  "payment.submitted": "Bukti pembayaran dikirim",
  "payment.approved": "Pembayaran disetujui",
  "payment.rejected": "Bukti pembayaran ditolak",
  "order.expired": "Order kedaluwarsa",
  "order.status_changed": "Status order diubah admin",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentAdmin = await requireAdmin();
  const { id } = await params;
  const admin = createAdminClient();

  const { data } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as OrderWithItems;

  const [submissionsResult, logsResult, customerResult] = await Promise.all([
    admin
      .from("payment_submissions")
      .select("*")
      .eq("order_id", order.id)
      .order("submitted_at", { ascending: false }),
    admin
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "order")
      .eq("entity_id", order.id)
      .order("created_at", { ascending: false }),
    order.user_id
      ? admin.from("profiles").select("*").eq("id", order.user_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const submissions = (submissionsResult.data ?? []) as PaymentSubmission[];
  const auditLogs = (logsResult.data ?? []) as AuditLog[];
  const customer = (customerResult.data as Profile | null) ?? null;
  const latestSubmission = submissions[0] ?? null;

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
              Dibuat {formatDateTime(order.created_at)} · Diperbarui {formatDateTime(order.updated_at)}
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

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr] xl:items-start">
        <div className="space-y-5">
          <PaymentReviewPanel submission={latestSubmission} />

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
                        {item.duration && <p className="text-[11.5px] text-white/35">{item.duration}</p>}
                      </td>
                      <td className="whitespace-nowrap py-3 pr-4 text-white/60">{formatIDR(item.price)}</td>
                      <td className="py-3 pr-4 text-white/60">{item.quantity}</td>
                      <td className="whitespace-nowrap py-3 text-right font-semibold text-white">{formatIDR(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 space-y-2.5 border-t border-white/[0.09] pt-4 text-[14px]">
              <div className="flex justify-between"><dt className="text-white/50">Subtotal</dt><dd className="font-medium text-white/85">{formatIDR(order.subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-white/50">Diskon {order.promo_code ? `(${order.promo_code})` : ""}</dt>
                <dd className={order.discount > 0 ? "font-medium text-emerald-300" : "text-white/40"}>{order.discount > 0 ? `-${formatIDR(order.discount)}` : formatIDR(0)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.09] pt-3"><dt className="font-semibold text-white">Total</dt><dd className="text-xl font-bold text-white">{formatIDR(order.total)}</dd></div>
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
                  <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">Dari customer</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/70">{order.notes}</p>
                </div>
              )}
              {order.admin_notes && (
                <div className="mt-3.5 border-t border-white/[0.08] pt-3.5">
                  <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">Catatan internal admin</p>
                  <p className="mt-1 text-[14px] leading-relaxed text-white/70">{order.admin_notes}</p>
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
              <History className="h-4.5 w-4.5 text-violet-300" />
              Audit Log
            </h2>
            {auditLogs.length ? (
              <ol className="mt-4 space-y-4">
                {auditLogs.map((log, index) => {
                  const from = typeof log.metadata.from === "string" ? log.metadata.from : null;
                  const to = typeof log.metadata.to === "string" ? log.metadata.to : null;
                  return (
                    <li key={log.id} className="relative flex gap-3">
                      {index < auditLogs.length - 1 && <span className="absolute left-[5px] top-3 h-[calc(100%+0.55rem)] w-px bg-white/[0.08]" />}
                      <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400 ring-4 ring-violet-500/10" />
                      <div>
                        <p className="text-[13.5px] font-medium text-white/75">{AUDIT_LABELS[log.action] ?? log.action}</p>
                        {from && to && <p className="mt-0.5 text-[12px] text-white/40">{from} → {to}</p>}
                        <p className="mt-0.5 text-[11px] text-white/30">{formatDateTime(log.created_at)}{log.actor_id === currentAdmin.id ? " · oleh Anda" : ""}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="mt-3 text-[13.5px] text-white/40">Belum ada audit log untuk order legacy ini.</p>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold text-white">Customer</h2>
            <dl className="mt-4 space-y-3.5 text-[14px]">
              <div className="flex items-start gap-3"><User className="mt-0.5 h-4 w-4 shrink-0 text-white/35" /><div className="min-w-0"><dt className="text-[12px] text-white/40">Nama</dt><dd className="truncate font-medium text-white/85">{order.customer_name}</dd></div></div>
              <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-white/35" /><div className="min-w-0"><dt className="text-[12px] text-white/40">Email</dt><dd className="truncate font-medium text-white/85"><a href={`mailto:${order.customer_email}`} className="hover:text-brand-200">{order.customer_email}</a></dd></div></div>
              <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-white/35" /><div className="min-w-0"><dt className="text-[12px] text-white/40">WhatsApp</dt><dd className="truncate font-medium text-white/85">{order.customer_phone}</dd></div></div>
              {order.promo_code && <div className="flex items-start gap-3"><Tag className="mt-0.5 h-4 w-4 shrink-0 text-white/35" /><div className="min-w-0"><dt className="text-[12px] text-white/40">Promo</dt><dd className="truncate font-mono font-bold text-violet-200">{order.promo_code}</dd></div></div>}
            </dl>
            <div className="mt-4 border-t border-white/[0.08] pt-3.5"><Badge tone={customer ? "brand" : "neutral"}>{customer ? "Akun terdaftar" : "Guest checkout"}</Badge></div>
          </GlassCard>

          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white"><CreditCard className="h-4.5 w-4.5 text-brand-300" />Pembayaran</h2>
            <dl className="mt-4 space-y-3 text-[13.5px]">
              <div className="flex justify-between gap-4"><dt className="text-white/42">Metode</dt><dd className="text-right font-medium text-white/75">{order.payment_method === "qris_dana_static" ? "QRIS Statis DANA Bisnis" : "WhatsApp (Legacy)"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-white/42">Nominal</dt><dd className="font-semibold text-white">{formatIDR(order.total)}</dd></div>
              {order.expires_at && <div className="flex justify-between gap-4"><dt className="text-white/42">Kedaluwarsa</dt><dd className="text-right text-white/65">{formatDateTime(order.expires_at)}</dd></div>}
              {order.paid_at && <div className="flex justify-between gap-4"><dt className="text-white/42">Dibayar</dt><dd className="text-right text-emerald-300">{formatDateTime(order.paid_at)}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-white/42">Bukti masuk</dt><dd className="text-white/65">{submissions.length}</dd></div>
            </dl>
            {order.payment_method === "qris_dana_static" && (
              <Link href={`/payment/${order.id}`} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-200 hover:text-brand-100">Buka halaman pembayaran →</Link>
            )}
          </GlassCard>

          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white"><CalendarClock className="h-4.5 w-4.5 text-amber-300" />Status Fulfillment</h2>
            <p className="mt-1 text-[13px] text-white/45">Status PAID/REJECTED hanya dapat diubah melalui review bukti di atas.</p>
            <div className="mt-4"><OrderStatusForm orderId={order.id} status={order.status} adminNotes={order.admin_notes} /></div>
          </GlassCard>
        </aside>
      </div>
    </div>
  );
}
