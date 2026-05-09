import { type NextRequest, NextResponse } from 'next/server';

import { AUTH_COOKIE, PROTECTED_ROUTES } from '@/lib/constants';

const AUTH_PAGES = ['/auth/login', '/auth/signup'];

function isTokenProbablyValid(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload || typeof payload !== 'object') return false;
    const exp = (payload as Record<string, unknown>).exp;
    if (!exp) return false;
    return Number(exp) * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function authMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthPage = AUTH_PAGES.some((route) => pathname.startsWith(route));
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const hasValidToken = token ? isTokenProbablyValid(token) : false;

  if (isAuthPage && hasValidToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isProtected) {
    return null;
  }

  if (!hasValidToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null;
}
