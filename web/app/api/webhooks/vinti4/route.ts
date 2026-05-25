import { NextResponse } from 'next/server'

/**
 * Vinti4 / SISP webhook (callback URL) — stub for now.
 *
 * When activating:
 *   1. Validate SISP signature / merchant secret
 *   2. On payment success → insert into payments with method='vinti4'
 *      The SQL trigger handle_payment_recorded() promotes booking to 'paid'.
 */
export async function POST(req: Request) {
  if (process.env.PAYMENT_GATEWAY !== 'vinti4') {
    return NextResponse.json({ skipped: 'vinti4_not_active' })
  }
  const _body = await req.text()
  // TODO: validate + dispatch
  return NextResponse.json({ received: true })
}
