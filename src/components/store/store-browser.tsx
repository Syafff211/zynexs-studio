"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category, ProductWithCategory } from "@/types";

type SortKey = "featured" | "price-asc" | "price-desc" | "newest" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Unggulan" },
  { value: "price-asc", label: "Harga: Terendah" },
  { value: "price-desc", label: "Harga: Tertinggi" },
  { value: "newest", label: "Terbaru" },
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

  const [query, setQuery] = React.useState(initialQuery);
  const [category, setCategory] = React.useState(initialCategory);
  const [sort, setSort] = React.useState<SortKey>("featured");
  const [featuredOnly, setFeaturedOnly] = React.useState(false);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  // Keep the URL shareable without triggering a server round-trip.
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) params.set("q", query);
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
    const needle = query.trim().toLowerCase();

    const result = products.filter((product) => {
      if (featuredOnly && !product.is_featured) return false;
      if (category !== "all" && product.category?.slug !== category) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        (product.short_description ?? "").toLowerCase().includes(needle) ||
        (product.description ?? "").toLowerCase().includes(needle) ||
        (product.category?.name ?? "").toLowerCase().includes(needle)
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

  const hasFilters = Boolean(query) || category !== "all" || featuredOnly || sort !== "featured";

  const reset = () => {
    setQuery("");
    setCategory("all");
    setSort("featured");
    setFeaturedOnly(false);
  };

  const categoryChips = [{ id: "all", name: "Semua", slug: "all" }, ...categories];

  return (
    <div>
      {/* Toolbar */}
      <div className="glass-solid sticky top-[4.25rem] z-30 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari domain, AI Pro, Canva Pro…"
              aria-label="Cari produk"
              className="h-11 w-full rounded-xl border border-white/10 bg-ink-900/60 pl-10 pr-9 text-[14.5px] text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFeaturedOnly((v) => !v)}
              aria-pressed={featuredOnly}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[13.5px] font-medium transition-colors",
                featuredOnly
                  ? "border-brand-400/45 bg-brand-500/15 text-brand-100"
                  : "border-white/10 bg-white/[0.04] text-white/60 hover:text-white"
              )}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Unggulan
            </button>

            <label className="sr-only" htmlFor="sort">
              Urutkan produk
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="h-11 cursor-pointer rounded-xl border border-white/10 bg-ink-900/60 px-3.5 pr-8 text-[13.5px] text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-ink-900">
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[13.5px] font-medium text-white/70 sm:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Kategori
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div
          className={cn(
            "mt-3 flex-wrap gap-2 border-t border-white/[0.07] pt-3",
            filtersOpen ? "flex" : "hidden sm:flex"
          )}
        >
          {categoryChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategory(chip.slug)}
              aria-pressed={category === chip.slug}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200",
                category === chip.slug
                  ? "border-brand-400/50 bg-brand-500/18 text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
              )}
            >
              {chip.name}
            </button>
          ))}
        </div>
      </div>

      {/* Result meta */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13.5px] text-white/45" aria-live="polite">
          Menampilkan <span className="font-semibold text-white">{filtered.length}</span> dari{" "}
          {products.length} produk
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Reset filter
          </Button>
        )}
      </div>

      {/* Grid */}
      {filtered.length ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          icon={<Search className="h-6 w-6" />}
          title="Produk tidak ditemukan"
          description={
            products.length
              ? "Coba kata kunci lain atau reset filter untuk melihat semua produk."
              : "Katalog masih kosong. Tambahkan produk dari Admin Panel."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={reset}>
                Reset filter
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
