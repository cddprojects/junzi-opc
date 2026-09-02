import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { formatCode, normalizeCode } from "@/lib/account";

export function newId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

export function checkPassword(password: string, salt: string, hash: string) {
  const next = scryptSync(password, salt, 32);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function toCrockford(bytes: Buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31];
  return out;
}

export function makeVerifyCode(
  secret: string,
  parts: { userId: string; productSlug: string; orderId: string },
) {
  const payload = `v1|${parts.userId}|${parts.productSlug}|${parts.orderId}`;
  const digest = createHmac("sha256", secret).update(payload).digest();
  return formatCode(toCrockford(digest.subarray(0, 10)));
}

export function codesMatch(left: string, right: string) {
  const a = normalizeCode(left);
  const b = normalizeCode(right);
  if (!a || a.length !== b.length) return false;
  const leftBuf = Buffer.from(a);
  const rightBuf = Buffer.from(b);
  if (leftBuf.length !== rightBuf.length) return false;
  return timingSafeEqual(leftBuf, rightBuf);
}

export function generateVerifySecret() {
  return randomBytes(32).toString("hex");
}
