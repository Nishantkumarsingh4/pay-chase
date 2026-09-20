import { NextResponse } from 'next/server';
import { cleanupExpiredRecords } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await cleanupExpiredRecords();
  return NextResponse.json({
    success: true,
    cleaned: result,
  });
}
