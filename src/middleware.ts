import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token?.id;

  // 1. Protected routes: /dashboard, /clients, /invoices
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/invoices');

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Auth routes: /login, /signup
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  if (isAuthRoute && isAuthenticated) {
    const rawCallback = req.nextUrl.searchParams.get('callbackUrl');
    const validCallback =
      rawCallback && rawCallback.startsWith('/') && !rawCallback.startsWith('//')
        ? rawCallback
        : '/dashboard';
    return NextResponse.redirect(new URL(validCallback, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/clients/:path*', '/invoices/:path*', '/login', '/signup'],
};
