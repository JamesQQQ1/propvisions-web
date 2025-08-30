// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only protect /demo and its subpaths.
  const isDemoPath = pathname === "/demo" || pathname.startsWith("/demo/");
  if (!isDemoPath) {
    return NextResponse.next();
  }

  const hasAccess = req.cookies.get("ps_demo")?.value === "ok";
  if (hasAccess) {
    return NextResponse.next();
  }

  // Redirect to /demo-access and preserve the intended target in ?next=
  const url = req.nextUrl.clone();
  url.pathname = "/demo-access";
  url.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(url);
}

// Limit middleware execution to the demo area only
export const config = {
  matcher: ["/demo", "/demo/:path*"],
};
