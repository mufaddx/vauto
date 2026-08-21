import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "If this email exists, a reset link will be sent when mail is configured.",
  });
}
