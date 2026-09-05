import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient, createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { CACHE_TAGS, DEFAULT_SITE_SETTINGS } from "@/lib/constants";
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

/**
 * Every read below is public, identical for all visitors, and fetched with the
 * cookie-less anon client — which means it is safe to cache across requests.
 *
 * Two layers:
 *   • `unstable_cache` — cross-request data cache, keyed and tagged so admin
 *     mutations invalidate it instantly via `revalidateTag`. This keeps the
 *     database off the hot path even though storefront pages render
 *     dynamically (the layout reads the session cookie for the navbar).
 *   • `cache` (React) — per-request memoisation, so a page calling
 *     `getProducts()` three times only pays for it once.
 *
 * It also matters at build time: `cookies()` is forbidden inside
 * `generateStaticParams` and `sitemap.ts`, so these must never touch it.
 */
const TTL = 60;

/* ------------------------------------------------------------------ */
/*  Catalog                                                            */
/* ------------------------------------------------------------------ */

export const getProducts = cache(
  unstable_cache(
    async (): Promise<ProductWithCategory[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) return [];
      return (data ?? []) as unknown as ProductWithCategory[];
    },
    ["catalog:products:all"],
    { revalidate: TTL, tags: [CACHE_TAGS.products] }
  )
);

export const getFeaturedProducts = cache(async (limit = 6): Promise<ProductWithCategory[]> => {
  const products = await getProducts();
  const featured = products.filter((p) => p.is_featured);
  return (featured.length ? featured : products).slice(0, limit);
});

export const getProductBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<ProductWithCategory | null> => {
      if (!isSupabaseConfigured()) return null;
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) return null;
      return data as unknown as ProductWithCategory;
    },
    ["catalog:product:by-slug"],
    { revalidate: TTL, tags: [CACHE_TAGS.products] }
  )
);

export const getRelatedProducts = cache(
  async (
    categoryId: string | null,
    excludeId: string,
    limit = 4
  ): Promise<ProductWithCategory[]> => {
    const products = await getProducts();
    const sameCategory = products.filter(
      (p) => p.id !== excludeId && categoryId && p.category_id === categoryId
    );
    const others = products.filter((p) => p.id !== excludeId && p.category_id !== categoryId);
    return [...sameCategory, ...others].slice(0, limit);
  }
);

export const getCategories = cache(
  unstable_cache(
    async (): Promise<Category[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) return [];
      return (data ?? []) as Category[];
    },
    ["catalog:categories"],
    { revalidate: TTL, tags: [CACHE_TAGS.categories] }
  )
);

/* ------------------------------------------------------------------ */
/*  CMS content                                                        */
/* ------------------------------------------------------------------ */

export const getSiteSettings = cache(
  unstable_cache(
    async (): Promise<SiteSettings> => {
      if (!isSupabaseConfigured()) return DEFAULT_SITE_SETTINGS;
      const supabase = createPublicClient();
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "global")
        .maybeSingle();

      // The client is untyped (no generated Database types), so narrow here.
      const row = data as { value?: Partial<SiteSettings> | null } | null;
      return { ...DEFAULT_SITE_SETTINGS, ...(row?.value ?? {}) };
    },
    ["cms:site-settings"],
    { revalidate: TTL, tags: [CACHE_TAGS.settings] }
  )
);

export const getFaqs = cache(
  unstable_cache(
    async (): Promise<Faq[]> => {
      if (!isSupabaseConfigured()) return [];
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) return [];
      return (data ?? []) as Faq[];
    },
    ["cms:faqs"],
    { revalidate: 300, tags: [CACHE_TAGS.faqs] }
  )
);

export const getActiveAnnouncement = cache(async (): Promise<Announcement | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicClient();
  // Not cross-request cached: the active window is time-based, so a stale
  // entry would keep showing an announcement past its `expires_at`.
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
    // Service role: `promo_codes` has no public read policy, and the live
    // `redemption_count` drives the "FULL" badge, so this must not be cached
    // across requests.
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
