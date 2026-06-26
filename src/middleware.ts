import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/features/auth/session';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  // Protected route → login
  if (!isPublic && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged in → home
  if (isPublic && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
