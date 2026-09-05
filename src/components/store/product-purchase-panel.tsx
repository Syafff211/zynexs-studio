"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Tag, Check, X, Loader2, ShoppingCart, Zap, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/components/ui/toast";
import { previewProductPromoAction } from "@/actions/checkout";
import { cn, formatIDR } from "@/lib/utils";
import type { ProductWithCategory } from "@/types";

/**
 * Product purchase panel: quantity, server-validated promo preview,
 * add-to-cart and buy-now. Prices shown after redeem come straight from
 * the server response — never computed in the browser.
 */
export function ProductPurchasePanel({ product }: { product: ProductWithCategory }) {
  const { add, setPromoCode } = useCart();
  const { success, error: toastError, info } = useToast();
  const router = useRouter();

  const [quantity, setQuantity] = React.useState(1);
  const [code, setCode] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{
    ok: boolean;
    message: string;
    subtotal: number;
    discount: number;
    total: number;
    code: string | null;
  } | null>(null);

  const unitPrice = product.price;
  const baseSubtotal = unitPrice * quantity;

  // Any quantity change invalidates a previously previewed promo total.
  const [lastQuantity, setLastQuantity] = React.useState(quantity);
  if (lastQuantity !== quantity) {
    setLastQuantity(quantity);
    setResult(null);
  }

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

  const redeem = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toastError("Kode promo kosong", "Masukkan kode promo terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const response = await previewProductPromoAction({
        productId: product.id,
        quantity,
        code: trimmed,
      });

      setResult({
        ok: response.ok && response.discount > 0,
        message: response.message || (response.ok ? "✓ Kode promo berhasil digunakan" : "Kode promo tidak valid."),
        subtotal: response.subtotal,
        discount: response.discount,
        total: response.total,
        code: response.promoCode ?? null,
      });

      if (response.ok && response.discount > 0) {
        setPromoCode(trimmed);
        success("Promo diterapkan", `Hemat ${formatIDR(response.discount)} saat checkout.`);
      } else {
        setPromoCode(null);
        toastError("Promo gagal", response.message);
      }
    });
  };

  const clearPromo = () => {
    setResult(null);
    setCode("");
    setPromoCode(null);
    info("Promo dilepas", "Harga kembali ke harga normal.");
  };

  const handleAdd = () => {
    add(line, quantity);
    success("Ditambahkan ke keranjang", `${product.name} × ${quantity}`);
  };

  const handleBuyNow = () => {
    add(line, quantity);
    router.push("/checkout");
  };

  if (product.is_custom_price) {
    return (
      <div className="glass-solid rounded-2xl p-5 sm:p-6">
        <p className="text-[13px] font-medium uppercase tracking-wider text-white/45">Harga</p>
        <p className="mt-1.5 text-3xl font-bold text-white">Dikelola admin</p>
        <p className="mt-3 text-[14px] leading-relaxed text-white/55">
          Produk ini memiliki harga yang menyesuaikan kebutuhan. Hubungi admin untuk mendapatkan
          penawaran terbaik.
        </p>
        <Button className="mt-5 w-full" size="lg" onClick={() => router.push("/checkout")}>
          Konsultasi &amp; Pesan
        </Button>
      </div>
    );
  }

  const showPromo = result?.ok && result.discount > 0;

  return (
    <div className="glass-solid rounded-2xl p-5 sm:p-6">
      {/* Price */}
      <div>
        <p className="text-[13px] font-medium uppercase tracking-wider text-white/45">Harga</p>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
          {showPromo ? (
            <>
              <span className="text-[17px] font-medium text-white/40 line-through">
                {formatIDR(result.subtotal)}
              </span>
              <span className="text-3xl font-bold text-white sm:text-[2rem]">
                {formatIDR(result.total)}
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold text-white sm:text-[2rem]">
                {formatIDR(baseSubtotal)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-[17px] font-medium text-white/40 line-through">
                  {formatIDR(product.compare_at_price * quantity)}
                </span>
              )}
            </>
          )}
        </div>
        {product.duration && (
          <p className="mt-1.5 text-[13.5px] text-white/50">
            Durasi: <span className="font-medium text-white/75">{product.duration}</span>
          </p>
        )}
      </div>

      {/* Quantity */}
      <div className="mt-5">
        <p className="mb-2 text-[13px] font-medium text-white/70">Jumlah</p>
        <div className="inline-flex items-center rounded-xl border border-white/12 bg-ink-900/60">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Kurangi jumlah"
            className="flex h-11 w-11 items-center justify-center rounded-l-xl text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-35"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              setQuantity(Number.isFinite(next) ? Math.min(99, Math.max(1, Math.trunc(next))) : 1);
            }}
            aria-label="Jumlah pesanan"
            className="h-11 w-14 border-x border-white/10 bg-transparent text-center text-[15px] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/50"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            disabled={quantity >= 99}
            aria-label="Tambah jumlah"
            className="flex h-11 w-11 items-center justify-center rounded-r-xl text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-35"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Promo */}
      <div className="mt-5 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4">
        <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
          <Tag className="h-4 w-4 text-brand-300" aria-hidden="true" />
          Punya kode promo?
        </p>

        <div className="mt-3 flex gap-2">
          <label htmlFor="promo-code" className="sr-only">
            Masukkan kode promo
          </label>
          <input
            id="promo-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                redeem();
              }
            }}
            placeholder="Masukkan kode promo"
            autoComplete="off"
            spellCheck={false}
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-ink-900/70 px-3.5 font-mono text-[14px] uppercase tracking-wider text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <Button onClick={redeem} loading={pending} disabled={pending} className="shrink-0">
            Redeem
          </Button>
        </div>

        {result && (
          <div
            role="status"
            className={cn(
              "mt-3 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[13.5px]",
              result.ok
                ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-400/25"
                : "bg-rose-500/10 text-rose-200 ring-1 ring-inset ring-rose-400/25"
            )}
          >
            {pending ? (
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
            ) : result.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{result.message}</p>
              {result.ok && (
                <p className="mt-0.5 text-emerald-300/80">
                  Hemat {formatIDR(result.discount)}
                  {result.code ? ` dengan kode ${result.code}` : ""}
                </p>
              )}
            </div>
            {result.ok && (
              <button
                type="button"
                onClick={clearPromo}
                className="shrink-0 rounded-lg p-0.5 opacity-60 hover:opacity-100"
                aria-label="Lepas kode promo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Totals */}
      <dl className="mt-5 space-y-2 border-t border-white/[0.08] pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-white/50">Subtotal</dt>
          <dd className="font-medium text-white/85">{formatIDR(baseSubtotal)}</dd>
        </div>
        {showPromo && (
          <div className="flex justify-between">
            <dt className="text-white/50">Diskon</dt>
            <dd className="font-medium text-emerald-300">-{formatIDR(result.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-white/[0.08] pt-2.5">
          <dt className="font-semibold text-white">Total</dt>
          <dd className="text-lg font-bold text-white">
            {formatIDR(showPromo ? result.total : baseSubtotal)}
          </dd>
        </div>
      </dl>

      {/* Actions */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <Button variant="secondary" size="lg" onClick={handleAdd}>
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          Add to Cart
        </Button>
        <Button size="lg" onClick={handleBuyNow}>
          <Zap className="h-4 w-4" aria-hidden="true" />
          Buy Now
        </Button>
      </div>

      <p className="mt-3.5 text-center text-[12px] leading-relaxed text-white/35">
        Harga dan diskon divalidasi ulang oleh server saat checkout.
      </p>
    </div>
  );
}
