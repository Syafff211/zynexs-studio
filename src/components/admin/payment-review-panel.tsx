"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileCheck2, ShieldAlert, XCircle } from "lucide-react";
import { reviewPaymentSubmissionAction } from "@/actions/payment";
import { Button } from "@/components/ui/button";
import { Badge, GlassCard } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";
import type { PaymentSubmission } from "@/types";

export function PaymentReviewPanel({
  submission,
}: {
  submission: PaymentSubmission | null;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = React.useState<"approve" | "reject" | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  if (!submission) {
    return (
      <GlassCard solid className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
          <FileCheck2 className="h-4.5 w-4.5 text-brand-300" />
          Verifikasi Pembayaran
        </h2>
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/45">
          Customer belum mengirim bukti pembayaran untuk order ini.
        </p>
      </GlassCard>
    );
  }

  const review = async (decision: "approve" | "reject") => {
    if (!formRef.current || saving) return;
    const data = new FormData(formRef.current);
    data.set("submissionId", submission.id);
    data.set("decision", decision);
    if (decision === "reject" && !String(data.get("reviewNote") ?? "").trim()) {
      toastError("Alasan wajib diisi", "Jelaskan alasan bukti pembayaran ditolak.");
      return;
    }

    setSaving(decision);
    try {
      const result = await reviewPaymentSubmissionAction(data);
      if (!result.ok) {
        toastError("Verifikasi gagal", result.message);
        return;
      }
      success("Verifikasi tersimpan", result.message);
      router.refresh();
    } catch {
      toastError("Terjadi kesalahan", "Muat ulang halaman lalu coba lagi.");
    } finally {
      setSaving(null);
    }
  };

  const reviewed = submission.status !== "submitted";

  return (
    <GlassCard solid className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-white">
            <FileCheck2 className="h-4.5 w-4.5 text-brand-300" />
            Verifikasi Pembayaran
          </h2>
          <p className="mt-1 text-[12.5px] text-white/40">
            Dikirim {formatDateTime(submission.submitted_at)}
          </p>
        </div>
        <Badge
          tone={
            submission.status === "approved"
              ? "success"
              : submission.status === "rejected"
                ? "danger"
                : "violet"
          }
        >
          {submission.status === "approved"
            ? "Disetujui"
            : submission.status === "rejected"
              ? "Ditolak"
              : "Menunggu Review"}
        </Badge>
      </div>

      <a
        href={`/api/payment-proofs/${submission.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block overflow-hidden rounded-xl border border-white/[0.1] bg-black/25"
      >
        <Image
          src={`/api/payment-proofs/${submission.id}`}
          alt="Bukti pembayaran customer"
          width={900}
          height={650}
          unoptimized
          className="max-h-[34rem] w-full object-contain"
        />
      </a>

      <dl className="mt-4 space-y-2 text-[12.5px]">
        <div className="flex justify-between gap-4">
          <dt className="text-white/38">Nama file</dt>
          <dd className="truncate text-right text-white/65">{submission.original_name}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/38">Ukuran</dt>
          <dd className="text-white/65">{(submission.file_size / 1024).toFixed(0)} KB</dd>
        </div>
      </dl>

      {submission.note && (
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Catatan customer
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{submission.note}</p>
        </div>
      )}

      {reviewed ? (
        <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-white/75">
            {submission.status === "approved" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-300" />
            )}
            Review selesai {submission.reviewed_at ? formatDateTime(submission.reviewed_at) : ""}
          </p>
          {submission.review_note && (
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">{submission.review_note}</p>
          )}
        </div>
      ) : (
        <form ref={formRef} className="mt-5 space-y-4" onSubmit={(event) => event.preventDefault()}>
          <Field
            label="Catatan verifikasi"
            htmlFor="reviewNote"
            hint="Wajib untuk penolakan; akan terlihat oleh customer"
          >
            <Textarea
              id="reviewNote"
              name="reviewNote"
              rows={3}
              maxLength={1000}
              placeholder="Contoh: nominal tidak sesuai atau bukti kurang jelas…"
            />
          </Field>

          <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3.5">
            <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-amber-100/70">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              Setujui hanya setelah nominal dan transaksi cocok di dashboard resmi DANA Bisnis.
              Tombol setuju akan menandai order PAID dan tercatat di audit log.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <Button
              type="button"
              variant="danger"
              loading={saving === "reject"}
              disabled={Boolean(saving)}
              onClick={() => void review("reject")}
              className="w-full"
            >
              <XCircle className="h-4 w-4" />
              Tolak Bukti
            </Button>
            <Button
              type="button"
              variant="success"
              loading={saving === "approve"}
              disabled={Boolean(saving)}
              onClick={() => void review("approve")}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4" />
              Setujui Pembayaran
            </Button>
          </div>
        </form>
      )}
    </GlassCard>
  );
}
