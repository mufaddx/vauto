/**
 * Only same-origin, absolute-path redirects are allowed after auth so a
 * crafted `next` value cannot bounce a user to an external site.
 */
export function safeNextPath(value: unknown, fallback: string) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}
