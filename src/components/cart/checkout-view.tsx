"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Check,
  Tag,
  X,
  CircleCheckBig,
  Copy,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { GlassCard, EmptyState, Skeleton, Badge } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/hooks/use-cart";
import { quoteCartAction, checkoutAction, type QuoteResult } from "@/actions/checkout";
import { cn, formatIDR } from "@/lib/utils";
import type { Profile } from "@/types";

interface SuccessState {
  orderNumber: string;
  total: number;
  whatsappUrl: string;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function CheckoutView({ profile }: { profile: Profile | null }) {
  const { items, hydrated, promoCode, clear, setPromoCode } = useCart();
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const [form, setForm] = React.useState({
    customerName: profile?.full_name ?? "",
    customerEmail: profile?.email ?? "",
    customerPhone: profile?.phone ?? "",
    notes: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [quote, setQuote] = React.useState<QuoteResult | null>(null);
  const [quoting, startQuote] = React.useTransition();
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<SuccessState | null>(null);

  // A stable key per checkout attempt → replaying it can never duplicate an order.
  const idempotencyKeyRef = React.useRef<string>(newIdempotencyKey());

  const payload = React.useMemo(
    () => items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    [items]
  );

  React.useEffect(() => {
    if (!hydrated || !payload.length) return;
    startQuote(async () => {
      const response = await quoteCartAction({
        items: payload,
        promoCode: promoCode ?? undefined,
        email: form.customerEmail || undefined,
      });
      setQuote(response);
      if (promoCode && response.promoStatus && response.promoStatus !== "valid") {
        setPromoCode(null);
        toastError("Promo tidak dapat dipakai", response.message);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, promoCode, hydrated]);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.customerName.trim().length < 2) next.customerName = "Nama minimal 2 karakter";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(form.customerEmail.trim()))
      next.customerEmail = "Format email tidak valid";
    const digits = form.customerPhone.replace(/\D/g, "");
    if (digits.length < 8) next.customerPhone = "Nomor WhatsApp minimal 8 digit";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return; // hard guard against double submit
    if (!validate()) {
      toastError("Periksa kembali data kamu", "Beberapa field belum valid.");
      return;
    }
    if (!payload.length) {
      toastError("Keranjang kosong", "Tambahkan produk terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await checkoutAction({
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        notes: form.notes.trim(),
        items: payload,
        promoCode: promoCode ?? "",
        idempotencyKey: idempotencyKeyRef.current,
      });

      if (!response.ok || !response.whatsappUrl || !response.orderNumber) {
        // Never open WhatsApp when the order failed.
        toastError("Gagal membuat pesanan", response.message);
        if (response.promoStatus && response.promoStatus !== "valid") setPromoCode(null);
        idempotencyKeyRef.current = newIdempotencyKey();
        return;
      }

      success("Order berhasil dibuat!", "Silakan lanjutkan melalui WhatsApp.");
      setResult({
        orderNumber: response.orderNumber,
        total: quote?.total ?? 0,
        whatsappUrl: response.whatsappUrl,
      });
      clear();

      // Open WhatsApp only after the order exists in the database.
      window.open(response.whatsappUrl, "_blank", "noopener,noreferrer");
      router.refresh();
    } catch {
      toastError("Terjadi kesalahan", "Coba lagi dalam beberapa saat.");
      idempotencyKeyRef.current = newIdempotencyKey();
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Success state ---------------- */
  if (result) {
    return (
      <GlassCard solid className="mx-auto max-w-xl p-7 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/25">
          <CircleCheckBig className="h-8 w-8" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-bold text-white">Order berhasil dibuat!</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-white/55">
          Silakan lanjutkan melalui WhatsApp untuk menyelesaikan pesanan kamu.
        </p>

        <div className="mt-6 rounded-2xl border border-white/[0.09] bg-white/[0.03] p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-white/40">
            Nomor Order
          </p>
          <p className="mt-1.5 font-mono text-xl font-bold tracking-wide text-brand-200">
            {result.orderNumber}
          </p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(result.orderNumber);
              success("Nomor order disalin");
            }}
            className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] text-white/45 transition-colors hover:text-white"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Salin nomor order
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <a
            href={result.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles("primary", "lg", "w-full")}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Buka WhatsApp
          </a>
          <Link href="/account/orders" className={buttonStyles("secondary", "lg", "w-full")}>
            Lihat Pesanan
          </Link>
        </div>

        <p className="mt-4 text-[12.5px] text-white/35">
          WhatsApp tidak terbuka otomatis? Klik tombol di atas.
        </p>
      </GlassCard>
    );
  }

  /* ---------------- Loading / empty ---------------- */
  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Skeleton className="h-[28rem] rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Belum ada produk untuk di-checkout"
        description="Tambahkan produk ke keranjang terlebih dahulu."
        action={
          <Link href="/store" className={buttonStyles("primary", "lg")}>
            Lihat Katalog
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
    );
  }

  const priced = quote?.priced ? quote : null;
  const subtotal = priced?.subtotal ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = priced?.discount ?? 0;
  const total = priced?.total ?? subtotal;

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      {/* Customer details */}
      <div className="space-y-6">
        <GlassCard solid className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Data Pemesan</h2>
          <p className="mt-1 text-[13.5px] text-white/50">
            Pastikan nomor WhatsApp aktif agar admin bisa menghubungi kamu.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Nama Lengkap"
              htmlFor="customerName"
              required
              error={errors.customerName}
              className="sm:col-span-2"
            >
              <Input
                id="customerName"
                name="customerName"
                value={form.customerName}
                onChange={update("customerName")}
                placeholder="Muhammad"
                autoComplete="name"
                invalid={Boolean(errors.customerName)}
                required
              />
            </Field>

            <Field label="Email" htmlFor="customerEmail" required error={errors.customerEmail}>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={update("customerEmail")}
                placeholder="kamu@email.com"
                autoComplete="email"
                invalid={Boolean(errors.customerEmail)}
                required
              />
            </Field>

            <Field
              label="Nomor WhatsApp"
              htmlFor="customerPhone"
              required
              error={errors.customerPhone}
              hint="Contoh: 081234567890"
            >
              <Input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                inputMode="tel"
                value={form.customerPhone}
                onChange={update("customerPhone")}
                placeholder="08xxxxxxxxxx"
                autoComplete="tel"
                invalid={Boolean(errors.customerPhone)}
                required
              />
            </Field>

            <Field
              label="Catatan (opsional)"
              htmlFor="notes"
              className="sm:col-span-2"
              hint="Contoh: nama domain yang diinginkan, username sosial media, dsb."
            >
              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={update("notes")}
                placeholder="Tulis detail tambahan untuk pesanan kamu…"
                maxLength={500}
              />
            </Field>
          </div>
        </GlassCard>

        {/* Order preview */}
        <GlassCard solid className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Produk Dipesan</h2>
          <ul className="mt-4 divide-y divide-white/[0.07]">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14.5px] font-medium text-white">{item.name}</p>
                  <p className="text-[12.5px] text-white/45">
                    {formatIDR(item.price)} × {item.quantity}
                    {item.duration ? ` · ${item.duration}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-[14.5px] font-semibold text-white">
                  {formatIDR(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/cart"
            className="mt-4 inline-flex text-[13.5px] font-medium text-brand-200 hover:text-brand-100"
          >
            ← Ubah keranjang
          </Link>
        </GlassCard>
      </div>

      {/* Summary + submit */}
      <aside className="lg:sticky lg:top-24">
        <GlassCard solid className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-white">Ringkasan</h2>

          {promoCode && discount > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 px-3.5 py-2.5 ring-1 ring-inset ring-emerald-400/25">
              <span className="flex min-w-0 items-center gap-2 text-[13px] text-emerald-200">
                <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate font-mono font-bold tracking-wider">{promoCode}</span>
              </span>
              <button
                type="button"
                onClick={() => setPromoCode(null)}
                aria-label="Hapus promo"
                className="shrink-0 rounded-md p-0.5 text-emerald-300/70 hover:text-emerald-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <dl className="mt-4 space-y-2.5 text-[14.5px]">
            <div className="flex justify-between">
              <dt className="text-white/50">Subtotal</dt>
              <dd className="font-medium text-white/85">
                {quoting ? <Skeleton className="h-5 w-20" /> : formatIDR(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
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

          <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4">
            <p className="flex items-center gap-2 text-[14px] font-semibold text-emerald-100">
              <Check className="h-4 w-4" aria-hidden="true" />
              Pesanan siap dibuat
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-100/70">
              Setelah checkout, kamu akan diarahkan ke WhatsApp Zynex Studio untuk melanjutkan
              pemesanan.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            loading={submitting}
            disabled={submitting || quoting || !items.length}
          >
            {submitting ? (
              "Membuat Pesanan..."
            ) : (
              <>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Checkout via WhatsApp →
              </>
            )}
          </Button>

          <p className="mt-3.5 flex items-start gap-2 text-[12px] leading-relaxed text-white/35">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Order dibuat di server terlebih dahulu. WhatsApp hanya terbuka jika order berhasil
            tersimpan.
          </p>

          {!profile && (
            <p className="mt-3 text-center text-[12.5px] text-white/40">
              <Link href="/login?next=/checkout" className="font-medium text-brand-200 underline underline-offset-2">
                Login
              </Link>{" "}
              agar pesanan tersimpan di akun kamu.
            </p>
          )}

          {profile && (
            <div className="mt-3 flex justify-center">
              <Badge tone="success">
                <Check className="h-3 w-3" aria-hidden="true" />
                Tersimpan ke akun {profile.full_name?.split(" ")[0] ?? "kamu"}
              </Badge>
            </div>
          )}
        </GlassCard>
      </aside>
    </form>
  );
}
