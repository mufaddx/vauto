import { NextResponse } from "next/server";
import { getRedis } from "@/lib/queues";
import { pingDatabase } from "@/lib/db";

export async function GET() {
  const database = await pingDatabase();
  const redis = getRedis();
  return NextResponse.json({
    ok: true,
    env: process.env.APP_ENV ?? "development",
    database,
    redis: Boolean(redis),
  });
}
