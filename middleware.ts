// middleware.ts
import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only gate /demo (and its subpaths if any)
  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    const hasCookie = req.cookies.get("ps_demo")?.value === "ok";
    if (!hasCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/demo-access";
      // Keep original as ?next= for a nice redirect after login
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/demo/:path*", "/demo"],
};
