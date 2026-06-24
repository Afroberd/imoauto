import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, EMAIL_ENABLED } from '@/lib/email/resend'
import { renderEmail } from '@/lib/email/template'

/**
 * Sends an email for each new in-app notification.
 *
 * Wired to a Supabase **Database Webhook** on `public.notifications` (INSERT),
 * which POSTs `{ type, table, record, ... }` here. We look up the recipient's
 * email from `profiles` (public-readable, so the anon key is enough — no
 * service role needed) and send via Resend.
 *
 * Security: the webhook must send header `x-webhook-secret` matching
 * NOTIFICATION_WEBHOOK_SECRET, otherwise we reject (prevents email spam).
 * If email isn't configured yet, we no-op with 200 so the webhook doesn't retry.
 */
export async function POST(req: Request) {
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!EMAIL_ENABLED) {
    return NextResponse.json({ skipped: 'email_disabled' })
  }

  const payload = await req.json().catch(() => null)
  const record = payload?.record as
    | { user_id?: string; title?: string; body?: string | null; link?: string | null }
    | undefined

  if (payload?.table !== 'notifications' || !record?.user_id || !record.title) {
    return NextResponse.json({ skipped: 'not_applicable' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { data: prof } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', record.user_id)
    .maybeSingle()

  const to = (prof as { email?: string } | null)?.email
  if (!to) return NextResponse.json({ skipped: 'no_email' })

  const html = renderEmail({ title: record.title, body: record.body, link: record.link })
  const result = await sendEmail({ to, subject: record.title, html })

  return NextResponse.json({ sent: result.ok, ...(result.ok ? {} : { error: result.error }) })
}
