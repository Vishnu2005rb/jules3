import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const recentUsers = await prisma.userSubmission.findMany({
      where: { status: 'approved' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        socialLinks: true,
        event: {
          select: { name: true }
        }
      }
    });
    return NextResponse.json(recentUsers);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}
