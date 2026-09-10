import { createHash } from "crypto";

/** SHA-256 hex of the raw cookie / bearer token. Never persist the raw value. */
export function hashSessionToken(raw: string) {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function sessionRowId(tokenHash: string) {
  return `ses_${tokenHash.slice(0, 16)}`;
}
