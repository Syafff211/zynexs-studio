import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { quoteCart, PricingError } from "@/services/pricing";
import { PROMO_MESSAGES } from "@/lib/constants";
import { buildOrderMessage, buildWhatsAppUrl, type WhatsAppOrderPayload } from "@/services/whatsapp";
import { normalizePhone } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validations";
import type { OrderStatus, OrderWithItems, PromoStatus } from "@/types";

export interface CreateOrderResult {
  ok: boolean;
  message: string;
  orderId?: string;
  orderNumber?: string;
  whatsappUrl?: string;
  total?: number;
  promoStatus?: PromoStatus;
}

/** Admin WhatsApp number: admin-editable site settings first, env fallback. */
async function resolveAdminWhatsAppNumber(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  const { data } = await admin
    .from("site_settings")
    .select("whatsapp_number")
    .limit(1)
    .maybeSingle();
  const fromSettings = (data as { whatsapp_number?: string } | null)?.whatsapp_number;
  return fromSettings && fromSettings.trim() ? fromSettings.trim() : env.whatsappNumber;
}

function buildOrderWhatsAppUrl(order: OrderWithItems, adminNumber: string): string {
  const payload: WhatsAppOrderPayload = {
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    items: (order.order_items ?? []).map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    promoCode: order.promo_code,
    notes: order.notes,
    status: order.status as OrderStatus,
  };
  return buildWhatsAppUrl(adminNumber, buildOrderMessage(payload));
}

/**
 * Creates an order end-to-end, server-side:
 *  1. requires a signed-in customer (checkout is account-only)
 *  2. re-prices the cart from the database
 *  3. validates + atomically redeems the promo (race-condition safe)
 *  4. persists order + order_items (price snapshots) + unpaid payment row
 *  5. returns a wa.me deep link with the full order message for the admin
 *
 * Idempotent: replaying the same idempotencyKey returns the original order
 * (with its WhatsApp link) instead of creating a duplicate.
 */
export async function createOrder(
  input: CheckoutInput,
  userId: string | null
): Promise<CreateOrderResult> {
  if (!userId) {
    return {
      ok: false,
      message: "Silakan masuk atau daftar terlebih dahulu sebelum membuat pesanan.",
    };
  }

  const admin = createAdminClient();

  // ---- 0. Idempotency: has this exact submission already been processed? --
  const { data: existing } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    const order = existing as unknown as OrderWithItems;
    const sameCustomer =
      order.customer_email.toLowerCase() === input.customerEmail.toLowerCase() &&
      (!order.user_id || order.user_id === userId);
    if (!sameCustomer) return { ok: false, message: "Kunci checkout sudah digunakan." };

    const adminNumber = await resolveAdminWhatsAppNumber(admin);
    return {
      ok: true,
      message: "Order sudah dibuat sebelumnya.",
      orderId: order.id,
      orderNumber: order.order_number,
      whatsappUrl: buildOrderWhatsAppUrl(order, adminNumber),
      total: order.total,
    };
  }

  // ---- 1 & 2. Trusted pricing straight from the database ----------------
  let quote;
  try {
    quote = await quoteCart(input.items, input.promoCode, userId, input.customerEmail);
  } catch (error) {
    if (error instanceof PricingError) return { ok: false, message: error.message };
    return { ok: false, message: "Gagal menghitung pesanan. Coba lagi." };
  }

  if (input.promoCode && quote.promo && quote.promo.status !== "valid") {
    return {
      ok: false,
      message: quote.promo.message,
      promoStatus: quote.promo.status,
    };
  }

  // ---- 3. Human-friendly order number ------------------------------------
  const { data: numberData, error: numberError } = await admin.rpc("next_order_number");
  if (numberError || !numberData) {
    return { ok: false, message: "Gagal membuat nomor order. Coba lagi." };
  }
  const orderNumber = numberData as string;

  const usePromo = quote.promo?.status === "valid" && quote.promo.promoId;

  // ---- 4. Persist the order ----------------------------------------------
  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      customer_name: input.customerName,
      customer_email: input.customerEmail.toLowerCase(),
      customer_phone: normalizePhone(input.customerPhone),
      subtotal: quote.subtotal,
      discount: usePromo ? quote.discount : 0,
      total: usePromo ? quote.total : quote.subtotal,
      promo_id: usePromo ? quote.promo!.promoId : null,
      promo_code: usePromo ? quote.promo!.code : null,
      status: "pending",
      payment_method: "whatsapp",
      notes: input.notes?.trim() || null,
      idempotency_key: input.idempotencyKey,
    })
    .select("id, order_number, total, subtotal, discount")
    .single();

  if (orderError || !orderRow) {
    // Unique violation on idempotency_key → a parallel request won the race.
    if (orderError?.code === "23505") {
      const { data: raced } = await admin
        .from("orders")
        .select("*, order_items(*)")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (raced) {
        const order = raced as unknown as OrderWithItems;
        const sameCustomer =
          order.customer_email.toLowerCase() === input.customerEmail.toLowerCase() &&
          (!order.user_id || order.user_id === userId);
        if (!sameCustomer) return { ok: false, message: "Kunci checkout sudah digunakan." };

        const adminNumber = await resolveAdminWhatsAppNumber(admin);
        return {
          ok: true,
          message: "Order sudah dibuat sebelumnya.",
          orderId: order.id,
          orderNumber: order.order_number,
          whatsappUrl: buildOrderWhatsAppUrl(order, adminNumber),
          total: order.total,
        };
      }
    }
    return { ok: false, message: "Gagal menyimpan pesanan. Coba lagi." };
  }

  const orderId = orderRow.id as string;

  // ---- 5. Order items with price/name snapshots ---------------------------
  const { error: itemsError } = await admin.from("order_items").insert(
    quote.lines.map((line) => ({
      order_id: orderId,
      product_id: line.productId,
      product_name: line.productName,
      product_slug: line.productSlug,
      price: line.price,
      quantity: line.quantity,
      subtotal: line.subtotal,
      duration: line.duration,
    }))
  );

  if (itemsError) {
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, message: "Gagal menyimpan item pesanan. Coba lagi." };
  }

  // ---- 6. Unpaid payment record ------------------------------------------
  const { error: paymentError } = await admin.from("payments").insert({
    order_id: orderId,
    method: "whatsapp",
    amount: orderRow.total as number,
    status: "unpaid",
  });

  if (paymentError) {
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, message: "Gagal menyiapkan pembayaran. Coba lagi." };
  }

  // ---- 7. Atomic promo redemption (row-locked in Postgres) ----------------
  if (usePromo) {
    const { data: redeemStatus, error: redeemError } = await admin.rpc("redeem_promo", {
      p_promo_id: quote.promo!.promoId,
      p_user_id: userId,
      p_order_id: orderId,
      p_email: input.customerEmail.toLowerCase(),
      p_amount: quote.discount,
    });

    const status = typeof redeemStatus === "string" ? redeemStatus : "invalid";

    if (redeemError || status !== "ok") {
      await admin.from("orders").delete().eq("id", orderId);
      const failStatus: PromoStatus =
        status in PROMO_MESSAGES && status !== "valid" ? (status as PromoStatus) : "invalid";
      return {
        ok: false,
        message: PROMO_MESSAGES[failStatus],
        promoStatus: failStatus,
      };
    }
  }

  // Sold counters are intentionally incremented only by the database when an
  // admin approves a real payment — creating an unpaid order is not a sale.
  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_id: userId,
    action: "order.created",
    entity_type: "order",
    entity_id: orderId,
    metadata: {
      to: "pending",
      method: "whatsapp",
      amount: orderRow.total as number,
    },
  });
  if (auditError) console.error("[order:audit]", auditError);

  const adminNumber = await resolveAdminWhatsAppNumber(admin);
  const { data: freshOrder } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .maybeSingle();

  const orderForUrl = (freshOrder ?? null) as unknown as OrderWithItems | null;

  return {
    ok: true,
    message: "Order berhasil dibuat!",
    orderId,
    orderNumber,
    whatsappUrl: orderForUrl
      ? buildOrderWhatsAppUrl(orderForUrl, adminNumber)
      : buildWhatsAppUrl(adminNumber, `Halo Zynex Studio 👋 Saya sudah membuat order ${orderNumber}. Mohon diproses.`),
    total: orderRow.total as number,
  };
}
