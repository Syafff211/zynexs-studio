"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { quoteCart, PricingError } from "@/services/pricing";
import { createOrder } from "@/services/orders";
import { getSiteSettings } from "@/services/catalog";
import { checkoutSchema, quoteSchema, firstError } from "@/lib/validations";
import { PROMO_MESSAGES, WHATSAPP_NUMBER } from "@/lib/constants";
import type { PromoStatus } from "@/types";

export interface QuoteResult {
  ok: boolean;
  /**
   * True when the server actually priced the cart against the database.
   * `ok` can be false while `priced` is true — e.g. the items are fine but
   * the promo code was rejected. The UI must only display server money
   * when `priced` is true, otherwise it falls back to the local estimate.
   */
  priced: boolean;
  message: string;
  subtotal: number;
  discount: number;
  total: number;
  promoStatus?: PromoStatus;
  promoCode?: string | null;
  lines?: { productId: string; name: string; price: number; quantity: number; subtotal: number }[];
}

/**
 * Server-side price + promo quote. The client renders whatever comes back
 * here; it never computes a discount itself.
 */
export async function quoteCartAction(input: {
  items: { productId: string; quantity: number }[];
  promoCode?: string;
  email?: string;
}): Promise<QuoteResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      priced: false,
      message: "Supabase belum dikonfigurasi.",
      subtotal: 0,
      discount: 0,
      total: 0,
    };
  }

  const parsed = quoteSchema.safeParse({
    code: input.promoCode || undefined,
    items: input.items,
  });

  if (!parsed.success) {
    return {
      ok: false,
      priced: false,
      message: firstError(parsed.error),
      subtotal: 0,
      discount: 0,
      total: 0,
    };
  }

  const user = await getSessionUser();

  try {
    const quote = await quoteCart(
      parsed.data.items,
      parsed.data.code ?? null,
      user?.id ?? null,
      input.email?.trim() || user?.email || null
    );

    const promoStatus = quote.promo?.status;
    const applied = promoStatus === "valid";

    return {
      ok: !parsed.data.code || applied,
      priced: true,
      message: quote.promo?.message ?? "",
      subtotal: quote.subtotal,
      discount: applied ? quote.discount : 0,
      total: applied ? quote.total : quote.subtotal,
      promoStatus,
      promoCode: applied ? quote.promo?.code ?? null : null,
      lines: quote.lines.map((line) => ({
        productId: line.productId,
        name: line.productName,
        price: line.price,
        quantity: line.quantity,
        subtotal: line.subtotal,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      priced: false,
      message: error instanceof PricingError ? error.message : "Gagal menghitung total.",
      subtotal: 0,
      discount: 0,
      total: 0,
    };
  }
}

/** Promo preview on the product detail page (single product, qty 1). */
export async function previewProductPromoAction(input: {
  productId: string;
  quantity?: number;
  code: string;
}): Promise<QuoteResult> {
  return quoteCartAction({
    items: [{ productId: input.productId, quantity: input.quantity ?? 1 }],
    promoCode: input.code,
  });
}

export interface CheckoutResult {
  ok: boolean;
  message: string;
  description?: string;
  orderId?: string;
  orderNumber?: string;
  whatsappUrl?: string;
  promoStatus?: PromoStatus;
}

/**
 * Creates a real order. Prices, discounts and totals are recalculated
 * server-side; the WhatsApp link is only returned when the order exists.
 */
export async function checkoutAction(input: unknown): Promise<CheckoutResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase belum dikonfigurasi." };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) };
  }

  const user = await getSessionUser();
  const settings = await getSiteSettings();
  const number = settings.whatsapp_number || WHATSAPP_NUMBER;

  try {
    const result = await createOrder(parsed.data, user?.id ?? null, number);

    if (!result.ok) {
      return {
        ok: false,
        message: result.message,
        promoStatus: result.promoStatus,
      };
    }

    revalidatePath("/account/orders");
    revalidatePath("/admin/orders");

    return {
      ok: true,
      message: "Order berhasil dibuat!",
      description: "Silakan lanjutkan melalui WhatsApp.",
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      whatsappUrl: result.whatsappUrl,
    };
  } catch (error) {
    console.error("[checkout]", error);
    return {
      ok: false,
      message:
        error instanceof PricingError
          ? error.message
          : "Gagal membuat pesanan. Silakan coba lagi.",
    };
  }
}

export async function promoMessageFor(status: PromoStatus): Promise<string> {
  return PROMO_MESSAGES[status] ?? PROMO_MESSAGES.invalid;
}
