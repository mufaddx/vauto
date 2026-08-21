import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

function hostOf(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0] ?? "";
}

export function middleware(request: NextRequest) {
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

  if (host.startsWith("app.")) {
    if (!pathname.startsWith("/app") && !pathname.startsWith("/login") && !pathname.startsWith("/signup") && !pathname.startsWith("/forgot-password") && !pathname.startsWith("/reset-password") && !pathname.startsWith("/onboarding")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/app" : `/app${pathname}`;
      return NextResponse.rewrite(url, { headers });
    }
  }

  if (host.startsWith("admin.")) {
    if (!pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      return NextResponse.rewrite(url, { headers });
    }
  }

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
