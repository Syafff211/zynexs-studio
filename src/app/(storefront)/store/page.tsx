import { Suspense } from "react";
import type { Metadata } from "next";
import { StoreBrowser } from "@/components/store/store-browser";
import { ProductCardSkeleton } from "@/components/store/product-card";
import { getProducts, getCategories } from "@/services/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Store — Semua Produk Digital",
  description:
    "Jelajahi katalog Zynex Studio: domain .my.id, .web.id, .biz.id, Google AI Pro, Canva Pro, dan layanan sosial media dengan harga terjangkau.",
  alternates: { canonical: "/store" },
  openGraph: {
    title: "Store — Zynex Studio",
    description: "Katalog produk digital premium dengan harga terjangkau.",
    url: "/store",
  },
};

/**
 * NOTE: there is deliberately no `loading.tsx` in this segment. A segment-level
 * loading file opts the whole subtree into streaming, which makes `notFound()`
 * in /store/[slug] respond with HTTP 200 instead of 404. The skeleton below is
 * scoped to this page with <Suspense> instead, so product pages keep real 404s.
 */
export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
          Marketplace
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Semua produk <span className="text-gradient">digital</span> Zynex Studio
        </h1>
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-white/55">
          Domain, akun AI, tools desain, hingga layanan sosial media. Pilih, checkout, langsung
          diproses lewat WhatsApp.
        </p>
      </header>

      <Suspense fallback={<StoreSkeleton />}>
        <StoreResults query={params.q ?? ""} category={params.category ?? "all"} />
      </Suspense>
    </div>
  );
}

async function StoreResults({ query, category }: { query: string; category: string }) {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <StoreBrowser
      products={products}
      categories={categories}
      initialQuery={query}
      initialCategory={category}
    />
  );
}

function StoreSkeleton() {
  return (
    <div>
      <div className="skeleton h-20 rounded-2xl" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
