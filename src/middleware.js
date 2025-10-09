import { NextResponse } from 'next/server';

export function middleware(request) {
  // Redirect root path to sign-in
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/'
};