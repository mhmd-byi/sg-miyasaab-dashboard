import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public: login page and all auth API routes
  if (pathname.startsWith('/api/auth') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/login')) {
    // Redirect already-authenticated users away from login
    const session = await getSessionFromRequest(req);
    if (session) return NextResponse.redirect(new URL('/', req.url));
    return NextResponse.next();
  }

  // All other routes require a valid session
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin-only routes
  if (
    (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) &&
    session.role !== 'admin'
  ) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|public/).*)'],
};
