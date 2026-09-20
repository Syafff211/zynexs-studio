"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileImage,
  History,
  LoaderCircle,
  MessageCircle,
  Package,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { getPaymentStatusAction, submitPaymentProofAction } from "@/actions/payment";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Badge, GlassCard } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatIDR } from "@/lib/utils";
import type { OrderStatus, PaymentOrderView } from "@/types";

const QRIS_PUBLIC_PATH = "/qris.jpg";

interface PaymentViewProps {
  initialOrder: PaymentOrderView;
  accessToken: string;
  canUseRealtime: boolean;
  qrisConfigured: boolean;
  helpUrl: string;
}

function newSubmissionKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function remainingMs(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.max(0, new Date(expiresAt).getTime() - Date.now());
}

function formatCountdown(milliseconds: number | null): string {
  if (milliseconds === null) return "Tanpa batas waktu";
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function statusMessage(status: OrderStatus, reviewNote: string | null) {
  switch (status) {
    case "pending_payment":
      return {
        icon: <Clock3 className="h-5 w-5" />,
        title: "Menunggu pembayaran",
        description: "Bayar sesuai nominal order, lalu kirim foto bukti pembayaran.",
        className: "border-amber-400/25 bg-amber-500/[0.07] text-amber-100",
      };
    case "under_review":
      return {
        icon: <LoaderCircle className="h-5 w-5 animate-spin" />,
        title: "Bukti sedang diverifikasi",
        description: "Admin sedang mencocokkan pembayaran dengan dashboard resmi DANA Bisnis.",
        className: "border-violet-400/25 bg-violet-500/[0.07] text-violet-100",
      };
    case "paid":
    case "processing":
    case "completed":
      return {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: status === "completed" ? "Pesanan selesai" : "Pembayaran terverifikasi",
        description:
          status === "paid"
            ? "Pembayaran telah disetujui admin dan pesanan siap diproses."
            : "Pembayaran sudah terverifikasi. Pantau proses pesanan dari halaman ini.",
        className: "border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-100",
      };
    case "rejected":
      return {
        icon: <XCircle className="h-5 w-5" />,
        title: "Bukti pembayaran ditolak",
        description: reviewNote || "Bukti belum dapat diverifikasi. Kirim bukti yang lebih jelas.",
        className: "border-rose-400/25 bg-rose-500/[0.07] text-rose-100",
      };
    case "expired":
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        title: "Order kedaluwarsa",
        description: "Batas waktu pembayaran telah berakhir. Silakan buat order baru.",
        className: "border-slate-400/20 bg-slate-500/[0.07] text-slate-100",
      };
    default:
      return {
        icon: <Clock3 className="h-5 w-5" />,
        title: "Status pesanan diperbarui",
        description: "Lihat status terbaru pesanan di bawah ini.",
        className: "border-white/[0.1] bg-white/[0.035] text-white",
      };
  }
}

export function PaymentView({
  initialOrder,
  accessToken,
  canUseRealtime,
  qrisConfigured,
  helpUrl,
}: PaymentViewProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [status, setStatus] = React.useState<OrderStatus>(initialOrder.status);
  const [reviewNote, setReviewNote] = React.useState(initialOrder.latest_submission?.review_note ?? null);
  const [remaining, setRemaining] = React.useState<number | null>(() => remainingMs(initialOrder.expires_at));
  const [syncing, setSyncing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState("");
  const submissionKey = React.useRef(newSubmissionKey());
  const lastStatus = React.useRef(status);

  const refreshStatus = React.useCallback(
    async (showFeedback = false) => {
      setSyncing(true);
      try {
        const result = await getPaymentStatusAction({
          orderId: initialOrder.id,
          accessToken,
        });
        if (!result.ok) {
          if (showFeedback) toastError("Gagal memperbarui status", result.message);
          return;
        }

        setStatus(result.status);
        setReviewNote(result.reviewNote);
        setRemaining(remainingMs(result.expiresAt));
        if (lastStatus.current !== result.status) {
          lastStatus.current = result.status;
          router.refresh();
        } else if (showFeedback) {
          success("Status sudah diperbarui");
        }
      } finally {
        setSyncing(false);
      }
    }, [accessToken, initialOrder.id, router, success, toastError]
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(remainingMs(initialOrder.expires_at));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [initialOrder.expires_at]);

  React.useEffect(() => {
    const poll = window.setInterval(() => void refreshStatus(false), 15_000);
    const onFocus = () => void refreshStatus(false);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshStatus]);

  React.useEffect(() => {
    if (!canUseRealtime) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`payment-order-${initialOrder.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${initialOrder.id}`,
        },
        (payload) => {
          const nextStatus = payload.new.status as OrderStatus | undefined;
          if (!nextStatus) return;
          setStatus(nextStatus);
          lastStatus.current = nextStatus;
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [canUseRealtime, initialOrder.id, router]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard?.writeText(value);
    success(`${label} disalin`);
  };

  const submitProof = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("orderId", initialOrder.id);
    data.set("accessToken", accessToken);
    data.set("idempotencyKey", submissionKey.current);

    try {
      const result = await submitPaymentProofAction(data);
      if (!result.ok) {
        toastError("Bukti belum terkirim", result.message);
        return;
      }
      success("Bukti pembayaran terkirim", result.message);
      submissionKey.current = newSubmissionKey();
      setStatus("under_review");
      lastStatus.current = "under_review";
      form.reset();
      setSelectedFile("");
      router.refresh();
    } catch {
      toastError("Terjadi kesalahan", "Coba kirim ulang bukti pembayaran.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusNotice = statusMessage(status, reviewNote);
  const payable =
    qrisConfigured && ["pending_payment", "rejected"].includes(status) && (remaining === null || remaining > 0);
  const proofSrc = initialOrder.latest_submission
    ? `/api/payment-proofs/${initialOrder.latest_submission.id}${
        accessToken ? `?access=${encodeURIComponent(accessToken)}` : ""
      }`
    : null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/75">
            Pembayaran Zynex Studio
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Bayar dengan QRIS
          </h1>
          <p className="mt-1.5 text-[14px] text-white/50">
            Order <span className="font-mono font-semibold text-white/75">{initialOrder.order_number}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={status} />
          <button
            type="button"
            onClick={() => void refreshStatus(true)}
            disabled={syncing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            aria-label="Perbarui status"
            title="Perbarui status"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className={`flex items-start gap-3 rounded-2xl border p-4 ${statusNotice.className}`} role="status">
        <span className="mt-0.5 shrink-0">{statusNotice.icon}</span>
        <div>
          <p className="font-semibold">{statusNotice.title}</p>
          <p className="mt-1 text-[13.5px] leading-relaxed opacity-70">{statusNotice.description}</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="space-y-5">
          <GlassCard solid className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-[17px] font-semibold text-white">
                  <QrCode className="h-5 w-5 text-brand-300" aria-hidden="true" />
                  QRIS
                </h2>
                <p className="mt-1 text-[12.5px] text-white/42">Scan menggunakan aplikasi pembayaran yang mendukung QRIS.</p>
              </div>
              {remaining !== null && !["paid", "processing", "completed"].includes(status) && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.07] px-3 py-2 text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-200/55">Sisa waktu</p>
                  <p className="mt-0.5 font-mono text-[15px] font-bold text-amber-200">
                    {formatCountdown(remaining)}
                  </p>
                </div>
              )}
            </div>

            {qrisConfigured ? (
              <div className="mx-auto mt-5 max-w-md rounded-2xl bg-white p-3 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.8)]">
                <Image
                  src={QRIS_PUBLIC_PATH}
                  alt="QRIS statis DANA Bisnis Zynex Studio"
                  width={900}
                  height={900}
                  priority
                  className="h-auto w-full rounded-xl object-contain"
                />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-5 text-center">
                <AlertTriangle className="mx-auto h-7 w-7 text-amber-300" />
                <p className="mt-3 font-semibold text-amber-100">QRIS resmi belum dipasang</p>
                <p className="mt-1 text-[13px] text-amber-100/60">Jangan melakukan pembayaran sampai admin memasang public/qris.jpg.</p>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-brand-400/20 bg-brand-500/[0.07] p-4 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-brand-200/60">Nominal yang harus dibayar</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-white">{formatIDR(initialOrder.total)}</p>
              <button
                type="button"
                onClick={() => void copy(String(initialOrder.total), "Nominal pembayaran")}
                className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-brand-200 hover:text-brand-100"
              >
                <Copy className="h-3.5 w-3.5" />
                Salin nominal
              </button>
              <p className="mt-2 text-[12px] leading-relaxed text-white/45">
                QRIS ini bersifat statis. Masukkan nominal secara manual dan pastikan sama persis.
              </p>
            </div>
          </GlassCard>

          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="text-[16px] font-semibold text-white">Instruksi Pembayaran</h2>
            <ol className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-white/60">
              {[
                "Scan QRIS di atas melalui DANA atau aplikasi pembayaran yang mendukung QRIS.",
                `Masukkan nominal tepat sebesar ${formatIDR(initialOrder.total)}.`,
                "Periksa kembali akun penerima sesuai informasi resmi yang muncul di aplikasi pembayaran.",
                "Selesaikan pembayaran dan simpan bukti transaksi.",
                "Unggah bukti di bawah. Admin akan memeriksa transaksi secara manual.",
              ].map((instruction, index) => (
                <li key={instruction} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold text-white/65">{index + 1}</span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
          </GlassCard>

          {payable && (
            <GlassCard solid className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
                <Upload className="h-4.5 w-4.5 text-emerald-300" aria-hidden="true" />
                Konfirmasi Pembayaran
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/48">
                Upload tidak otomatis membuat status PAID. Admin tetap mencocokkan nominal dengan dashboard resmi DANA Bisnis.
              </p>

              <form onSubmit={submitProof} className="mt-5 space-y-4">
                <Field label="Foto bukti pembayaran" htmlFor="proof" required hint="JPG, PNG, atau WEBP · maksimal 3 MB">
                  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.14] bg-white/[0.025] px-4 py-5 text-center transition-colors hover:border-brand-400/35 hover:bg-brand-500/[0.04]">
                    <FileImage className="h-6 w-6 text-brand-300" aria-hidden="true" />
                    <span className="mt-2 text-[13.5px] font-medium text-white/75">
                      {selectedFile || "Pilih foto dari perangkat"}
                    </span>
                    <span className="mt-1 text-[11.5px] text-white/35">File diverifikasi ulang oleh server</span>
                    <input
                      id="proof"
                      name="proof"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      className="sr-only"
                      onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")}
                    />
                  </label>
                </Field>

                <Field label="Catatan (opsional)" htmlFor="payment-note" hint="Contoh: nama akun pengirim atau waktu transaksi">
                  <Textarea id="payment-note" name="note" rows={3} maxLength={500} placeholder="Tambahkan informasi yang membantu admin memeriksa transaksi…" />
                </Field>

                <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={submitting || !selectedFile}>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Saya Sudah Membayar
                </Button>
              </form>
            </GlassCard>
          )}

          {initialOrder.latest_submission && (
            <GlassCard solid className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[16px] font-semibold text-white">Bukti Terakhir</h2>
                <Badge tone={initialOrder.latest_submission.status === "approved" ? "success" : initialOrder.latest_submission.status === "rejected" ? "danger" : "violet"}>
                  {initialOrder.latest_submission.status === "approved" ? "Disetujui" : initialOrder.latest_submission.status === "rejected" ? "Ditolak" : "Diperiksa"}
                </Badge>
              </div>
              {proofSrc && (
                <a href={proofSrc} target="_blank" rel="noopener noreferrer" className="mt-4 block overflow-hidden rounded-xl border border-white/[0.09] bg-black/20">
                  <Image src={proofSrc} alt="Bukti pembayaran yang dikirim" width={900} height={600} unoptimized className="max-h-96 w-full object-contain" />
                </a>
              )}
              <p className="mt-3 text-[12.5px] text-white/42">Dikirim {formatDateTime(initialOrder.latest_submission.submitted_at)}</p>
            </GlassCard>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <GlassCard solid className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/38">Nomor order</p>
                <p className="mt-1 font-mono text-[17px] font-bold text-brand-200">{initialOrder.order_number}</p>
              </div>
              <button type="button" onClick={() => void copy(initialOrder.order_number, "Nomor order")} aria-label="Salin nomor order" className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white">
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 border-t border-white/[0.08] pt-4">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                <Package className="h-4 w-4 text-brand-300" />
                Detail Pesanan
              </h2>
              <ul className="mt-3 divide-y divide-white/[0.06]">
                {initialOrder.order_items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-medium text-white/78">{item.product_name}</p>
                      <p className="mt-0.5 text-[11.5px] text-white/35">{formatIDR(item.price)} × {item.quantity}</p>
                    </div>
                    <p className="shrink-0 text-[13px] font-semibold text-white/75">{formatIDR(item.subtotal)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-2 border-t border-white/[0.08] pt-3 text-[13.5px]">
                <div className="flex justify-between"><dt className="text-white/45">Subtotal</dt><dd className="text-white/75">{formatIDR(initialOrder.subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-white/45">Diskon</dt><dd className={initialOrder.discount ? "text-emerald-300" : "text-white/35"}>{initialOrder.discount ? `-${formatIDR(initialOrder.discount)}` : formatIDR(0)}</dd></div>
                <div className="flex items-center justify-between border-t border-white/[0.08] pt-3"><dt className="font-semibold text-white">Total</dt><dd className="text-xl font-bold text-white">{formatIDR(initialOrder.total)}</dd></div>
              </dl>
            </div>
          </GlassCard>

          <GlassCard solid className="p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Verifikasi Manual
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-white/48">
              Bukti upload bukan konfirmasi otomatis. Hanya admin Zynex Studio yang dapat mengubah pembayaran menjadi PAID setelah verifikasi.
            </p>
          </GlassCard>

          {initialOrder.events.length > 0 && (
            <GlassCard solid className="p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
                <History className="h-4 w-4 text-brand-300" />
                Riwayat Status
              </h2>
              <ol className="mt-4 space-y-4">
                {initialOrder.events.map((event, index) => (
                  <li key={event.id} className="relative flex gap-3">
                    {index < initialOrder.events.length - 1 && <span className="absolute left-[5px] top-3 h-[calc(100%+0.45rem)] w-px bg-white/[0.08]" />}
                    <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-400 ring-4 ring-brand-500/10" />
                    <div>
                      <p className="text-[12.5px] leading-relaxed text-white/65">{event.label}</p>
                      <p className="mt-0.5 text-[10.5px] text-white/30">{formatDateTime(event.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </GlassCard>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            <a href={helpUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles("success", "md", "w-full")}>
              <MessageCircle className="h-4 w-4" />
              Butuh Bantuan?
            </a>
            <Link href="/store" className={buttonStyles("secondary", "md", "w-full")}>
              Kembali ke Store
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
