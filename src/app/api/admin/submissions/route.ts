import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const submissions = await prisma.userSubmission.findMany({
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
