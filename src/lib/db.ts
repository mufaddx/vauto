import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { envValue } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

export function publicDbError(error: unknown) {
  if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code) {
    return String((error as { code: string }).code);
  }
  const message = error instanceof Error ? error.message : "";
  if (/password|authentication/i.test(message)) return "auth";
  if (/self.signed|certificate chain/i.test(message)) return "ssl-untrusted-chain";
  if (/ssl|certificate/i.test(message)) return "ssl";
  if (/timeout/i.test(message)) return "timeout";
  if (/ENOTFOUND|EAI_AGAIN/i.test(message)) return "dns";
  if (/prepared statement/i.test(message)) return "pgbouncer";
  if (/connect/i.test(message)) return "connect";
  return "query";
}

function cleanDatabaseUrl(raw?: string | null) {
  if (!raw) return null;
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  if (value.startsWith("DATABASE_URL=")) value = value.slice("DATABASE_URL=".length).trim();
  if (value.startsWith("DIRECT_URL=")) value = value.slice("DIRECT_URL=".length).trim();
  if (
    !value ||
    value.includes("[YOUR-PASSWORD]") ||
    value.includes("YOUR_PASSWORD") ||
    value.includes("db.example.com")
  ) {
    return null;
  }
  return value;
}

function pgConnectionString(raw: string) {
  const url = new URL(raw);
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("connection_limit");
  url.searchParams.delete("pool_timeout");
  url.searchParams.delete("connect_timeout");
  // TLS is configured explicitly on the Pool instead, so drop sslmode to stop
  // node-postgres deriving a conflicting setting from the URL.
  url.searchParams.delete("sslmode");
  return url.toString();
}

/**
 * Managed Postgres providers (Supabase included) terminate TLS with a
 * certificate signed by their own CA, which is not in Node's trust store —
 * hence "self-signed certificate in certificate chain".
 *
 * Verification is the default and the only silent path. Skipping it means an
 * attacker who can intercept the connection can present any certificate, so it
 * has to be asked for explicitly rather than fallen into.
 */
function sslConfig() {
  const ca = envValue("DATABASE_CA_CERT");
  if (ca) {
    // Dashboards commonly store the PEM with literal \n sequences.
    return { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true };
  }

  if (tlsVerificationDisabled()) {
    console.warn(
      "[db] DATABASE_TLS_INSECURE is set: the database certificate chain is NOT verified. " +
        "Traffic is encrypted but open to interception. Set DATABASE_CA_CERT and remove this flag.",
    );
    return { rejectUnauthorized: false };
  }

  throw new Error(
    "Database TLS is not configured. Set DATABASE_CA_CERT to your provider's CA certificate " +
      "(Supabase: Project Settings -> Database -> SSL Configuration). To connect without " +
      "verifying the certificate chain, set DATABASE_TLS_INSECURE=true — this is not safe for production.",
  );
}

export function tlsVerificationDisabled() {
  return envValue("DATABASE_TLS_INSECURE") === "true";
}

export function databaseTlsVerified() {
  return Boolean(envValue("DATABASE_CA_CERT"));
}

/** Reported by /api/health so the active TLS posture is never a guess. */
export function databaseTlsMode(): "verified" | "insecure" | "unconfigured" {
  if (databaseTlsVerified()) return "verified";
  return tlsVerificationDisabled() ? "insecure" : "unconfigured";
}

function runtimeConnectionString() {
  // Session-mode pooler (DIRECT_URL / :5432) works with Prisma's query protocol.
  // Transaction pooler (:6543) is still used if it is the only URL set.
  const direct = cleanDatabaseUrl(process.env.DIRECT_URL);
  const pooled = cleanDatabaseUrl(process.env.DATABASE_URL);
  return direct || pooled;
}

export function getPrisma(): PrismaClient | null {
  const raw = runtimeConnectionString();
  if (!raw) return null;
  if (!globalForPrisma.prisma) {
    let connectionString: string;
    try {
      connectionString = pgConnectionString(raw);
    } catch {
      return null;
    }
    const pool = new Pool({
      connectionString,
      ssl: sslConfig(),
      max: 1,
      connectionTimeoutMillis: 15_000,
    });
    globalForPrisma.pool = pool;
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return globalForPrisma.prisma;
}

export async function pingDatabase() {
  let prisma: PrismaClient | null;
  try {
    prisma = getPrisma();
  } catch (error) {
    // A TLS misconfiguration must be reportable, not a crashed health check.
    console.error("[db] client could not be created", error);
    return { ok: false as const, hint: "tls-not-configured" };
  }
  if (!prisma) return { ok: false as const, hint: "missing" };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true as const, hint: null };
  } catch (error) {
    return { ok: false as const, hint: publicDbError(error) };
  }
}
