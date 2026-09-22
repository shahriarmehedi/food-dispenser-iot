import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifySession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always permit public hardware, manual/docs, and authentication routes
  if (
    pathname.startsWith('/api/dispenser') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/manual' ||
    pathname.startsWith('/manual') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check admin session cookie
  const sessionToken = request.cookies.get(COOKIE_NAME)?.value;
  const isValid = await verifySession(sessionToken);

  if (!isValid) {
    // If it is an API request, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin login required.' },
        { status: 401 }
      );
    }
    // Redirect browser requests to /login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
