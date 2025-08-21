// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

const PROTECT = ['/demo'];
const BYPASS = (process.env.DEMO_GUARD_BYPASS || 'false').toLowerCase() === 'true';

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // guard both /demo and subpaths
  const needsGuard =
    PROTECT.includes(pathname) ||
    PROTECT.some(p => pathname.startsWith(p + '/'));

  if (!needsGuard) return NextResponse.next();
  if (BYPASS) return NextResponse.next();

  const token = req.cookies.get('demo_session')?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/demo-access';
    if (pathname !== '/demo') {
      url.searchParams.set(
        'next',
        pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      );
    } else {
      url.searchParams.set('next', '/demo');
    }
    return NextResponse.redirect(url);
  }

  // (Optional) mark requests that passed the guard
  const res = NextResponse.next();
  res.headers.set('x-demo-guard', 'hit');
  return res;
}

// IMPORTANT: include both the root and the wildcard
export const config = {
  matcher: ['/demo', '/demo/:path*'],
};
