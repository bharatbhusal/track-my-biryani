import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE, PROTECTED_ROUTES } from '@/lib/constants';
import { verifyToken } from '@/lib/auth';

export function authMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return null;
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    verifyToken(token);
    return null;
  } catch {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
}
