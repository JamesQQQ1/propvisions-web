import { NextResponse, type NextRequest } from 'next/server';

const PROTECT = ['/demo'];
const BYPASS = (process.env.DEMO_GUARD_BYPASS || 'false').toLowerCase() === 'true';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const needsGuard = PROTECT.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (!needsGuard) return NextResponse.next();
  if (BYPASS) return NextResponse.next();

  const token = req.cookies.get('demo_session')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/demo-access';
    url.searchParams.set('next', pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''));
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/demo/:path*'],
};
