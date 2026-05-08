import { NextResponse, type NextRequest } from 'next/server';

import { authMiddleware } from '@/middleware/auth';

export function middleware(request: NextRequest): NextResponse {
  const authResult = authMiddleware(request);

  if (authResult) {
    return authResult;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
