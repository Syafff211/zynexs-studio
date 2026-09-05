"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Check, Clock } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { cn, formatIDR } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";

export function ProductCard({
  product,
  priority = false,
  compact = false,
}: {
  product: ProductWithCategory;
  priority?: boolean;
  compact?: boolean;
}) {
  const { add, has } = useCart();
  const { success, info } = useToast();
  const router = useRouter();
  const [justAdded, setJustAdded] = React.useState(false);
  const inCart = has(product.id);

  const line = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    duration: product.duration,
    imageUrl: product.image_url,
    icon: product.icon,
    isCustomPrice: product.is_custom_price,
  };

  const handleAdd = () => {
    if (product.is_custom_price) {
      info("Produk custom", "Harga produk ini dikelola admin. Hubungi kami via WhatsApp.");
      router.push(`/store/${product.slug}`);
      return;
    }
    add(line);
    setJustAdded(true);
    success("Ditambahkan ke keranjang", `${product.name} siap di-checkout.`);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (product.is_custom_price) {
      router.push(`/store/${product.slug}`);
      return;
    }
    add(line);
    router.push("/checkout");
  };

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      : 0;

  return (
    <article
      className={cn(
        "glass hover-lift group relative flex h-full flex-col overflow-hidden rounded-2xl",
        compact ? "p-4" : "p-5"
      )}
    >
      {/* Top gradient accent on hover */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500/18 to-accent-500/12 ring-1 ring-white/10">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="56px"
              className="object-cover"
              priority={priority}
            />
          ) : (
            <Icon name={product.icon} className="h-6 w-6 text-brand-200" />
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {product.badge && <Badge tone="violet">{product.badge}</Badge>}
          {discountPercent > 0 && <Badge tone="danger">-{discountPercent}%</Badge>}
        </div>
      </div>

      {product.category && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-300/80">
          {product.category.name}
        </p>
      )}

      <h3 className="text-[16px] font-semibold leading-snug text-white">
        <Link href={`/store/${product.slug}`} className="before:absolute before:inset-0 before:content-['']">
          {product.name}
        </Link>
      </h3>

      <p className="mt-1.5 line-clamp-2 min-h-[42px] text-[13.5px] leading-relaxed text-white/50">
        {product.short_description ?? "\u00a0"}
      </p>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 border-t border-white/[0.07] pt-4">
        <div className="min-w-0">
          {product.is_custom_price ? (
            <>
              <p className="h-[18px]" aria-hidden="true" />
              <p className="text-[18px] font-bold leading-tight text-white">Dikelola admin</p>
            </>
          ) : (
            <>
              {product.compare_at_price && product.compare_at_price > product.price ? (
                <p className="h-[18px] text-[12.5px] leading-[18px] text-white/35 line-through">
                  {formatIDR(product.compare_at_price)}
                </p>
              ) : (
                <p className="h-[18px]" aria-hidden="true" />
              )}
              <p className="text-[20px] font-bold leading-tight text-white">
                {formatIDR(product.price)}
              </p>
            </>
          )}
        </div>

        {product.duration && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1 text-[11.5px] font-medium text-white/60 ring-1 ring-inset ring-white/[0.08]">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {product.duration}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAdd}
          aria-label={`Tambah ${product.name} ke keranjang`}
        >
          {justAdded || inCart ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              {justAdded ? "Ditambah" : "Di keranjang"}
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Keranjang
            </>
          )}
        </Button>
        <Button size="sm" onClick={handleBuyNow} aria-label={`Beli ${product.name} sekarang`}>
          <Zap className="h-4 w-4" aria-hidden="true" />
          Beli Now
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="skeleton mb-4 h-14 w-14 rounded-xl" />
      <div className="skeleton h-3 w-16 rounded" />
      <div className="skeleton mt-3 h-4 w-3/4 rounded" />
      <div className="skeleton mt-2 h-3 w-full rounded" />
      <div className="skeleton mt-1.5 h-3 w-2/3 rounded" />
      <div className="mt-5 flex items-center justify-between">
        <div className="skeleton h-6 w-24 rounded" />
        <div className="skeleton h-6 w-16 rounded" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="skeleton h-9 rounded-xl" />
        <div className="skeleton h-9 rounded-xl" />
      </div>
    </div>
  );
}
