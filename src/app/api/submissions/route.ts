import { NextResponse } from 'next/server';
import { processUserSubmission } from '@/lib/services/submissionService';
import { submissionSchema } from '@/lib/validation/schemas';
import { rateLimit, getIP } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    // Rate Limiting (5 submissions per 10 minutes per IP)
    const ip = getIP(req);
    const limiter = rateLimit(`submission_${ip}`, 5, 10 * 60 * 1000);

    if (!limiter.success) {
      return NextResponse.json({
        error: 'Too many submissions. Please try again later.'
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((limiter.reset - Date.now()) / 1000).toString()
        }
      });
    }

    const body = await req.json();

    // Validation
    const validation = submissionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }

    const result = await processUserSubmission(validation.data);

    if ('isDuplicate' in result && result.isDuplicate) {
      return NextResponse.json(
        { error: result.reason, code: 'DUPLICATE' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Submission failed:', error);

    if (error.message.includes('not found') || error.message.includes('closed')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
