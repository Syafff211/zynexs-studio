"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  QrCode,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Check,
  Tag,
  X,
  TriangleAlert,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { GlassCard, EmptyState, Skeleton, Badge } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCart } from "@/hooks/use-cart";
import { quoteCartAction, checkoutAction, type QuoteResult } from "@/actions/checkout";
import { cn, formatIDR } from "@/lib/utils";
import type { Profile } from "@/types";

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function CheckoutView({
  profile,
  qrisConfigured,
}: {
  profile: Profile | null;
  qrisConfigured: boolean;
}) {
  const { items, hydrated, promoCode, clear, setPromoCode } = useCart();
  const { error: toastError } = useToast();
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

      if (!response.ok || !response.paymentUrl || !response.orderNumber) {
        toastError("Gagal membuat pesanan", response.message);
        if (response.promoStatus && response.promoStatus !== "valid") setPromoCode(null);
        idempotencyKeyRef.current = newIdempotencyKey();
        return;
      }

      clear();
      router.push(response.paymentUrl);
    } catch {
      toastError("Terjadi kesalahan", "Coba lagi dalam beberapa saat.");
      idempotencyKeyRef.current = newIdempotencyKey();
    } finally {
      setSubmitting(false);
    }
  };

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
        {!qrisConfigured && (
          <GlassCard solid className="border-amber-400/25 bg-amber-500/[0.06] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-amber-100">Pembayaran QRIS belum tersedia</h2>
                <p className="mt-1 text-[13.5px] leading-relaxed text-amber-100/65">
                  Admin belum memasang foto QRIS resmi. Order baru dinonaktifkan agar pelanggan
                  tidak diarahkan ke pembayaran yang belum siap.
                </p>
              </div>
            </div>
          </GlassCard>
        )}

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
              Harga divalidasi server
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-emerald-100/70">
              Setelah order tersimpan, kamu akan diarahkan ke halaman QRIS. Masukkan nominal
              tepat sesuai total order, lalu unggah bukti pembayaran.
            </p>
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            loading={submitting}
            disabled={submitting || quoting || !items.length || !qrisConfigured}
          >
            {submitting ? (
              "Membuat Pesanan..."
            ) : (
              <>
                <QrCode className="h-4 w-4" aria-hidden="true" />
                Buat Order &amp; Bayar QRIS →
              </>
            )}
          </Button>

          <p className="mt-3.5 flex items-start gap-2 text-[12px] leading-relaxed text-white/35">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Klik tombol tidak menandai order sebagai lunas. Status PAID hanya diberikan setelah
            bukti diverifikasi admin.
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
