"use client";

import * as React from "react";
import { Check, ListChecks, PackageCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PromoProductOption } from "@/types";

export function PromoProductSelector({
  products,
  initialAppliesToAll,
  initialProductIds,
}: {
  products: PromoProductOption[];
  initialAppliesToAll: boolean;
  initialProductIds: string[];
}) {
  const [scope, setScope] = React.useState<"all" | "selected">(
    initialAppliesToAll ? "all" : "selected"
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () =>
      new Set(
        initialProductIds.filter(
          (productId) => !products.find((product) => product.id === productId)?.is_custom_price
        )
      )
  );
  const [query, setQuery] = React.useState("");

  const filteredProducts = React.useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    if (!needle) return products;
    return products.filter(
      (product) =>
        product.name.toLocaleLowerCase("id").includes(needle) ||
        product.slug.toLocaleLowerCase("id").includes(needle) ||
        (product.category?.name ?? "").toLocaleLowerCase("id").includes(needle)
    );
  }, [products, query]);

  const hasSelectableResults = filteredProducts.some((product) => !product.is_custom_price);

  const toggleProduct = (productId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const selectVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const product of filteredProducts) {
        if (!product.is_custom_price) next.add(product.id);
      }
      return next;
    });
  };

  return (
    <fieldset className="sm:col-span-2">
      <legend className="text-[13px] font-medium text-white/70">Berlaku untuk</legend>
      <p className="mt-1 text-[12px] leading-relaxed text-white/40">
        Tentukan apakah kode dapat digunakan untuk seluruh katalog atau hanya produk tertentu.
      </p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-brand-500/60",
            scope === "all"
              ? "border-brand-400/40 bg-brand-500/[0.1]"
              : "border-white/[0.09] bg-white/[0.025] hover:border-white/[0.16]"
          )}
        >
          <input
            type="radio"
            name="scope"
            value="all"
            checked={scope === "all"}
            onChange={() => setScope("all")}
            className="sr-only"
          />
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              scope === "all"
                ? "border-brand-400/25 bg-brand-500/15 text-brand-200"
                : "border-white/10 bg-white/[0.04] text-white/40"
            )}
          >
            <PackageCheck className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white">
              Semua produk
              {scope === "all" && <Check className="h-3.5 w-3.5 text-brand-300" />}
            </span>
            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-white/40">
              Diskon dihitung dari seluruh subtotal keranjang.
            </span>
          </span>
        </label>

        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-brand-500/60",
            scope === "selected"
              ? "border-violet-400/40 bg-violet-500/[0.1]"
              : "border-white/[0.09] bg-white/[0.025] hover:border-white/[0.16]"
          )}
        >
          <input
            type="radio"
            name="scope"
            value="selected"
            checked={scope === "selected"}
            onChange={() => setScope("selected")}
            className="sr-only"
          />
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              scope === "selected"
                ? "border-violet-400/25 bg-violet-500/15 text-violet-200"
                : "border-white/10 bg-white/[0.04] text-white/40"
            )}
          >
            <ListChecks className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-white">
              Produk tertentu
              {scope === "selected" && <Check className="h-3.5 w-3.5 text-violet-300" />}
            </span>
            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-white/40">
              Hanya subtotal produk pilihan yang mendapat diskon.
            </span>
          </span>
        </label>
      </div>

      {scope === "selected" && (
        <div className="mt-3 rounded-2xl border border-white/[0.09] bg-ink-950/35 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] text-white/55">
              <span className="font-semibold text-white">{selectedIds.size}</span> produk dipilih
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={selectVisible}
                disabled={!hasSelectableResults}
                className="rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium text-brand-200 transition-colors hover:bg-brand-500/10 disabled:opacity-40"
              >
                Pilih yang tampil
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={!selectedIds.size}
                className="rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                Hapus pilihan
              </button>
            </div>
          </div>

          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, slug, atau kategori…"
              aria-label="Cari produk untuk promo"
              className="h-10 pl-10 text-[13.5px]"
            />
          </div>

          <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const checked = selectedIds.has(product.id);
              const customPrice = product.is_custom_price;
              return (
                <label
                  key={product.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                    customPrice
                      ? "cursor-not-allowed border-transparent bg-white/[0.015] opacity-55"
                      : checked
                        ? "cursor-pointer border-brand-400/25 bg-brand-500/[0.08]"
                        : "cursor-pointer border-transparent bg-white/[0.025] hover:border-white/[0.09] hover:bg-white/[0.045]"
                  )}
                >
                  <input
                    type="checkbox"
                    name="productIds"
                    value={product.id}
                    checked={checked}
                    disabled={customPrice}
                    onChange={() => toggleProduct(product.id)}
                    className="h-4.5 w-4.5 shrink-0 cursor-pointer rounded border-white/20 bg-ink-900 accent-brand-500 disabled:cursor-not-allowed"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-white/80">
                      {product.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-white/35">
                      {product.category?.name ?? "Tanpa kategori"} · /{product.slug}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {customPrice && (
                      <span className="rounded-md bg-amber-400/[0.08] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-amber-300/70">
                        Harga custom
                      </span>
                    )}
                    {!product.is_active && (
                      <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/35">
                        Nonaktif
                      </span>
                    )}
                  </span>
                </label>
              );
            })}

            {!filteredProducts.length && (
              <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-[12.5px] text-white/35">
                {products.length ? "Produk tidak ditemukan." : "Belum ada produk untuk dipilih."}
              </p>
            )}
          </div>

          {scope === "selected" && selectedIds.size === 0 && (
            <p role="alert" className="mt-2.5 text-[12px] text-amber-300/85">
              Pilih minimal satu produk sebelum menyimpan promo.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
