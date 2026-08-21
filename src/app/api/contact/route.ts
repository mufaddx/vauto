import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const subject = String(form.get("subject") ?? "");
  const message = String(form.get("message") ?? "");
  const name = String(form.get("name") ?? "");
  const accountId = String(form.get("accountId") ?? "") || null;
  if (!email || !subject || !message || !name) {
    return NextResponse.json(
      {
        title: "Message could not be sent",
        reason: "Name, email, subject, and message are required.",
        action: "Complete the form and retry.",
      },
      { status: 400 },
    );
  }
  const ticketId = `VLX-${nanoid(8).toUpperCase()}`;
  const prisma = getPrisma();
  if (prisma) {
    await prisma.supportTicket.create({
      data: { email, subject, message, accountId },
    });
  }
  return NextResponse.redirect(new URL(`/contact?ticket=${ticketId}`, request.url), 303);
}
