// middleware.ts
import { NextResponse, NextRequest } from 'next/server';

const PROTECTED = ['/demo'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('demo_session')?.value;
  if (cookie === 'ok') return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/demo-access';
  url.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/demo', '/demo/:path*'],
};
