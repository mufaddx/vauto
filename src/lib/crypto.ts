import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * AES-256-GCM for long-lived third-party tokens at rest.
 * ENCRYPTION_KEY must be a 32-byte value, hex or base64 encoded.
 */
const ALGORITHM = "aes-256-gcm";

function keyMaterial() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not configured. Access tokens cannot be stored.");
  }
  const hex = /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : null;
  if (hex) return hex;
  const b64 = Buffer.from(raw, "base64");
  if (b64.length === 32) return b64;
  // Deterministic stretch for operator-supplied passphrases.
  return scryptSync(raw, "vidlix-token-encryption", 32);
}

export function encryptionConfigured() {
  return Boolean(process.env.ENCRYPTION_KEY);
}

export function encryptSecret(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, keyMaterial(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string) {
  const [version, ivPart, tagPart, dataPart] = payload.split(".");
  if (version !== "v1" || !ivPart || !tagPart || !dataPart) {
    throw new Error("Encrypted value is not in the expected format.");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    keyMaterial(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
