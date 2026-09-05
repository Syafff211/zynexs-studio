"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Minus,
  Plus,
  Trash2,
  Tag,
  X,
  Check,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { GlassCard, EmptyState, Skeleton } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/hooks/use-cart";
import { quoteCartAction, type QuoteResult } from "@/actions/checkout";
import { cn, formatIDR } from "@/lib/utils";

export function CartView() {
  const { items, hydrated, promoCode, increment, decrement, setQuantity, remove, clear, setPromoCode } =
    useCart();
  const { success, error: toastError, info } = useToast();

  const [code, setCode] = React.useState(promoCode ?? "");
  const [quote, setQuote] = React.useState<QuoteResult | null>(null);
  const [quoting, startQuote] = React.useTransition();
  const [promoPending, startPromo] = React.useTransition();
  const [confirmClear, setConfirmClear] = React.useState(false);

  const payload = React.useMemo(
    () => items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    [items]
  );

  // Mirror the stored promo into the input when it changes elsewhere.
  const [lastPromoCode, setLastPromoCode] = React.useState(promoCode);
  if (lastPromoCode !== promoCode) {
    setLastPromoCode(promoCode);
    setCode(promoCode ?? "");
  }

  // Re-quote on the server whenever the cart or applied promo changes.
  React.useEffect(() => {
    if (!hydrated) return;
    if (!payload.length) return;
    startQuote(async () => {
      const result = await quoteCartAction({
        items: payload,
        promoCode: promoCode ?? undefined,
      });
      setQuote(result);
      // Server rejected a stored promo (expired, used up…) → drop it silently.
      if (promoCode && result.promoStatus && result.promoStatus !== "valid") {
        setPromoCode(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, promoCode, hydrated]);

  const applyPromo = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toastError("Kode promo kosong", "Masukkan kode promo terlebih dahulu.");
      return;
    }
    startPromo(async () => {
      const result = await quoteCartAction({ items: payload, promoCode: trimmed });
      setQuote(result);
      if (result.ok && result.discount > 0) {
        setPromoCode(trimmed);
        success("✓ Kode promo berhasil digunakan", `Hemat ${formatIDR(result.discount)}`);
      } else {
        setPromoCode(null);
        toastError("Promo gagal", result.message || "Kode promo tidak valid.");
      }
    });
  };

  const removePromo = () => {
    setPromoCode(null);
    setCode("");
    info("Promo dilepas", "Total kembali ke harga normal.");
  };

  if (!hydrated) return <CartSkeleton />;

  if (!items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Keranjang kamu masih kosong"
        description="Yuk jelajahi katalog Zynex Studio dan temukan produk digital yang kamu butuhkan."
        action={
          <Link href="/store" className={buttonStyles("primary", "lg")}>
            Mulai Belanja
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
    );
  }

  const localSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Only trust server money once the cart has actually been priced; otherwise
  // show the local estimate so the summary never contradicts the line items.
  const priced = quote?.priced ? quote : null;
  const subtotal = priced?.subtotal ?? localSubtotal;
  const discount = priced?.discount ?? 0;
  const total = priced?.total ?? subtotal;
  const promoApplied = Boolean(promoCode) && discount > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
      {/* Items */}
      <section aria-label="Item keranjang" className="space-y-3">
        {items.map((item) => (
          <GlassCard key={item.productId} solid className="p-4 sm:p-5">
            <div className="flex gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500/18 to-accent-500/12 ring-1 ring-white/10 sm:h-20 sm:w-20">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <Icon name={item.icon} className="h-7 w-7 text-brand-200" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-white">
                      <Link href={`/store/${item.slug}`} className="hover:text-brand-200">
                        {item.name}
                      </Link>
                    </h3>
                    {item.duration && (
                      <p className="mt-0.5 text-[12.5px] text-white/45">{item.duration}</p>
                    )}
                    <p className="mt-1 text-[13.5px] text-white/55">
                      {formatIDR(item.price)} × {item.quantity}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    aria-label={`Hapus ${item.name} dari keranjang`}
                    className="shrink-0 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-rose-500/12 hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-xl border border-white/12 bg-ink-900/60">
                    <button
                      type="button"
                      onClick={() => decrement(item.productId)}
                      aria-label={`Kurangi jumlah ${item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-l-xl text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(event) =>
                        setQuantity(item.productId, Math.max(1, Number(event.target.value) || 1))
                      }
                      aria-label={`Jumlah ${item.name}`}
                      className="h-9 w-12 border-x border-white/10 bg-transparent text-center text-[14px] font-semibold text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => increment(item.productId)}
                      aria-label={`Tambah jumlah ${item.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-r-xl text-white/65 transition-colors hover:bg-white/[0.07] hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-[16px] font-bold text-white">
                    {formatIDR(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Link href="/store" className={buttonStyles("ghost", "sm")}>
            ← Lanjut belanja
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setConfirmClear(true)}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Kosongkan keranjang
          </Button>
        </div>
      </section>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24">
        <GlassCard solid className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Ringkasan Pesanan</h2>

          {/* Promo */}
          <div className="mt-5 rounded-xl border border-white/[0.09] bg-white/[0.03] p-4">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold text-white">
              <Tag className="h-4 w-4 text-brand-300" aria-hidden="true" />
              Punya kode promo?
            </p>

            {promoApplied ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 px-3.5 py-3 ring-1 ring-inset ring-emerald-400/25">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[13.5px] font-bold tracking-wider text-emerald-200">
                      {promoCode}
                    </p>
                    <p className="text-[12px] text-emerald-300/75">
                      Hemat {formatIDR(discount)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePromo}
                  aria-label="Hapus kode promo"
                  className="shrink-0 rounded-lg p-1 text-emerald-300/70 hover:bg-emerald-500/15 hover:text-emerald-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="mt-3 flex gap-2">
                  <label htmlFor="cart-promo" className="sr-only">
                    Masukkan kode promo
                  </label>
                  <input
                    id="cart-promo"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyPromo();
                      }
                    }}
                    placeholder="Masukkan kode promo"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-white/12 bg-ink-900/70 px-3.5 font-mono text-[14px] uppercase tracking-wider text-white placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  <Button onClick={applyPromo} loading={promoPending} className="shrink-0">
                    Redeem
                  </Button>
                </div>
                {quote && !quote.ok && quote.message && (
                  <p role="alert" className="mt-2.5 text-[13px] text-rose-300">
                    {quote.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Totals */}
          <dl className="mt-5 space-y-2.5 text-[14.5px]">
            <div className="flex items-center justify-between">
              <dt className="text-white/50">Subtotal</dt>
              <dd className="font-medium text-white/85">
                {quoting ? <Skeleton className="h-5 w-20" /> : formatIDR(subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-white/50">Discount</dt>
              <dd className={cn("font-medium", discount > 0 ? "text-emerald-300" : "text-white/40")}>
                {discount > 0 ? `-${formatIDR(discount)}` : formatIDR(0)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-white/[0.09] pt-3.5">
              <dt className="text-[15px] font-semibold text-white">Total</dt>
              <dd className="text-2xl font-bold text-white">
                {quoting ? <Skeleton className="h-7 w-28" /> : formatIDR(total)}
              </dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className={buttonStyles("primary", "lg", "mt-5 w-full")}
            aria-disabled={quoting}
          >
            {quoting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                Lanjut ke Checkout
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Link>

          <p className="mt-3.5 flex items-start gap-2 text-[12px] leading-relaxed text-white/35">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Harga, diskon, dan total dihitung ulang oleh server sebelum order dibuat.
          </p>
        </GlassCard>
      </aside>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
          info("Keranjang dikosongkan");
        }}
        title="Kosongkan keranjang?"
        description="Semua item akan dihapus dari keranjang. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, kosongkan"
        destructive
      />
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
