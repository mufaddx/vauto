import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

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

export function getPrisma(): PrismaClient | null {
  const raw = process.env.DATABASE_URL?.trim();
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
    });
    globalForPrisma.pool = pool;
    globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  }
  return globalForPrisma.prisma;
}

export async function pingDatabase() {
  const prisma = getPrisma();
  if (!prisma) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
