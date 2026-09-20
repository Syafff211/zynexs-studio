import "server-only";

/**
 * Extension point for a future official DANA Business API/webhook product.
 *
 * There is intentionally no endpoint, signature algorithm, or payload mapping
 * here until Zynex Studio receives official merchant documentation and
 * credentials. Production therefore uses ManualPaymentVerifier below and can
 * never claim an automatic payment success.
 */
export interface OfficialDanaWebhookEvent {
  eventId: string;
  merchantReference: string;
  amount: number;
  status: string;
  rawPayload: unknown;
}

export interface OfficialDanaAdapter {
  readonly provider: "dana_business_official";
  verifyWebhook(request: Request): Promise<OfficialDanaWebhookEvent>;
}

export function getOfficialDanaAdapter(): OfficialDanaAdapter | null {
  return null;
}

export const PAYMENT_VERIFICATION_MODE = "manual_admin" as const;
