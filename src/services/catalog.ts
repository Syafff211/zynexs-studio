import "server-only";
import { cache } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import type {
  Announcement,
  Category,
  Faq,
  ProductWithCategory,
  SiteSettings,
} from "@/types";

const PRODUCT_SELECT = `
  id, name, slug, short_description, description, category_id, price, compare_at_price,
  duration, image_url, icon, badge, features, requirements, faqs, is_active, is_featured,
  is_custom_price, stock, sort_order, sold_count, created_at, updated_at,
  category:categories ( id, name, slug, icon )
`;

/* ------------------------------------------------------------------ */
/*  Catalog                                                            */
/* ------------------------------------------------------------------ */

export const getProducts = cache(async (): Promise<ProductWithCategory[]> => {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as unknown as ProductWithCategory[];
});

export const getFeaturedProducts = cache(async (limit = 6): Promise<ProductWithCategory[]> => {
  const products = await getProducts();
  const featured = products.filter((p) => p.is_featured);
  return (featured.length ? featured : products).slice(0, limit);
});

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductWithCategory | null> => {
    if (!isSupabaseConfigured()) return null;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as ProductWithCategory;
  }
);

export const getRelatedProducts = cache(
  async (categoryId: string | null, excludeId: string, limit = 4): Promise<ProductWithCategory[]> => {
    const products = await getProducts();
    const sameCategory = products.filter(
      (p) => p.id !== excludeId && categoryId && p.category_id === categoryId
    );
    const others = products.filter((p) => p.id !== excludeId && p.category_id !== categoryId);
    return [...sameCategory, ...others].slice(0, limit);
  }
);

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as Category[];
});

/* ------------------------------------------------------------------ */
/*  CMS content                                                        */
/* ------------------------------------------------------------------ */

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured()) return DEFAULT_SITE_SETTINGS;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "global")
    .maybeSingle();

  const value = (data?.value ?? {}) as Partial<SiteSettings>;
  return { ...DEFAULT_SITE_SETTINGS, ...value };
});

export const getFaqs = cache(async (): Promise<Faq[]> => {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as Faq[];
});

export const getActiveAnnouncement = cache(async (): Promise<Announcement | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", nowIso)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as Announcement;
});

/* ------------------------------------------------------------------ */
/*  Public promo showcase (safe subset — never exposes secret codes     */
/*  that are inactive, expired or exhausted)                            */
/* ------------------------------------------------------------------ */

export interface PublicPromo {
  code: string;
  description: string | null;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  min_purchase: number;
  max_redemptions: number | null;
  redemption_count: number;
  expires_at: string | null;
}

export const getPublicPromos = cache(async (): Promise<PublicPromo[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const admin = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await admin
      .from("promo_codes")
      .select(
        "code, description, discount_type, discount_value, min_purchase, max_redemptions, redemption_count, expires_at"
      )
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as PublicPromo[];
  } catch {
    return [];
  }
});
