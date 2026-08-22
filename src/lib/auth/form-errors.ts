import { NextResponse } from "next/server";

/**
 * A browser form post should come back to the form, not to a JSON page. API
 * clients still get JSON, so both callers are served without guessing.
 */
export function wantsHtml(request: Request) {
  return (request.headers.get("accept") ?? "").includes("text/html");
}

export type FormFailure = {
  code: string;
  title: string;
  reason: string;
  action: string;
  status: number;
};

export function respondToForm(
  request: Request,
  path: string,
  failure: FormFailure,
  extraParams: Record<string, string> = {},
) {
  if (wantsHtml(request)) {
    const url = new URL(path, request.url);
    url.searchParams.set("error", failure.code);
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) url.searchParams.set(key, value);
    }
    return NextResponse.redirect(url, 303);
  }

  return NextResponse.json(
    { title: failure.title, reason: failure.reason, action: failure.action },
    { status: failure.status },
  );
}

/** Messages for the codes the auth forms can redirect back with. */
export const AUTH_FORM_MESSAGES: Record<string, string> = {
  invalid: "Name, email, and a password of at least 8 characters are required.",
  credentials: "The email or password did not match.",
  exists: "An account with this email already exists. Log in instead.",
  throttled: "Too many attempts from this device. Wait a few minutes and try again.",
  db_unavailable:
    "This deployment has no database connection configured, so accounts cannot be created yet.",
  db_ssl:
    "The database TLS handshake failed. Set DATABASE_CA_CERT for this deployment.",
  "db_ssl-untrusted-chain":
    "The database TLS certificate could not be verified. Set DATABASE_CA_CERT for this deployment.",
  db_auth: "The database rejected the credentials in DATABASE_URL.",
  db_timeout: "The database did not respond in time. Try again shortly.",
  db_dns: "The database host in DATABASE_URL could not be resolved.",
  db_pgbouncer:
    "The pooled connection rejected a prepared statement. Use the session pooler URL in DIRECT_URL.",
  db_connect: "The database could not be reached. Check DATABASE_URL and DIRECT_URL.",
  "db_tls-not-configured":
    "Database TLS is not configured. Set DATABASE_CA_CERT for this deployment.",
};

export function authFormMessage(error: string | undefined) {
  if (!error) return null;
  if (AUTH_FORM_MESSAGES[error]) return AUTH_FORM_MESSAGES[error];
  if (error.startsWith("db_")) {
    return "The database could not be reached. Check /api/health for this deployment.";
  }
  return null;
}
