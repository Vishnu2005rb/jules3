import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { loginSchema } from '@/lib/validation/schemas';
import { rateLimit, getIP } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    // Rate Limiting (5 login attempts per 15 minutes per IP)
    const ip = getIP(req);
    const limiter = rateLimit(`login_${ip}`, 5, 15 * 60 * 1000);

    if (!limiter.success) {
      return NextResponse.json({
        error: 'Too many login attempts. Please try again later.'
      }, { status: 429 });
    }

    const body = await req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { username, password } = validation.data;

    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const secretValue = process.env.JWT_SECRET;
    if (!secretValue) {
      throw new Error('JWT_SECRET is not configured');
    }
    const secret = new TextEncoder().encode(secretValue);
    const token = await new SignJWT({ id: admin.id, username: admin.username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h') // Reduced from 24h for better security
      .sign(secret);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed from 'lax' for better CSRF protection
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
