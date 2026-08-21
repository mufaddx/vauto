import { NextResponse } from "next/server";
import { getRedis } from "@/lib/queues";
import { getPrisma } from "@/lib/db";

export async function GET() {
  const db = getPrisma();
  const redis = getRedis();
  return NextResponse.json({
    ok: true,
    env: process.env.APP_ENV ?? "development",
    database: Boolean(db),
    redis: Boolean(redis),
  });
}
