/**
 * Minimal transactional mail sender.
 *
 * Uses Resend when RESEND_API_KEY is set. Without it nothing is sent — the
 * message is logged instead so local and unconfigured environments still work
 * without silently pretending mail was delivered.
 */
export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type MailResult = { sent: boolean; reason?: string };

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(message: MailMessage): Promise<MailResult> {
  if (!mailConfigured()) {
    console.info("[mail:not-configured]", {
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return { sent: false, reason: "RESEND_API_KEY or MAIL_FROM is not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error("[mail:failed]", response.status, body.slice(0, 300));
      return { sent: false, reason: `provider responded ${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("[mail:error]", error);
    return { sent: false, reason: "network error" };
  }
}
