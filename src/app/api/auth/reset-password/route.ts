import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    title: "Password reset is not ready in this environment",
    reason: "Mail delivery and reset tokens are configured per environment.",
    action: "Use staging mail settings or contact support.",
  });
}
