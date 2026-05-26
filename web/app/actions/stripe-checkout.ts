'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_ENABLED, createCheckoutSession } from '@/lib/payments/stripe'

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Cria uma sessão Stripe Checkout para o hóspede pagar a sua reserva.
 * O webhook /api/webhooks/stripe (em checkout.session.completed) cria o
 * payment row, e o trigger SQL handle_payment_recorded promove a booking
 * para 'paid' automaticamente.
 */
export async function createStripeCheckout(bookingId: string): Promise<CheckoutResult> {
  if (!STRIPE_ENABLED) {
    return { ok: false, error: 'O pagamento por cartão ainda não está ativo. Usa transferência bancária ou contacta o anfitrião.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, guest_id, status, total_cve, paid_amount_cve, listing:listings(title)')
    .eq('id', bookingId)
    .maybeSingle()

  if (!booking) return { ok: false, error: 'Reserva não encontrada.' }
  const bk = booking as unknown as {
    id: string; guest_id: string; status: string
    total_cve: number; paid_amount_cve: number
    listing: { title: string } | null
  }
  if (bk.guest_id !== user.id) return { ok: false, error: 'Esta reserva não é tua.' }
  if (bk.status !== 'confirmed') return { ok: false, error: 'Esta reserva não está à espera de pagamento.' }

  const remaining = bk.total_cve - bk.paid_amount_cve
  if (remaining <= 0) return { ok: false, error: 'Já está paga.' }

  const h = await headers()
  const protocol = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('host') ?? 'imoauto.vercel.app'
  const origin = `${protocol}://${host}`

  try {
    const session = await createCheckoutSession({
      bookingId: bk.id,
      amountCve: remaining,
      description: bk.listing?.title || 'Reserva IMOAUTO',
      successUrl: `${origin}/dashboard/reservas?paid=${bk.id}`,
      cancelUrl: `${origin}/dashboard/reservas?cancelled=${bk.id}`,
      customerEmail: user.email,
    })

    if (!session.url) return { ok: false, error: 'Stripe não devolveu URL de checkout.' }
    return { ok: true, url: session.url }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `Erro Stripe: ${msg}` }
  }
}
