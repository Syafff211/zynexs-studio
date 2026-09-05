import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { quoteCart, PricingError } from "@/services/pricing";
import { buildOrderMessage, buildWhatsAppUrl } from "@/services/whatsapp";
import { PROMO_MESSAGES } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";
import type { CheckoutInput } from "@/lib/validations";
import type { OrderWithItems, PromoStatus } from "@/types";

export interface CreateOrderResult {
  ok: boolean;
  message: string;
  orderId?: string;
  orderNumber?: string;
  whatsappUrl?: string;
  total?: number;
  promoStatus?: PromoStatus;
}

/**
 * Creates an order end-to-end, server-side:
 *  1. re-prices the cart from the database
 *  2. validates + atomically redeems the promo (race-condition safe)
 *  3. persists order + order_items (price snapshots) + payment row
 *  4. generates the WhatsApp deep link
 *
 * Idempotent: replaying the same idempotencyKey returns the original order
 * instead of creating a duplicate, so double-clicking checkout is harmless.
 */
export async function createOrder(
  input: CheckoutInput,
  userId: string | null,
  whatsappNumber: string
): Promise<CreateOrderResult> {
  const admin = createAdminClient();

  // ---- 0. Idempotency: has this exact submission already been processed? --
  const { data: existing } = await admin
    .from("orders")
    .select("id, order_number, whatsapp_url, total")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      message: "Order sudah dibuat sebelumnya.",
      orderId: existing.id as string,
      orderNumber: existing.order_number as string,
      whatsappUrl: (existing.whatsapp_url as string) ?? undefined,
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
      status: "pending",
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
        .select("id, order_number, whatsapp_url, total")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (raced) {
        return {
          ok: true,
          message: "Order sudah dibuat sebelumnya.",
          orderId: raced.id as string,
          orderNumber: raced.order_number as string,
          whatsappUrl: (raced.whatsapp_url as string) ?? undefined,
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

  // ---- 6. Atomic promo redemption (row-locked in Postgres) ----------------
  if (usePromo) {
    const { data: redeemStatus, error: redeemError } = await admin.rpc("redeem_promo", {
      p_promo_id: quote.promo!.promoId,
      p_user_id: userId,
      p_order_id: orderId,
      p_email: input.customerEmail.toLowerCase(),
      p_amount: quote.discount,
    });

    // The RPC returns 'ok' on success, otherwise a PromoStatus reason.
    const status = typeof redeemStatus === "string" ? redeemStatus : "invalid";

    if (redeemError || status !== "ok") {
      // Roll the order back entirely: no half-finished orders in the DB.
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

  // ---- 7. Payment record (WhatsApp / manual settlement) -------------------
  await admin.from("payments").insert({
    order_id: orderId,
    method: "whatsapp",
    amount: orderRow.total as number,
    status: "unpaid",
  });

  // ---- 8. Bump sold counters (non-critical) -------------------------------
  await Promise.all(
    quote.lines.map((line) =>
      admin.rpc("increment_sold_count", { p_product_id: line.productId, p_qty: line.quantity })
    )
  ).catch(() => undefined);

  // ---- 9. WhatsApp message ------------------------------------------------
  const message = buildOrderMessage({
    orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    items: quote.lines.map((line) => ({
      name: line.productName,
      quantity: line.quantity,
      subtotal: line.subtotal,
    })),
    subtotal: quote.subtotal,
    discount: usePromo ? quote.discount : 0,
    total: orderRow.total as number,
    promoCode: usePromo ? quote.promo!.code : null,
    notes: input.notes,
    status: "pending",
  });

  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message);
  await admin.from("orders").update({ whatsapp_url: whatsappUrl }).eq("id", orderId);

  return {
    ok: true,
    message: "Order berhasil dibuat!",
    orderId,
    orderNumber,
    whatsappUrl,
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
