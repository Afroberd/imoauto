/**
 * Stripe integration — implementação completa.
 *
 * Ativação:
 *   1. Cria conta em https://dashboard.stripe.com
 *   2. Vai a Developers > API keys → copia "Secret key" (sk_test_... ou sk_live_...)
 *   3. Em Vercel > Settings > Environment Variables adiciona:
 *      - STRIPE_SECRET_KEY=sk_test_...
 *      - NEXT_PUBLIC_STRIPE_ENABLED=true
 *   4. Configura webhook em Stripe Dashboard > Developers > Webhooks:
 *      - Endpoint URL: https://imoauto.vercel.app/api/webhooks/stripe
 *      - Event: checkout.session.completed
 *      - Copia o "Signing secret" (whsec_...)
 *      - Adiciona em Vercel: STRIPE_WEBHOOK_SECRET=whsec_...
 *   5. Redeploy.
 *
 * Conversão de moeda: Stripe não suporta CVE diretamente, usamos EUR.
 * Taxa fixa CVE_PER_EUR = 110 (1 EUR ≈ 110 CVE). Refinar quando necessário.
 */

import Stripe from 'stripe'

export const STRIPE_ENABLED = !!process.env.STRIPE_SECRET_KEY
export const CVE_PER_EUR = 110

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY não configurada. Adiciona em Vercel > Settings > Environment Variables.')
    }
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

export function cveToEurCents(cve: number): number {
  // Stripe wants amount in smallest currency unit (cents)
  return Math.max(100, Math.round((cve / CVE_PER_EUR) * 100))
}

export interface CheckoutInput {
  bookingId: string
  amountCve: number
  description: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}

export async function createCheckoutSession(input: CheckoutInput) {
  const stripe = getStripe()
  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          unit_amount: cveToEurCents(input.amountCve),
          product_data: {
            name: input.description,
            description: `Reserva IMOAUTO #${input.bookingId.slice(0, 8)} · ${input.amountCve.toLocaleString('pt-PT')} CVE`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      booking_id: input.bookingId,
      amount_cve: String(input.amountCve),
    },
    customer_email: input.customerEmail,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  })
}
