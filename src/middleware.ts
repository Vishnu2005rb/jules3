import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretValue = process.env.JWT_SECRET;
if (!secretValue) {
  // In a real production app, this should always be set.
  // We throw an error to prevent starting with a known weak key.
  throw new Error('JWT_SECRET environment variable is missing. Please set it in your .env file.');
}
const JWT_SECRET = new TextEncoder().encode(secretValue);

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect admin routes
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Strict expiry check (jose handles this, but good to be explicit about requirements)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      const response = NextResponse.next();

      // Add security headers to admin responses
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return response;
    } catch (err) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_token');
      return response;
    }
  }

  // Protect admin API routes
  if (path.startsWith('/api/admin') && path !== '/api/admin/login') {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      return NextResponse.next();
    } catch (err) {
      const response = NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      response.cookies.delete('admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
