// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyDemoAccess } from './src/lib/demoAuth';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // only guard demo pages
  if (pathname.startsWith('/demo')) {
    const cookie = req.cookies.get('demo-access-token')?.value;
    if (!verifyDemoAccess(cookie)) {
      // redirect unauthorised users to /demo-access
      const url = req.nextUrl.clone();
      url.pathname = '/demo-access';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/demo/:path*'], // 👈 ensures every /demo route is protected
};
