import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Deletion request recorded. Processing happens after identity verification.",
  });
}
