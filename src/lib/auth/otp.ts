import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

/**
 * Six digits, generated with a CSPRNG. randomInt is uniform, unlike
 * Math.random() scaled into a range.
 */
export function createOtpCode() {
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(0, max)).padStart(OTP_LENGTH, "0");
}

/** Codes are stored hashed, so a database leak does not hand out logins. */
export function hashOtpCode(email: string, code: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export function otpExpiry(now = new Date()) {
  return new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);
}

export function otpMatches(email: string, code: string, storedHash: string) {
  const candidate = Buffer.from(hashOtpCode(email, code));
  const stored = Buffer.from(storedHash);
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isPlausibleEmail(value: string) {
  // Deliberately loose: delivery is the real check, not a clever regex.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function normalizeOtpInput(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function firstNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim().split(" ")[0] ?? "";
  if (!cleaned) return "there";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
