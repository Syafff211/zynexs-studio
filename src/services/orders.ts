import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { quoteCart, PricingError } from "@/services/pricing";
import { PROMO_MESSAGES } from "@/lib/constants";
import { paymentExpiryMinutes } from "@/lib/env";
import { buildPaymentPath } from "@/lib/payment-access";
import { normalizePhone } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validations";
import type { OrderWithItems, PromoStatus } from "@/types";

export interface CreateOrderResult {
  ok: boolean;
  message: string;
  orderId?: string;
  orderNumber?: string;
  paymentUrl?: string;
  total?: number;
  promoStatus?: PromoStatus;
}

/**
 * Creates an order end-to-end, server-side:
 *  1. re-prices the cart from the database
 *  2. validates + atomically redeems the promo (race-condition safe)
 *  3. persists order + order_items (price snapshots) + QRIS payment row
 *  4. returns a signed payment-page path for guest checkouts
 *
 * Idempotent: replaying the same idempotencyKey returns the original order
 * instead of creating a duplicate, so double-clicking checkout is harmless.
 */
export async function createOrder(
  input: CheckoutInput,
  userId: string | null
): Promise<CreateOrderResult> {
  const admin = createAdminClient();

  // ---- 0. Idempotency: has this exact submission already been processed? --
  const { data: existing } = await admin
    .from("orders")
    .select("id, order_number, total, user_id, customer_email")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    const sameCustomer =
      String(existing.customer_email).toLowerCase() === input.customerEmail.toLowerCase() &&
      (!existing.user_id || existing.user_id === userId);
    if (!sameCustomer) return { ok: false, message: "Kunci checkout sudah digunakan." };

    const orderId = existing.id as string;
    return {
      ok: true,
      message: "Order sudah dibuat sebelumnya.",
      orderId,
      orderNumber: existing.order_number as string,
      paymentUrl: buildPaymentPath(orderId, !existing.user_id),
      total: existing.total as number,
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
      status: "pending_payment",
      payment_method: "qris_dana_static",
      expires_at: new Date(Date.now() + paymentExpiryMinutes() * 60_000).toISOString(),
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
        .select("id, order_number, total, user_id, customer_email")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (raced) {
        const sameCustomer =
          String(raced.customer_email).toLowerCase() === input.customerEmail.toLowerCase() &&
          (!raced.user_id || raced.user_id === userId);
        if (!sameCustomer) return { ok: false, message: "Kunci checkout sudah digunakan." };

        const racedOrderId = raced.id as string;
        return {
          ok: true,
          message: "Order sudah dibuat sebelumnya.",
          orderId: racedOrderId,
          orderNumber: raced.order_number as string,
          paymentUrl: buildPaymentPath(racedOrderId, !raced.user_id),
          total: raced.total as number,
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

  // ---- 6. Unpaid QRIS payment record --------------------------------------
  const { error: paymentError } = await admin.from("payments").insert({
    order_id: orderId,
    method: "qris_dana_static",
    amount: orderRow.total as number,
    status: "unpaid",
  });

  if (paymentError) {
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, message: "Gagal menyiapkan pembayaran QRIS. Coba lagi." };
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
      to: "pending_payment",
      method: "qris_dana_static",
      amount: orderRow.total as number,
    },
  });
  if (auditError) console.error("[order:audit]", auditError);

  return {
    ok: true,
    message: "Order berhasil dibuat!",
    orderId,
    orderNumber,
    paymentUrl: buildPaymentPath(orderId, !userId),
    total: orderRow.total as number,
  };
}

/* ------------------------------------------------------------------ */
/*  Reads                                                              */
/* ------------------------------------------------------------------ */

export async function getOrderForUser(
  orderId: string,
  userId: string
): Promise<OrderWithItems | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as OrderWithItems;
}
