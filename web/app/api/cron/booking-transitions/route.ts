import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Cron handler — runs daily at 00:01 (configured in vercel.json).
 *
 * Transitions:
 *   - bookings with status='paid'        AND check_in  = today → status='in_progress'
 *   - bookings with status='in_progress' AND check_out <= today → status='completed'
 *
 * Security: requires `Authorization: Bearer ${CRON_SECRET}` header that
 * Vercel sets on cron invocations. Without it the route 401s.
 */
export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && auth !== `Bearer ${expected}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  // 1) paid → in_progress (guests arriving today)
  const { data: toStart, error: e1 } = await supabase
    .from('bookings')
    .update({ status: 'in_progress', status_changed_at: new Date().toISOString() })
    .eq('status', 'paid')
    .eq('check_in', today)
    .select('id')

  // 2) in_progress → completed (check-outs reached)
  const { data: toEnd, error: e2 } = await supabase
    .from('bookings')
    .update({
      status: 'completed',
      checked_out_at: new Date().toISOString(),
      status_changed_at: new Date().toISOString(),
    })
    .eq('status', 'in_progress')
    .lte('check_out', today)
    .select('id')

  return NextResponse.json({
    ok: true,
    today,
    started: toStart?.length ?? 0,
    completed: toEnd?.length ?? 0,
    errors: { start: e1?.message ?? null, end: e2?.message ?? null },
  })
}
