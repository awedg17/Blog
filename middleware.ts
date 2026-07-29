import { NextRequest, NextResponse } from "next/server";

// Lightweight cookie presence check (edge-safe). The real signature/expiry
// check happens in getSession() on the server components/routes themselves.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("blog_session");

  if (req.nextUrl.pathname.startsWith("/admin") && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (req.nextUrl.pathname === "/login" && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
