import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const secretValue = process.env.JWT_SECRET;
const JWT_SECRET = secretValue ? new TextEncoder().encode(secretValue) : null;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (token && JWT_SECRET) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const exp = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.revokedToken.upsert({
          where: { token },
          update: {},
          create: {
            token,
            expiresAt: exp,
          },
        });
      } catch (err) {
      }
      cookieStore.delete('admin_token');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
