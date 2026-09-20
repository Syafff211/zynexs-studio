"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient, requireAdmin } from "@/lib/supabase/server";
import {
  firstError,
  paymentReviewSchema,
  paymentStatusRequestSchema,
  paymentSubmissionSchema,
} from "@/lib/validations";
import {
  authorizePaymentOrder,
  expireOrderIfNeeded,
  getAuthorizedPaymentStatus,
} from "@/services/payment";

const MAX_PROOF_BYTES = 3 * 1024 * 1024;
const MAX_SUBMISSIONS_PER_ORDER = 5;

export interface PaymentActionResult {
  ok: boolean;
  message: string;
}

function detectImageType(bytes: Uint8Array): { mime: string; extension: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}

export async function getPaymentStatusAction(input: unknown) {
  const parsed = paymentStatusRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: firstError(parsed.error) };

  const status = await getAuthorizedPaymentStatus(
    parsed.data.orderId,
    parsed.data.accessToken || null
  );
  if (!status) return { ok: false as const, message: "Order tidak ditemukan atau akses ditolak." };
  return { ok: true as const, ...status };
}

export async function submitPaymentProofAction(formData: FormData): Promise<PaymentActionResult> {
  const parsed = paymentSubmissionSchema.safeParse({
    orderId: formData.get("orderId"),
    accessToken: formData.get("accessToken") ?? "",
    note: formData.get("note") ?? "",
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };

  const access = await authorizePaymentOrder(
    parsed.data.orderId,
    parsed.data.accessToken || null
  );
  if (!access) return { ok: false, message: "Order tidak ditemukan atau akses ditolak." };

  const order = await expireOrderIfNeeded(access.order, access.profile?.id ?? null);
  if (order.payment_method !== "qris_dana_static") {
    return { ok: false, message: "Order ini tidak menggunakan pembayaran QRIS." };
  }
  if (order.status === "expired") {
    return { ok: false, message: "Batas waktu pembayaran order ini sudah berakhir." };
  }
  if (!["pending_payment", "rejected"].includes(order.status)) {
    return {
      ok: false,
      message:
        order.status === "under_review"
          ? "Bukti pembayaran sedang diperiksa admin."
          : "Bukti pembayaran tidak dapat dikirim pada status order ini.",
    };
  }

  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Pilih foto bukti pembayaran terlebih dahulu." };
  }
  if (file.size > MAX_PROOF_BYTES) {
    return { ok: false, message: "Ukuran bukti pembayaran maksimal 3 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected) {
    return { ok: false, message: "Bukti pembayaran harus berupa JPG, PNG, atau WEBP yang valid." };
  }

  const admin = createAdminClient();
  const [{ count }, { data: duplicate }] = await Promise.all([
    admin
      .from("payment_submissions")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id),
    admin
      .from("payment_submissions")
      .select("id")
      .eq("order_id", order.id)
      .eq("idempotency_key", parsed.data.idempotencyKey)
      .maybeSingle(),
  ]);

  if (duplicate) {
    return { ok: true, message: "Bukti pembayaran sudah terkirim dan sedang diperiksa." };
  }
  if ((count ?? 0) >= MAX_SUBMISSIONS_PER_ORDER) {
    return { ok: false, message: "Batas pengiriman bukti untuk order ini sudah tercapai." };
  }

  const proofPath = `${order.id}/${randomUUID()}.${detected.extension}`;
  const { error: uploadError } = await admin.storage
    .from("payment-proofs")
    .upload(proofPath, bytes, {
      upsert: false,
      cacheControl: "0",
      contentType: detected.mime,
    });

  if (uploadError) {
    console.error("[payment-proof:upload]", uploadError);
    return { ok: false, message: "Gagal mengunggah bukti pembayaran. Coba lagi." };
  }

  const { data, error } = await admin.rpc("register_payment_submission", {
    p_order_id: order.id,
    p_proof_path: proofPath,
    p_original_name: file.name || `bukti-${order.order_number}.${detected.extension}`,
    p_content_type: detected.mime,
    p_file_size: file.size,
    p_note: parsed.data.note || null,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_actor_id: access.profile?.id ?? null,
  });

  const row = Array.isArray(data) ? data[0] : null;
  const resultCode = row?.result_code as string | undefined;
  if (error || !["ok", "duplicate"].includes(resultCode ?? "")) {
    await admin.storage.from("payment-proofs").remove([proofPath]);
    console.error("[payment-proof:register]", error ?? resultCode);

    const message =
      resultCode === "expired"
        ? "Batas waktu pembayaran order ini sudah berakhir."
        : resultCode === "invalid_status"
          ? "Status order sudah berubah. Muat ulang halaman dan coba lagi."
          : "Gagal mencatat bukti pembayaran. Coba lagi.";
    return { ok: false, message };
  }

  if (resultCode === "duplicate") {
    await admin.storage.from("payment-proofs").remove([proofPath]);
  }

  revalidatePath(`/payment/${order.id}`);
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  return { ok: true, message: "Bukti terkirim. Admin akan memeriksa pembayaran kamu." };
}

export async function reviewPaymentSubmissionAction(
  formData: FormData
): Promise<PaymentActionResult> {
  let reviewer;
  try {
    reviewer = await requireAdmin();
  } catch {
    return { ok: false, message: "Akses ditolak." };
  }

  const parsed = paymentReviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
    reviewNote: formData.get("reviewNote") ?? "",
  });
  if (!parsed.success) return { ok: false, message: firstError(parsed.error) };
  if (parsed.data.decision === "reject" && !parsed.data.reviewNote) {
    return { ok: false, message: "Alasan penolakan wajib diisi." };
  }

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("payment_submissions")
    .select("order_id")
    .eq("id", parsed.data.submissionId)
    .maybeSingle();
  if (!submission) return { ok: false, message: "Bukti pembayaran tidak ditemukan." };

  const { data, error } = await admin.rpc("review_payment_submission", {
    p_submission_id: parsed.data.submissionId,
    p_reviewer_id: reviewer.id,
    p_decision: parsed.data.decision,
    p_review_note: parsed.data.reviewNote || null,
  });

  if (error) {
    console.error("[payment-review]", error);
    return { ok: false, message: "Gagal memperbarui verifikasi pembayaran." };
  }
  if (data === "already_reviewed") {
    return { ok: true, message: "Bukti ini sudah diperiksa sebelumnya." };
  }
  if (data !== "approved" && data !== "rejected") {
    return { ok: false, message: "Status order berubah. Muat ulang halaman." };
  }

  const orderId = submission.order_id as string;
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/payment/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);

  return {
    ok: true,
    message:
      data === "approved"
        ? "Pembayaran disetujui dan order ditandai sudah dibayar."
        : "Bukti ditolak. Customer dapat mengirim ulang sebelum order kedaluwarsa.",
  };
}
