import { Suspense } from "react";
import type { Metadata } from "next";
import { MessageCircle, ShieldCheck } from "lucide-react";
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
    <div className="container-page py-8 sm:py-12">
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-white/[0.09] bg-ink-900/65 px-5 py-7 shadow-[0_24px_70px_-38px_rgba(31,69,245,0.65)] sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-accent-500/[0.08] blur-3xl"
        />

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/20 bg-brand-500/[0.09] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-200">
            Katalog Digital
          </span>
          <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
            Produk digital pilihan, <span className="text-gradient">siap diproses cepat.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-[14.5px] leading-relaxed text-white/55 sm:text-[15px]">
            Temukan domain, akses AI, tools desain, dan layanan sosial media dalam satu katalog yang
            ringkas dan mudah dicari.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-[12.5px] text-white/50">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              Harga diverifikasi server
            </span>
            <span className="inline-flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-brand-300" aria-hidden="true" />
              Checkout langsung ke WhatsApp
            </span>
          </div>
        </div>
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
      <div className="skeleton h-28 rounded-2xl" />
      <div className="mt-7 flex items-center justify-between border-b border-white/[0.07] pb-4">
        <div className="space-y-2">
          <div className="skeleton h-2.5 w-20 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
