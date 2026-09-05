"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, requireAdmin } from "@/lib/supabase/server";
import {
  productSchema,
  categorySchema,
  promoSchema,
  orderStatusSchema,
  userRoleSchema,
  userActiveSchema,
  faqSchema,
  announcementSchema,
  siteSettingsSchema,
  firstError,
} from "@/lib/validations";
import { DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import type { ActionState } from "@/actions/auth";

/* ------------------------------------------------------------------ */
/*  Guard helper — every action re-verifies the caller server-side.    */
/* ------------------------------------------------------------------ */

async function guard(): Promise<{ id: string } | ActionState> {
  try {
    const profile = await requireAdmin();
    return { id: profile.id };
  } catch {
    return { ok: false, message: "Akses ditolak. Hanya admin yang diizinkan." };
  }
}

function isDenied(result: unknown): result is ActionState {
  return typeof result === "object" && result !== null && "ok" in result;
}

function toNullableDate(value?: string | null): string | null {
  if (!value || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function parseFaqPairs(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...rest] = line.split("|");
      return { question: (question ?? "").trim(), answer: rest.join("|").trim() };
    })
    .filter((item) => item.question.length >= 3 && item.answer.length >= 3)
    .slice(0, 10);
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
  revalidatePath("/store");
  revalidatePath("/promo");
  revalidatePath("/faq");
}

/* ------------------------------------------------------------------ */
/*  PRODUCTS                                                           */
/* ------------------------------------------------------------------ */

export async function saveProductAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription") ?? "",
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId") || undefined,
    price: formData.get("price") ?? 0,
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    duration: formData.get("duration") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    icon: formData.get("icon") ?? "",
    badge: formData.get("badge") ?? "",
    features: parseList(formData.get("features")),
    requirements: parseList(formData.get("requirements")),
    faqs: parseFaqPairs(formData.get("faqs")),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    isCustomPrice: formData.get("isCustomPrice") === "on",
    sortOrder: formData.get("sortOrder") ?? 0,
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  const input = parsed.data;

  const admin = createAdminClient();
  const payload = {
    name: input.name,
    slug: input.slug,
    short_description: input.shortDescription || null,
    description: input.description || null,
    category_id: input.categoryId || null,
    price: input.price,
    compare_at_price: input.compareAtPrice && input.compareAtPrice > 0 ? input.compareAtPrice : null,
    duration: input.duration || null,
    image_url: input.imageUrl || null,
    icon: input.icon || null,
    badge: input.badge || null,
    features: input.features,
    requirements: input.requirements,
    faqs: input.faqs,
    is_active: input.isActive,
    is_featured: input.isFeatured,
    is_custom_price: input.isCustomPrice,
    sort_order: input.sortOrder,
  };

  const { error } = input.id
    ? await admin.from("products").update(payload).eq("id", input.id)
    : await admin.from("products").insert(payload);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Slug produk sudah digunakan." };
    return { ok: false, message: "Gagal menyimpan produk. Coba lagi." };
  }

  revalidateStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: input.id ? "Produk diperbarui." : "Produk berhasil dibuat." };
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("products").update({ is_active: isActive }).eq("id", productId);
  if (error) return { ok: false, message: "Gagal mengubah status produk." };

  revalidateStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: isActive ? "Produk diaktifkan." : "Produk dinonaktifkan." };
}

export async function toggleProductFeaturedAction(
  productId: string,
  isFeatured: boolean
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ is_featured: isFeatured })
    .eq("id", productId);
  if (error) return { ok: false, message: "Gagal mengubah status featured." };

  revalidateStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: isFeatured ? "Produk jadi unggulan." : "Produk tidak lagi unggulan." };
}

export async function deleteProductAction(productId: string): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", productId);
  if (error) return { ok: false, message: "Gagal menghapus produk (mungkin masih dipakai order)." };

  revalidateStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: "Produk dihapus." };
}

/* ------------------------------------------------------------------ */
/*  CATEGORIES                                                         */
/* ------------------------------------------------------------------ */

export async function saveCategoryAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = categorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  const input = parsed.data;

  const admin = createAdminClient();
  const payload = {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    icon: input.icon || null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };

  const { error } = input.id
    ? await admin.from("categories").update(payload).eq("id", input.id)
    : await admin.from("categories").insert(payload);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Slug kategori sudah digunakan." };
    return { ok: false, message: "Gagal menyimpan kategori." };
  }

  revalidateStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: input.id ? "Kategori diperbarui." : "Kategori dibuat." };
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", categoryId);
  if (error) return { ok: false, message: "Gagal menghapus kategori." };

  revalidateStorefront();
  revalidatePath("/admin/products");
  return { ok: true, message: "Kategori dihapus." };
}

/* ------------------------------------------------------------------ */
/*  PROMO CODES                                                        */
/* ------------------------------------------------------------------ */

export async function savePromoAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = promoSchema.safeParse({
    id: formData.get("id") || undefined,
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    maxDiscount: formData.get("maxDiscount") || undefined,
    minPurchase: formData.get("minPurchase") || 0,
    maxRedemptions: formData.get("maxRedemptions") || undefined,
    expiresAt: formData.get("expiresAt") ?? "",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  const input = parsed.data;

  const admin = createAdminClient();
  const payload = {
    code: input.code,
    description: input.description || null,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    max_discount: input.maxDiscount && input.maxDiscount > 0 ? input.maxDiscount : null,
    min_purchase: input.minPurchase ?? 0,
    max_redemptions:
      input.maxRedemptions && input.maxRedemptions > 0 ? input.maxRedemptions : null,
    expires_at: toNullableDate(input.expiresAt),
    is_active: input.isActive,
  };

  const { error } = input.id
    ? await admin.from("promo_codes").update(payload).eq("id", input.id)
    : await admin.from("promo_codes").insert(payload);

  if (error) {
    if (error.code === "23505") return { ok: false, message: "Kode promo sudah ada." };
    if (error.code === "23514")
      return {
        ok: false,
        message: "Batas redemption tidak boleh lebih kecil dari jumlah yang sudah terpakai.",
      };
    return { ok: false, message: "Gagal menyimpan promo." };
  }

  revalidatePath("/admin/promo");
  revalidatePath("/promo");
  return { ok: true, message: input.id ? "Promo diperbarui." : "Promo berhasil dibuat." };
}

export async function togglePromoActiveAction(
  promoId: string,
  isActive: boolean
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("promo_codes").update({ is_active: isActive }).eq("id", promoId);
  if (error) return { ok: false, message: "Gagal mengubah status promo." };

  revalidatePath("/admin/promo");
  revalidatePath("/promo");
  return { ok: true, message: isActive ? "Promo diaktifkan." : "Promo dinonaktifkan." };
}

export async function deletePromoAction(promoId: string): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("promo_codes").delete().eq("id", promoId);
  if (error) return { ok: false, message: "Gagal menghapus promo." };

  revalidatePath("/admin/promo");
  revalidatePath("/promo");
  return { ok: true, message: "Promo dihapus." };
}

/* ------------------------------------------------------------------ */
/*  ORDERS                                                             */
/* ------------------------------------------------------------------ */

export async function updateOrderStatusAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    adminNotes: formData.get("adminNotes") ?? "",
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const admin = createAdminClient();
  const { error } = await admin
    .from("orders")
    .update({
      status: parsed.data.status,
      admin_notes: parsed.data.adminNotes || null,
    })
    .eq("id", parsed.data.orderId);

  if (error) return { ok: false, message: "Gagal memperbarui status order." };

  // Keep the payment record in sync with the order lifecycle.
  const paymentStatus =
    parsed.data.status === "paid" || parsed.data.status === "completed"
      ? "paid"
      : parsed.data.status === "refunded"
        ? "refunded"
        : parsed.data.status === "cancelled"
          ? "failed"
          : "unpaid";

  await admin
    .from("payments")
    .update({
      status: paymentStatus,
      paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
    })
    .eq("order_id", parsed.data.orderId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.orderId}`);
  revalidatePath("/account/orders");
  return { ok: true, message: "Status order diperbarui." };
}

/* ------------------------------------------------------------------ */
/*  USERS                                                              */
/* ------------------------------------------------------------------ */

export async function updateUserRoleAction(formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = userRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  // An admin can never change their own role — no self-escalation, no lockout.
  if (parsed.data.userId === auth.id) {
    return { ok: false, message: "Kamu tidak bisa mengubah role akunmu sendiri." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (error) return { ok: false, message: "Gagal mengubah role pengguna." };

  revalidatePath("/admin/users");
  return { ok: true, message: `Role diubah menjadi ${parsed.data.role}.` };
}

export async function toggleUserActiveAction(formData: FormData): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = userActiveSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  if (parsed.data.userId === auth.id) {
    return { ok: false, message: "Kamu tidak bisa menonaktifkan akunmu sendiri." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.userId);

  if (error) return { ok: false, message: "Gagal mengubah status pengguna." };

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: parsed.data.isActive ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan.",
  };
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

export async function saveFaqAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = faqSchema.safeParse({
    id: formData.get("id") || undefined,
    question: formData.get("question"),
    answer: formData.get("answer"),
    category: formData.get("category") || "Umum",
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  const input = parsed.data;

  const admin = createAdminClient();
  const payload = {
    question: input.question,
    answer: input.answer,
    category: input.category,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };

  const { error } = input.id
    ? await admin.from("faqs").update(payload).eq("id", input.id)
    : await admin.from("faqs").insert(payload);

  if (error) return { ok: false, message: "Gagal menyimpan FAQ." };

  revalidatePath("/faq");
  revalidatePath("/admin/content");
  return { ok: true, message: input.id ? "FAQ diperbarui." : "FAQ dibuat." };
}

export async function deleteFaqAction(faqId: string): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("faqs").delete().eq("id", faqId);
  if (error) return { ok: false, message: "Gagal menghapus FAQ." };

  revalidatePath("/faq");
  revalidatePath("/admin/content");
  return { ok: true, message: "FAQ dihapus." };
}

/* ------------------------------------------------------------------ */
/*  ANNOUNCEMENTS                                                      */
/* ------------------------------------------------------------------ */

export async function saveAnnouncementAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const parsed = announcementSchema.safeParse({
    id: formData.get("id") || undefined,
    message: formData.get("message"),
    linkUrl: formData.get("linkUrl") ?? "",
    linkLabel: formData.get("linkLabel") ?? "",
    variant: formData.get("variant") || "info",
    isActive: formData.get("isActive") === "on",
    expiresAt: formData.get("expiresAt") ?? "",
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  const input = parsed.data;

  const admin = createAdminClient();
  const payload = {
    message: input.message,
    link_url: input.linkUrl || null,
    link_label: input.linkLabel || null,
    variant: input.variant,
    is_active: input.isActive,
    expires_at: toNullableDate(input.expiresAt),
  };

  const { error } = input.id
    ? await admin.from("announcements").update(payload).eq("id", input.id)
    : await admin.from("announcements").insert(payload);

  if (error) return { ok: false, message: "Gagal menyimpan pengumuman." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
  return { ok: true, message: input.id ? "Pengumuman diperbarui." : "Pengumuman dibuat." };
}

export async function deleteAnnouncementAction(id: string): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { error } = await admin.from("announcements").delete().eq("id", id);
  if (error) return { ok: false, message: "Gagal menghapus pengumuman." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
  return { ok: true, message: "Pengumuman dihapus." };
}

/* ------------------------------------------------------------------ */
/*  LANDING PAGE CMS                                                   */
/* ------------------------------------------------------------------ */

export async function saveSiteSettingsAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const auth = await guard();
  if (isDenied(auth)) return auth;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from("site_settings")
    .select("value")
    .eq("key", "global")
    .maybeSingle();

  const existing = { ...DEFAULT_SITE_SETTINGS, ...((current?.value ?? {}) as object) };

  const benefits = String(formData.get("benefits") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [icon, title, ...rest] = line.split("|");
      return {
        icon: (icon ?? "Sparkles").trim(),
        title: (title ?? "").trim(),
        description: rest.join("|").trim(),
      };
    })
    .filter((b) => b.title.length >= 2)
    .slice(0, 8);

  const stats = String(formData.get("stats") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...rest] = line.split("|");
      return { value: (value ?? "").trim(), label: rest.join("|").trim() };
    })
    .filter((s) => s.value && s.label)
    .slice(0, 6);

  const socials = String(formData.get("social_links") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url, icon] = line.split("|");
      return {
        label: (label ?? "").trim(),
        url: (url ?? "").trim(),
        icon: (icon ?? "Link").trim(),
      };
    })
    .filter((s) => s.label && s.url.startsWith("http"))
    .slice(0, 8);

  const parsed = siteSettingsSchema.safeParse({
    hero_badge: formData.get("hero_badge") ?? existing.hero_badge,
    hero_title: formData.get("hero_title") ?? existing.hero_title,
    hero_highlight: formData.get("hero_highlight") ?? existing.hero_highlight,
    hero_subtitle: formData.get("hero_subtitle") ?? existing.hero_subtitle,
    hero_cta_label: formData.get("hero_cta_label") ?? existing.hero_cta_label,
    hero_cta_href: formData.get("hero_cta_href") ?? existing.hero_cta_href,
    hero_secondary_label: formData.get("hero_secondary_label") ?? existing.hero_secondary_label,
    hero_secondary_href: formData.get("hero_secondary_href") ?? existing.hero_secondary_href,
    promo_banner_enabled: formData.get("promo_banner_enabled") === "on",
    promo_banner_title: formData.get("promo_banner_title") ?? existing.promo_banner_title,
    promo_banner_text: formData.get("promo_banner_text") ?? existing.promo_banner_text,
    promo_banner_code: formData.get("promo_banner_code") ?? existing.promo_banner_code,
    benefits: benefits.length ? benefits : existing.benefits,
    stats: stats.length ? stats : existing.stats,
    footer_description: formData.get("footer_description") ?? existing.footer_description,
    footer_copyright: formData.get("footer_copyright") ?? existing.footer_copyright,
    whatsapp_number: formData.get("whatsapp_number") ?? existing.whatsapp_number,
    support_email: formData.get("support_email") ?? existing.support_email,
    social_links: socials.length ? socials : existing.social_links,
  });

  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const { error } = await admin
    .from("site_settings")
    .upsert({ key: "global", value: parsed.data }, { onConflict: "key" });

  if (error) return { ok: false, message: "Gagal menyimpan pengaturan situs." };

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Pengaturan landing page tersimpan." };
}
