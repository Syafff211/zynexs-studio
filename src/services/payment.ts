import "server-only";
import { createAdminClient, getProfile } from "@/lib/supabase/server";
import { verifyPaymentAccessToken } from "@/lib/payment-access";
import type {
  AuditLog,
  OrderStatus,
  OrderWithItems,
  PaymentOrderView,
  PaymentSubmission,
  Profile,
} from "@/types";

interface PaymentAccessResult {
  order: OrderWithItems;
  profile: Profile | null;
  isAdmin: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  "order.created": "Order dibuat dan menunggu pembayaran",
  "payment.submitted": "Bukti pembayaran dikirim untuk diperiksa",
  "payment.approved": "Pembayaran disetujui admin",
  "payment.rejected": "Bukti pembayaran ditolak admin",
  "order.expired": "Batas waktu pembayaran berakhir",
  "order.status_changed": "Status pesanan diperbarui",
};

export async function authorizePaymentOrder(
  orderId: string,
  accessToken?: string | null
): Promise<PaymentAccessResult | null> {
  const [profile, orderResult] = await Promise.all([
    getProfile(),
    createAdminClient()
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle(),
  ]);

  if (orderResult.error || !orderResult.data) return null;
  const order = orderResult.data as unknown as OrderWithItems;
  const isAdmin = profile?.role === "admin" && profile.is_active;
  const isOwner = Boolean(profile && order.user_id === profile.id);
  const hasGuestAccess = verifyPaymentAccessToken(order.id, accessToken);

  if (!isAdmin && !isOwner && !hasGuestAccess) return null;
  return { order, profile, isAdmin };
}

export async function expireOrderIfNeeded(
  order: OrderWithItems,
  actorId: string | null = null
): Promise<OrderWithItems> {
  if (
    order.payment_method !== "qris_dana_static" ||
    !["pending_payment", "rejected"].includes(order.status) ||
    !order.expires_at ||
    new Date(order.expires_at).getTime() > Date.now()
  ) {
    return order;
  }

  const admin = createAdminClient();
  const { data: expired } = await admin.rpc("expire_qris_order", {
    p_order_id: order.id,
    p_actor_id: actorId,
  });

  if (expired) {
    return { ...order, status: "expired", updated_at: new Date().toISOString() };
  }
  return order;
}

export async function getPaymentOrderView(
  orderId: string,
  accessToken?: string | null
): Promise<{ order: PaymentOrderView; canUseRealtime: boolean } | null> {
  const access = await authorizePaymentOrder(orderId, accessToken);
  if (!access) return null;

  const order = await expireOrderIfNeeded(access.order, access.profile?.id ?? null);
  const admin = createAdminClient();
  const [submissionsResult, eventsResult] = await Promise.all([
    admin
      .from("payment_submissions")
      .select("*")
      .eq("order_id", order.id)
      .order("submitted_at", { ascending: false })
      .limit(1),
    admin
      .from("audit_logs")
      .select("*")
      .eq("entity_type", "order")
      .eq("entity_id", order.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const latest = ((submissionsResult.data ?? [])[0] ?? null) as PaymentSubmission | null;
  const events = (eventsResult.data ?? []) as AuditLog[];

  const safeOrder: PaymentOrderView = {
    id: order.id,
    order_number: order.order_number,
    user_id: order.user_id,
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    promo_code: order.promo_code,
    status: order.status,
    payment_method: order.payment_method,
    notes: order.notes,
    expires_at: order.expires_at,
    paid_at: order.paid_at,
    created_at: order.created_at,
    updated_at: order.updated_at,
    order_items: order.order_items,
    latest_submission: latest
      ? {
          id: latest.id,
          original_name: latest.original_name,
          note: latest.note,
          review_note: latest.review_note,
          status: latest.status,
          reviewed_at: latest.reviewed_at,
          submitted_at: latest.submitted_at,
        }
      : null,
    events: events.map((event) => ({
      id: event.id,
      action: event.action,
      label: EVENT_LABELS[event.action] ?? "Aktivitas pembayaran diperbarui",
      created_at: event.created_at,
    })),
  };

  return {
    order: safeOrder,
    canUseRealtime: Boolean(access.profile && order.user_id === access.profile.id),
  };
}

export async function getAuthorizedPaymentStatus(
  orderId: string,
  accessToken?: string | null
): Promise<{
  status: OrderStatus;
  paidAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
  submissionStatus: PaymentSubmission["status"] | null;
  reviewNote: string | null;
} | null> {
  const access = await authorizePaymentOrder(orderId, accessToken);
  if (!access) return null;

  const order = await expireOrderIfNeeded(access.order, access.profile?.id ?? null);
  const { data } = await createAdminClient()
    .from("payment_submissions")
    .select("status, review_note")
    .eq("order_id", order.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    status: order.status,
    paidAt: order.paid_at,
    expiresAt: order.expires_at,
    updatedAt: order.updated_at,
    submissionStatus: (data?.status as PaymentSubmission["status"] | undefined) ?? null,
    reviewNote: (data?.review_note as string | null | undefined) ?? null,
  };
}

export async function getAuthorizedProof(
  submissionId: string,
  accessToken?: string | null
): Promise<{
  data: Blob;
  contentType: string;
  originalName: string;
} | null> {
  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("payment_submissions")
    .select("id, order_id, proof_path, content_type, original_name")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) return null;
  const access = await authorizePaymentOrder(submission.order_id as string, accessToken);
  if (!access) return null;

  const { data, error } = await admin.storage
    .from("payment-proofs")
    .download(submission.proof_path as string);

  if (error || !data) return null;
  return {
    data,
    contentType: submission.content_type as string,
    originalName: submission.original_name as string,
  };
}
