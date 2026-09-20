import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { paymentLinkSecret } from "@/lib/env";

const PURPOSE = "zynex-payment-access-v1";

/**
 * Deterministic bearer token for guest payment pages. The raw token is never
 * stored in the database and cannot be forged without the server-only secret.
 */
export function createPaymentAccessToken(orderId: string): string {
  return createHmac("sha256", paymentLinkSecret())
    .update(`${PURPOSE}:${orderId}`)
    .digest("base64url");
}

export function verifyPaymentAccessToken(orderId: string, token: string | null | undefined): boolean {
  if (!token || token.length > 128) return false;

  const expected = createPaymentAccessToken(orderId);
  const actualBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function buildPaymentPath(orderId: string, isGuest: boolean): string {
  const base = `/payment/${encodeURIComponent(orderId)}`;
  if (!isGuest) return base;
  return `${base}?access=${encodeURIComponent(createPaymentAccessToken(orderId))}`;
}
