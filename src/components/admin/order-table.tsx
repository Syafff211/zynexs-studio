"use client";

import * as React from "react";
import Link from "next/link";
import { Search, MessageCircle, ChevronRight, ShoppingBag, Filter } from "lucide-react";
import { GlassCard, EmptyState, Badge } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatIDR, formatDateTime, waLink } from "@/lib/utils";
import type { OrderStatus, OrderWithItems } from "@/types";

export function OrderTable({ orders }: { orders: OrderWithItems[] }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus | "all">("all");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (!needle) return true;
      return (
        order.order_number.toLowerCase().includes(needle) ||
        order.customer_name.toLowerCase().includes(needle) ||
        order.customer_email.toLowerCase().includes(needle) ||
        order.customer_phone.includes(needle) ||
        (order.promo_code ?? "").toLowerCase().includes(needle)
      );
    });
  }, [orders, query, status]);

  const revenue = filtered
    .filter((o) => ["paid", "processing", "completed"].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Pesanan</h1>
          <p className="mt-1.5 text-[14.5px] text-white/50">
            {filtered.length} pesanan · {formatIDR(revenue)} revenue terbayar
          </p>
        </div>
      </header>

      <GlassCard solid className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nomor order, nama, email, WhatsApp, atau kode promo…"
              aria-label="Cari pesanan"
              className="pl-10"
            />
          </div>
          <div className="sm:w-52">
            <label htmlFor="status-filter" className="sr-only">
              Filter status
            </label>
            <Select
              id="status-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus | "all")}
            >
              <option value="all" className="bg-ink-900">Semua status</option>
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value} className="bg-ink-900">
                  {ORDER_STATUS_LABEL[value]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {status !== "all" && (
          <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-3">
            <Filter className="h-3.5 w-3.5 text-white/35" aria-hidden="true" />
            <Badge tone="brand">{ORDER_STATUS_LABEL[status]}</Badge>
            <button
              type="button"
              onClick={() => setStatus("all")}
              className="text-[12.5px] text-white/45 underline underline-offset-2 hover:text-white"
            >
              hapus filter
            </button>
          </div>
        )}
      </GlassCard>

      {filtered.length ? (
        <>
          {/* Desktop */}
          <GlassCard solid className="hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[12px] uppercase tracking-wider text-white/45">
                    <th scope="col" className="px-4 py-3 font-medium">Order</th>
                    <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                    <th scope="col" className="px-4 py-3 font-medium">Items</th>
                    <th scope="col" className="px-4 py-3 font-medium">Promo</th>
                    <th scope="col" className="px-4 py-3 font-medium">Total</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-semibold text-brand-200 hover:text-brand-100"
                        >
                          {order.order_number}
                        </Link>
                        <p className="mt-0.5 text-[11.5px] text-white/35">
                          {formatDateTime(order.created_at)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="max-w-[11rem] truncate text-white/80">{order.customer_name}</p>
                        <p className="max-w-[11rem] truncate text-[11.5px] text-white/35">
                          {order.customer_email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-white/55">{order.order_items.length}</td>
                      <td className="px-4 py-3">
                        {order.promo_code ? (
                          <span className="font-mono text-[12.5px] font-semibold text-violet-200">
                            {order.promo_code}
                          </span>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-semibold text-white">{formatIDR(order.total)}</p>
                        {order.discount > 0 && (
                          <p className="text-[11.5px] text-emerald-300">
                            -{formatIDR(order.discount)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={waLink(
                              order.customer_phone,
                              `Halo ${order.customer_name} 👋 ini admin Zynex Studio mengenai pesanan ${order.order_number}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat customer"
                            aria-label={`Chat ${order.customer_name} di WhatsApp`}
                            className="rounded-lg p-2 text-emerald-300/70 transition-colors hover:bg-emerald-500/12 hover:text-emerald-200"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            title="Detail order"
                            aria-label={`Detail order ${order.order_number}`}
                            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Mobile */}
          <ul className="space-y-3 lg:hidden">
            {filtered.map((order) => (
              <li key={order.id}>
                <GlassCard solid className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-[14px] font-bold text-brand-200"
                      >
                        {order.order_number}
                      </Link>
                      <p className="mt-0.5 truncate text-[13px] text-white/70">
                        {order.customer_name}
                      </p>
                      <p className="truncate text-[11.5px] text-white/35">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
                    <div>
                      <p className="text-[16px] font-bold text-white">{formatIDR(order.total)}</p>
                      {order.promo_code && (
                        <p className="font-mono text-[11.5px] text-violet-200">
                          {order.promo_code} · -{formatIDR(order.discount)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <a
                        href={waLink(
                          order.customer_phone,
                          `Halo ${order.customer_name} 👋 ini admin Zynex Studio mengenai pesanan ${order.order_number}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Chat customer"
                        className="rounded-lg bg-emerald-500/12 p-2.5 text-emerald-300"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        aria-label="Detail order"
                        className="rounded-lg bg-white/[0.07] p-2.5 text-white/70"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title="Tidak ada pesanan"
          description={
            query || status !== "all"
              ? "Coba ubah kata kunci atau filter status."
              : "Pesanan yang masuk akan tampil di sini."
          }
        />
      )}
    </div>
  );
}
