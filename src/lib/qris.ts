import "server-only";
import { existsSync, openSync, readSync, closeSync } from "node:fs";
import path from "node:path";

export const QRIS_PUBLIC_PATH = "/qris.jpg";

/**
 * Fail closed when the merchant has not deployed the real DANA Business QRIS.
 * We verify JPEG magic bytes so a text placeholder renamed to .jpg cannot
 * accidentally enable checkout.
 */
export function isStaticQrisConfigured(): boolean {
  try {
    const filePath = path.join(process.cwd(), "public", "qris.jpg");
    if (!existsSync(filePath)) return false;

    const fd = openSync(filePath, "r");
    const header = Buffer.alloc(3);
    readSync(fd, header, 0, 3, 0);
    closeSync(fd);

    return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  } catch {
    return false;
  }
}
