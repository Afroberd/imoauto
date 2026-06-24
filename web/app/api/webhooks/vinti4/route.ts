import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { VINTI4_ENABLED, verifyVinti4Response } from '@/lib/payments/vinti4'

/**
 * Callback da SISP/Vinti4. A SISP faz POST (form-urlencoded) para aqui com o
 * resultado da transação. Validamos a fingerprint de resposta e, em sucesso,
 * inserimos o payment row — o trigger SQL handle_payment_recorded() promove a
 * reserva para 'paid' automaticamente.
 *
 * Usa a service role key (server-to-server, sem JWT do utilizador) para
 * contornar o RLS, tal como o webhook do Stripe.
 *
 * Enquanto VINTI4_ENABLED for false (sem credenciais), responde sem fazer nada.
 */
export async function POST(req: Request) {
  if (!VINTI4_ENABLED) {
    return NextResponse.json({ skipped: 'vinti4_not_active' })
  }

  // SISP envia application/x-www-form-urlencoded
  const form = await req.formData()
  const params: Record<string, string> = {}
  for (const [k, v] of form.entries()) params[k] = String(v)

  // 1) Validar a resposta (fingerprint SISP)
  if (!verifyVinti4Response(params)) {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  // 2) Confirmar que foi sucesso. Os nomes exatos vêm do manual SISP; cobrimos
  //    os mais comuns sem assumir só um.
  const success =
    params['messageType'] === '8' || // resposta de pagamento autorizado (comum)
    params['resultCode'] === '0' ||
    params['Success'] === 'true'
  if (!success) {
    return NextResponse.json({ received: true, paid: false })
  }

  const bookingRef = params['merchantRef'] || params['merchantRespMerchantRef']
  const amountStr = params['amount'] || params['merchantRespPurchaseAmount']
  if (!bookingRef || !amountStr) {
    return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  if (!serviceKey) {
    return NextResponse.json({ ok: false, error: 'service role missing' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // O merchantRef é o id da reserva abreviado; resolvemos a reserva por prefixo.
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, total_cve, paid_amount_cve')
    .ilike('id', `${bookingRef.toLowerCase()}%`)
    .limit(1)

  const booking = bookings?.[0] as { id: string; total_cve: number; paid_amount_cve: number } | undefined
  if (!booking) {
    return NextResponse.json({ ok: false, error: 'booking not found' }, { status: 404 })
  }

  const { error } = await supabase.from('payments').insert({
    booking_id: booking.id,
    amount_cve: Math.round(Number(amountStr)),
    method: 'vinti4',
    reference: params['merchantRef'] ?? null,
    notes: 'Vinti4/SISP online',
  })
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
