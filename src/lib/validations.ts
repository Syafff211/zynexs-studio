import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter").max(80, "Nama terlalu panjang"),
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(72, "Password terlalu panjang"),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s()]*$/, "Nomor WhatsApp tidak valid")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().trim().url("URL avatar tidak valid").optional().or(z.literal("")),
});

/* ------------------------------------------------------------------ */
/*  Cart / checkout — the ONLY things the client may send              */
/* ------------------------------------------------------------------ */

export const cartItemInputSchema = z.object({
  productId: z.string().uuid("Produk tidak valid"),
  quantity: z.coerce.number().int().min(1, "Minimal 1").max(99, "Maksimal 99 per produk"),
});

export const promoCodeSchema = z
  .string()
  .trim()
  .min(3, "Kode promo minimal 3 karakter")
  .max(32, "Kode promo terlalu panjang")
  .regex(/^[A-Za-z0-9_-]+$/, "Kode promo hanya boleh huruf, angka, - dan _");

export const validatePromoSchema = z.object({
  code: promoCodeSchema,
  items: z.array(cartItemInputSchema).min(1, "Keranjang masih kosong").max(50),
});

export const quoteSchema = z.object({
  code: promoCodeSchema.optional(),
  items: z.array(cartItemInputSchema).min(1, "Keranjang masih kosong").max(50),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  customerEmail: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
  customerPhone: z
    .string()
    .trim()
    .min(8, "Nomor WhatsApp minimal 8 digit")
    .max(20, "Nomor WhatsApp terlalu panjang")
    .regex(/^[0-9+\-\s()]+$/, "Nomor WhatsApp tidak valid"),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().or(z.literal("")),
  items: z.array(cartItemInputSchema).min(1, "Keranjang masih kosong").max(50),
  promoCode: promoCodeSchema.optional().or(z.literal("")),
  idempotencyKey: z.string().trim().min(8).max(64),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CartItemInput = z.infer<typeof cartItemInputSchema>;

/* ------------------------------------------------------------------ */
/*  Admin — products                                                   */
/* ------------------------------------------------------------------ */

const optionalText = z.string().trim().max(4000).optional().or(z.literal(""));

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Nama produk minimal 2 karakter").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug minimal 2 karakter")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung"),
  shortDescription: z.string().trim().max(200, "Maksimal 200 karakter").optional().or(z.literal("")),
  description: optionalText,
  categoryId: z.string().uuid().optional().or(z.literal("")),
  price: z.coerce.number().int().min(0, "Harga tidak boleh negatif").max(1_000_000_000),
  compareAtPrice: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  duration: z.string().trim().max(60).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  badge: z.string().trim().max(40).optional().or(z.literal("")),
  features: z.array(z.string().trim().max(200)).max(20).default([]),
  requirements: z.array(z.string().trim().max(200)).max(20).default([]),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(3).max(200),
        answer: z.string().trim().min(3).max(1000),
      })
    )
    .max(10)
    .default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isCustomPrice: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug tidak valid"),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  icon: z.string().trim().max(60).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

/* ------------------------------------------------------------------ */
/*  Admin — promo                                                      */
/* ------------------------------------------------------------------ */

export const promoSchema = z
  .object({
    id: z.string().uuid().optional(),
    code: promoCodeSchema.transform((v) => v.toUpperCase()),
    description: z.string().trim().max(200).optional().or(z.literal("")),
    discountType: z.enum(["fixed", "percentage"]),
    discountValue: z.coerce.number().int().min(1, "Nilai diskon minimal 1"),
    maxDiscount: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
    minPurchase: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
    maxRedemptions: z.coerce.number().int().min(0).max(1_000_000).optional(),
    expiresAt: z.string().trim().optional().or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => data.discountType !== "percentage" || data.discountValue <= 100,
    { message: "Diskon persentase maksimal 100%", path: ["discountValue"] }
  );

export type PromoInput = z.infer<typeof promoSchema>;

/* ------------------------------------------------------------------ */
/*  Admin — orders / users / CMS                                       */
/* ------------------------------------------------------------------ */

export const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "paid", "processing", "completed", "cancelled", "refunded"]),
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin"]),
});

export const userActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

export const faqSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(5, "Pertanyaan minimal 5 karakter").max(200),
  answer: z.string().trim().min(5, "Jawaban minimal 5 karakter").max(2000),
  category: z.string().trim().max(60).default("Umum"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const announcementSchema = z.object({
  id: z.string().uuid().optional(),
  message: z.string().trim().min(5, "Pesan minimal 5 karakter").max(300),
  linkUrl: z.string().trim().max(300).optional().or(z.literal("")),
  linkLabel: z.string().trim().max(40).optional().or(z.literal("")),
  variant: z.enum(["info", "promo", "warning"]).default("info"),
  isActive: z.boolean().default(true),
  expiresAt: z.string().trim().optional().or(z.literal("")),
});

export const siteSettingsSchema = z.object({
  hero_badge: z.string().trim().max(80),
  hero_title: z.string().trim().min(3).max(120),
  hero_highlight: z.string().trim().max(120),
  hero_subtitle: z.string().trim().min(3).max(300),
  hero_cta_label: z.string().trim().min(2).max(40),
  hero_cta_href: z.string().trim().min(1).max(200),
  hero_secondary_label: z.string().trim().min(2).max(40),
  hero_secondary_href: z.string().trim().min(1).max(200),
  promo_banner_enabled: z.boolean(),
  promo_banner_title: z.string().trim().max(80),
  promo_banner_text: z.string().trim().max(200),
  promo_banner_code: z.string().trim().max(32),
  benefits: z
    .array(
      z.object({
        icon: z.string().trim().max(40),
        title: z.string().trim().min(2).max(60),
        description: z.string().trim().max(200),
      })
    )
    .max(8),
  stats: z
    .array(z.object({ label: z.string().trim().max(40), value: z.string().trim().max(20) }))
    .max(6),
  footer_description: z.string().trim().max(400),
  footer_copyright: z.string().trim().max(120),
  whatsapp_number: z.string().trim().regex(/^[0-9]{8,20}$/, "Nomor WhatsApp tidak valid"),
  support_email: z.string().trim().email("Email tidak valid"),
  social_links: z
    .array(
      z.object({
        label: z.string().trim().max(40),
        url: z.string().trim().url("URL tidak valid"),
        icon: z.string().trim().max(40),
      })
    )
    .max(8),
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Data tidak valid";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
