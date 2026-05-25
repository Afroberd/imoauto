import { NextResponse } from 'next/server'

/**
 * Stripe webhook endpoint — stub for now.
 *
 * When Stripe is activated:
 *   1. Verify signature with STRIPE_WEBHOOK_SECRET
 *   2. On checkout.session.completed → insert into payments table with
 *      method='stripe' and metadata.booking_id; the SQL trigger
 *      handle_payment_recorded() will then promote booking to 'paid'.
 *   3. On charge.refunded → mark payment_status='refunded'
 */
export async function POST(req: Request) {
  if (process.env.PAYMENT_GATEWAY !== 'stripe') {
    return NextResponse.json({ skipped: 'stripe_not_active' })
  }
  const _body = await req.text()
  // TODO: import Stripe, verify signature, dispatch event.type → handlers
  return NextResponse.json({ received: true })
}
