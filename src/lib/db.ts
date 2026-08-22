import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

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
  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }
  return url.toString();
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
      max: 1,
      connectionTimeoutMillis: 15_000,
    });
    globalForPrisma.pool = pool;
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return globalForPrisma.prisma;
}

export async function pingDatabase() {
  const prisma = getPrisma();
  if (!prisma) return { ok: false as const, hint: "missing" };
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true as const, hint: null };
  } catch (error) {
    return { ok: false as const, hint: publicDbError(error) };
  }
}
