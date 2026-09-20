import { NextRequest, NextResponse } from 'next/server';
import { processAutomatedReminders } from '@/lib/reminder-service';

export async function GET(req: NextRequest) {
  try {
    // Optional bearer / query parameter secret verification
    const authHeader = req.headers.get('authorization');
    const searchParams = req.nextUrl.searchParams;
    const providedSecret = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processAutomatedReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: result,
    });
  } catch (err: any) {
    console.error('[CRON_REMINDERS_API_ERROR]', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
