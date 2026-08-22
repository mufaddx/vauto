import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_FILE = /\.(.*)$/;

/** Paths that require a signed-in session (checked after host rewriting). */
const PROTECTED_PREFIXES = ["/app", "/admin", "/onboarding"];

function hostOf(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0] ?? "";
}

function cookieName() {
  return process.env.SESSION_COOKIE_NAME ?? "vidlix_session";
}

async function sessionFrom(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  const token = request.cookies.get(cookieName())?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as { sub?: string; role?: string };
  } catch {
    return null;
  }
}

function loginRedirect(request: NextRequest, nextPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(nextPath)}`;
  return NextResponse.redirect(url);
}

function securityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const host = hostOf(request);
  const headers = new Headers(request.headers);
  headers.set("x-vidlix-host", host);

  // Resolve the effective path after host-based rewriting so the auth check
  // sees the real destination (app.vidlix.in/ -> /app).
  let effectivePath = pathname;
  let rewriteTo: string | null = null;

  if (host.startsWith("app.")) {
    if (
      !pathname.startsWith("/app") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/signup") &&
      !pathname.startsWith("/forgot-password") &&
      !pathname.startsWith("/reset-password") &&
      !pathname.startsWith("/onboarding")
    ) {
      rewriteTo = pathname === "/" ? "/app" : `/app${pathname}`;
      effectivePath = rewriteTo;
    }
  } else if (host.startsWith("admin.")) {
    if (!pathname.startsWith("/admin")) {
      rewriteTo = pathname === "/" ? "/admin" : `/admin${pathname}`;
      effectivePath = rewriteTo;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => effectivePath === prefix || effectivePath.startsWith(`${prefix}/`),
  );

  if (isProtected) {
    const session = await sessionFrom(request);
    if (!session?.sub) {
      return securityHeaders(loginRedirect(request, effectivePath));
    }
    if (effectivePath.startsWith("/admin") && session.role !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      url.search = "";
      return securityHeaders(NextResponse.redirect(url));
    }
  }

  if (rewriteTo) {
    const url = request.nextUrl.clone();
    url.pathname = rewriteTo;
    return securityHeaders(NextResponse.rewrite(url, { request: { headers } }));
  }

  return securityHeaders(NextResponse.next({ request: { headers } }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
