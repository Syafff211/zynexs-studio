import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { PROMO_MESSAGES } from "@/lib/constants";
import type {
  CartItemInput,
} from "@/lib/validations";
import type { DiscountType, Product, PromoStatus } from "@/types";

/**
 * =====================================================================
 *  PRICING ENGINE — the single source of truth for money.
 *
 *  The client may only ever send { productId, quantity, promoCode }.
 *  Every price, discount and total is recomputed here from the database.
 * =====================================================================
 */

export interface PricedLine {
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  quantity: number;
  subtotal: number;
  duration: string | null;
}

export interface PromoResolution {
  status: PromoStatus;
  message: string;
  promoId: string | null;
  code: string | null;
  discountType: DiscountType | null;
  discountValue: number | null;
  discount: number;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  total: number;
  promo: PromoResolution | null;
}

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/** Loads products fresh from the DB and rebuilds every line total. */
export async function priceCart(items: CartItemInput[]): Promise<{
  lines: PricedLine[];
  subtotal: number;
}> {
  if (!items.length) throw new PricingError("Keranjang masih kosong.");

  // Merge duplicate product ids so a client cannot smuggle the same product twice.
  const merged = new Map<string, number>();
  for (const item of items) {
    const qty = Math.min(99, Math.max(1, Math.trunc(item.quantity)));
    merged.set(item.productId, Math.min(99, (merged.get(item.productId) ?? 0) + qty));
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("id, name, slug, price, duration, is_active, is_custom_price, stock")
    .in("id", [...merged.keys()]);

  if (error) throw new PricingError("Gagal memuat produk. Coba lagi.");

  const products = (data ?? []) as Pick<
    Product,
    "id" | "name" | "slug" | "price" | "duration" | "is_active" | "is_custom_price" | "stock"
  >[];

  const lines: PricedLine[] = [];

  for (const [productId, quantity] of merged) {
    const product = products.find((p) => p.id === productId);
    if (!product) throw new PricingError("Salah satu produk tidak ditemukan.");
    if (!product.is_active) throw new PricingError(`Produk "${product.name}" sedang tidak tersedia.`);
    if (product.is_custom_price) {
      throw new PricingError(
        `Produk "${product.name}" harganya dikelola admin. Silakan hubungi kami via WhatsApp.`
      );
    }
    if (product.stock !== null && product.stock !== undefined && quantity > product.stock) {
      throw new PricingError(`Stok "${product.name}" tidak mencukupi.`);
    }

    const price = Math.max(0, Math.trunc(product.price));
    lines.push({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      price,
      quantity,
      subtotal: price * quantity,
      duration: product.duration ?? null,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  return { lines, subtotal };
}

/** Deterministic discount maths — always clamped to the subtotal. */
export function computeDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
  maxDiscount: number | null
): number {
  let discount = 0;
  if (discountType === "fixed") {
    discount = Math.trunc(discountValue);
  } else {
    discount = Math.floor((subtotal * Math.trunc(discountValue)) / 100);
  }
  if (maxDiscount && maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  return Math.max(0, Math.min(discount, subtotal));
}

interface PromoRow {
  status: PromoStatus;
  promo_id: string | null;
  code: string | null;
  discount_type: DiscountType | null;
  discount_value: number | null;
  max_discount: number | null;
  min_purchase: number | null;
}

/**
 * Validates a promo code against the database (read-only). Nothing here
 * mutates redemption counters — that happens atomically at checkout.
 */
export async function resolvePromo(
  code: string | null | undefined,
  subtotal: number,
  userId: string | null,
  email: string | null
): Promise<PromoResolution | null> {
  const trimmed = (code ?? "").trim();
  if (!trimmed) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("validate_promo_code", {
    p_code: trimmed,
    p_user_id: userId,
    p_email: email,
  });

  if (error) {
    return {
      status: "invalid",
      message: PROMO_MESSAGES.invalid,
      promoId: null,
      code: trimmed.toUpperCase(),
      discountType: null,
      discountValue: null,
      discount: 0,
    };
  }

  const row = (Array.isArray(data) ? data[0] : data) as PromoRow | undefined;

  if (!row || row.status !== "valid") {
    const status = (row?.status ?? "invalid") as PromoStatus;
    return {
      status,
      message: PROMO_MESSAGES[status] ?? PROMO_MESSAGES.invalid,
      promoId: row?.promo_id ?? null,
      code: trimmed.toUpperCase(),
      discountType: row?.discount_type ?? null,
      discountValue: row?.discount_value ?? null,
      discount: 0,
    };
  }

  const minPurchase = row.min_purchase ?? 0;
  if (subtotal < minPurchase) {
    return {
      status: "min_purchase",
      message: PROMO_MESSAGES.min_purchase,
      promoId: row.promo_id,
      code: row.code,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      discount: 0,
    };
  }

  const discount = computeDiscount(
    subtotal,
    row.discount_type as DiscountType,
    row.discount_value ?? 0,
    row.max_discount
  );

  return {
    status: "valid",
    message: PROMO_MESSAGES.valid,
    promoId: row.promo_id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    discount,
  };
}

/** Full server-side quote: lines + promo + totals. */
export async function quoteCart(
  items: CartItemInput[],
  promoCode: string | null | undefined,
  userId: string | null,
  email: string | null
): Promise<PricedCart> {
  const { lines, subtotal } = await priceCart(items);
  const promo = await resolvePromo(promoCode, subtotal, userId, email);
  const discount = promo?.status === "valid" ? promo.discount : 0;

  return {
    lines,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    promo,
  };
}
