import { NextResponse } from 'next/server'
import { getStripe, STRIPE_ENABLED } from '@/lib/payments/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

/**
 * Stripe webhook handler.
 *
 * Quando o hóspede paga com sucesso no Stripe Checkout, o Stripe envia
 * checkout.session.completed para este endpoint. Inserimos um payment row
 * no Supabase; o trigger SQL handle_payment_recorded() detecta que o total
 * pago atingiu/excedeu o valor da reserva e promove o status para 'paid'.
 *
 * Use service role key porque o webhook é server-to-server sem JWT do user.
 */
export async function POST(req: Request) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ skipped: 'stripe_not_active' })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new NextResponse('No signature', { status: 400 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return new NextResponse('STRIPE_WEBHOOK_SECRET missing', { status: 500 })
  }

  const stripe = getStripe()
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new NextResponse(`Signature verification failed: ${msg}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const bookingId = session.metadata?.booking_id
    const amountCveStr = session.metadata?.amount_cve
    if (!bookingId || !amountCveStr) {
      return NextResponse.json({ ok: false, error: 'missing metadata' }, { status: 400 })
    }
    const amountCve = parseInt(amountCveStr, 10)

    // Use service role to bypass RLS — webhook is anonymous on Stripe side.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    if (!serviceKey) {
      return NextResponse.json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error } = await supabase.from('payments').insert({
      booking_id: bookingId,
      amount_cve: amountCve,
      method: 'stripe',
      reference: session.id,
      notes: `Stripe Checkout · ${session.payment_intent ?? '(no PI)'}`,
      // recorded_by: null — sistema, não user
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
