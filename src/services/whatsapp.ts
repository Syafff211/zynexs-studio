import { formatIDR } from "@/lib/utils";
import type { OrderStatus } from "@/types";

/** Capitalised English status labels, as used in the WhatsApp handoff message. */
const STATUS_WA_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export interface WhatsAppOrderPayload {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { name: string; quantity: number; subtotal: number }[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string | null;
  notes?: string | null;
  status: OrderStatus;
}

/**
 * Builds the WhatsApp order message exactly as specified by the brand.
 * Pure function → trivially unit-testable and identical on both sides.
 */
export function buildOrderMessage(order: WhatsAppOrderPayload): string {
  const productLines = order.items
    .map((item, index) => `${index + 1}. ${item.name} × ${item.quantity} — ${formatIDR(item.subtotal)}`)
    .join("\n");

  const lines = [
    "Halo Zynex Studio 👋",
    "",
    "Saya ingin melakukan pemesanan.",
    "",
    `*Order ID:* ${order.orderNumber}`,
    "",
    `*Nama:* ${order.customerName}`,
    `*Email:* ${order.customerEmail}`,
    `*WhatsApp:* ${order.customerPhone}`,
    "",
    "*Produk:*",
    productLines,
    "",
    `*Subtotal:* ${formatIDR(order.subtotal)}`,
    `*Promo:* ${order.promoCode ? order.promoCode : "Tidak ada"}`,
    `*Diskon:* ${formatIDR(order.discount)}`,
    "",
    `*Total:* ${formatIDR(order.total)}`,
  ];

  if (order.notes && order.notes.trim()) {
    lines.push("", `*Catatan:* ${order.notes.trim()}`);
  }

  lines.push(
    "",
    `*Status:* ${STATUS_WA_LABEL[order.status] ?? order.status}`,
    "",
    "Mohon diproses. Terima kasih 🙏"
  );

  return lines.join("\n");
}

/** wa.me deep link with a properly encoded message. */
export function buildWhatsAppUrl(number: string, message: string): string {
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
