"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, LayoutGrid, Search, Sparkles, X } from "lucide-react";
import { ProductCard } from "./product-card";
import { ProductShareDialog } from "./product-share-dialog";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category, ProductWithCategory } from "@/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Urutan unggulan" },
  { value: "price-asc", label: "Harga termurah" },
  { value: "price-desc", label: "Harga tertinggi" },
  { value: "newest", label: "Produk terbaru" },
  { value: "name", label: "Nama A–Z" },
];

export function StoreBrowser({
  products,
  categories,
  initialQuery = "",
  initialCategory = "all",
}: {
  products: ProductWithCategory[];
  categories: Category[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safeInitialCategory =
    initialCategory === "all" || categories.some((item) => item.slug === initialCategory)
      ? initialCategory
      : "all";

  const [query, setQuery] = React.useState(initialQuery.slice(0, 80));
  const [category, setCategory] = React.useState(safeInitialCategory);
  const [sort, setSort] = React.useState<SortKey>("featured");
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [shareProduct, setShareProduct] = React.useState<ProductWithCategory | null>(null);

  const closeShareDialog = React.useCallback(() => setShareProduct(null), []);

  // Keep search/category URLs shareable without a server round-trip. Sorting
  // and "featured only" remain view preferences and do not pollute the URL.
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const cleanQuery = query.trim();
    if (cleanQuery) params.set("q", cleanQuery);
    else params.delete("q");
    if (category && category !== "all") params.set("category", category);
    else params.delete("category");

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");

    const result = products.filter((product) => {
      if (featuredOnly && !product.is_featured) return false;
      if (category !== "all" && product.category?.slug !== category) return false;
      if (!needle) return true;
      return (
        product.name.toLocaleLowerCase("id").includes(needle) ||
        (product.short_description ?? "").toLocaleLowerCase("id").includes(needle) ||
        (product.description ?? "").toLocaleLowerCase("id").includes(needle) ||
        (product.category?.name ?? "").toLocaleLowerCase("id").includes(needle)
      );
    });

    switch (sort) {
      case "price-asc":
        return [...result].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...result].sort((a, b) => b.price - a.price);
      case "newest":
        return [...result].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "name":
        return [...result].sort((a, b) => a.name.localeCompare(b.name, "id"));
      default:
        return [...result].sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return a.sort_order - b.sort_order;
        });
    }
  }, [products, query, category, sort, featuredOnly]);

  const hasFilters = Boolean(query.trim()) || category !== "all" || featuredOnly || sort !== "featured";
  const categoryChips = [{ id: "all", name: "Semua Produk", slug: "all" }, ...categories];
  const activeCategory = categoryChips.find((item) => item.slug === category)?.name ?? "Semua Produk";

  const reset = () => {
    setQuery("");
    setCategory("all");
    setSort("featured");
    setFeaturedOnly(false);
  };

  return (
    <div>
      <section
        aria-label="Pencarian dan filter katalog"
        className="glass-solid rounded-2xl p-3 sm:p-4 lg:sticky lg:top-[5.25rem] lg:z-30"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="relative min-w-0">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama produk atau kategori…"
              aria-label="Cari produk"
              maxLength={80}
              className="h-11 w-full rounded-xl border border-white/10 bg-ink-950/45 pl-10 pr-10 text-[14px] text-white placeholder:text-white/30 focus:border-brand-400/40 focus:outline-none focus:ring-2 focus:ring-brand-500/45"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="grid min-w-0 grid-cols-[0.9fr_1.1fr] gap-2 md:flex md:items-center">
            <button
              type="button"
              onClick={() => setFeaturedOnly((value) => !value)}
              aria-pressed={featuredOnly}
              className={cn(
                "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-[12.5px] font-semibold transition-colors sm:text-[13px]",
                featuredOnly
                  ? "border-brand-400/40 bg-brand-500/15 text-brand-100"
                  : "border-white/10 bg-white/[0.035] text-white/55 hover:border-white/20 hover:text-white"
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Unggulan</span>
            </button>

            <div className="relative min-w-0">
              <ArrowUpDown
                className="pointer-events-none absolute left-3 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-white/35 sm:block"
                aria-hidden="true"
              />
              <label className="sr-only" htmlFor="store-sort">
                Urutkan produk
              </label>
              <select
                id="store-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="h-11 w-full min-w-0 cursor-pointer truncate rounded-xl border border-white/10 bg-ink-950/45 px-3 text-[12.5px] font-medium text-white/70 focus:border-brand-400/40 focus:outline-none focus:ring-2 focus:ring-brand-500/45 sm:pl-8 sm:pr-8 sm:text-[13px]"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-ink-900 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-white/[0.07] pt-3">
          <div className="flex items-center gap-3">
            <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-white/30 sm:inline-flex">
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              Kategori
            </span>
            <div className="scrollbar-none -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-0.5">
              {categoryChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setCategory(chip.slug)}
                  aria-pressed={category === chip.slug}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                    category === chip.slug
                      ? "border-brand-400/40 bg-brand-500/15 text-brand-100"
                      : "border-white/[0.09] bg-white/[0.025] text-white/45 hover:border-white/20 hover:text-white/75"
                  )}
                >
                  {chip.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.07] pb-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-300/65">
            Hasil Katalog
          </p>
          <p className="mt-1 break-words text-[14px] text-white/45" aria-live="polite">
            <span className="font-semibold text-white">{filtered.length} produk</span> dalam{" "}
            {activeCategory}
            {query.trim() ? ` untuk “${query.trim()}”` : ""}
          </p>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-8 px-2.5 text-[12px]">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Reset semua
          </Button>
        )}
      </div>

      {filtered.length ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {filtered.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              onShare={setShareProduct}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          icon={<Search className="h-6 w-6" />}
          title="Produk tidak ditemukan"
          description={
            products.length
              ? "Coba kata kunci atau kategori lain, lalu reset filter jika diperlukan."
              : "Katalog masih kosong. Tambahkan produk dari Admin Panel."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={reset}>
                Reset semua filter
              </Button>
            ) : undefined
          }
        />
      )}

      {shareProduct && (
        <ProductShareDialog product={shareProduct} open onClose={closeShareDialog} />
      )}
    </div>
  );
}
