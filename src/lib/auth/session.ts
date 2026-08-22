import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { secureCookies } from "@/lib/auth/cookies";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "vidlix_session";

/**
 * Never fall back to a hardcoded secret. A missing SESSION_SECRET in a
 * deployed environment would let anyone mint a valid session token.
 */
function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not configured (32+ characters required). Sessions are disabled until it is set.",
    );
  }
  return new TextEncoder().encode(secret);
}

export function sessionSecretConfigured() {
  const secret = process.env.SESSION_SECRET;
  return Boolean(secret && secret.length >= 16);
}

export type SessionRole = "USER" | "ADMIN" | "SUPPORT";

export type SessionPayload = {
  sub: string;
  email: string;
  firstName: string;
  role: SessionRole;
  workspaceId?: string;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Server-component guard for the signed-in app. Redirects to /login. */
export async function requireSession(returnTo?: string): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) {
    const target = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
    redirect(target);
  }
  return session;
}

/** Server-component guard for the admin console. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) redirect("/login?next=%2Fadmin");
  if (session.role !== "ADMIN") redirect("/app");
  return session;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function sessionCookieName() {
  return COOKIE;
}
