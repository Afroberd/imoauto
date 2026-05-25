/**
 * Payment gateway abstraction.
 *
 * Each gateway exposes the same interface so the booking flow doesn't have to
 * care which one is active. Selection happens via PAYMENT_GATEWAY env var:
 *
 *   PAYMENT_GATEWAY=manual   → host marks "Recebi pagamento" (default, MVP)
 *   PAYMENT_GATEWAY=stripe   → Stripe Checkout + webhook (TODO: implement)
 *   PAYMENT_GATEWAY=vinti4   → Vinti4 / SISP redirect (TODO: implement)
 *
 * The architecture is in place; the Stripe/Vinti4 implementations are stubs
 * that throw — flip the env var once they're wired and tested.
 */

export type CreateCheckoutInput = {
  bookingId: string
  amountCve: number
  description: string
  successUrl: string
  cancelUrl: string
}

export type CreateCheckoutResult =
  | { ok: true; redirectUrl: string; sessionId: string }
  | { ok: false; error: string }

export interface PaymentGateway {
  name: 'manual' | 'stripe' | 'vinti4'
  /** Returns a URL to redirect the guest to (for Stripe/Vinti4) — null for manual. */
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>
}

class ManualGateway implements PaymentGateway {
  name = 'manual' as const
  async createCheckout(): Promise<CreateCheckoutResult> {
    // Manual mode: the guest sees IBAN + instructions on /bookings.
    // No redirect; the booking sits at status='confirmed' until host marks payment.
    return { ok: false, error: 'manual_mode' }
  }
}

class StripeGateway implements PaymentGateway {
  name = 'stripe' as const
  async createCheckout(_: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    // TODO: when activating Stripe:
    //   import Stripe from 'stripe'
    //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    //   const session = await stripe.checkout.sessions.create({...})
    //   return { ok: true, redirectUrl: session.url!, sessionId: session.id }
    return { ok: false, error: 'stripe_not_configured' }
  }
}

class Vinti4Gateway implements PaymentGateway {
  name = 'vinti4' as const
  async createCheckout(_: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    // TODO: implement Vinti4 / SISP integration when contract is in place
    return { ok: false, error: 'vinti4_not_configured' }
  }
}

export function getActiveGateway(): PaymentGateway {
  const choice = (process.env.PAYMENT_GATEWAY ?? 'manual').toLowerCase()
  switch (choice) {
    case 'stripe': return new StripeGateway()
    case 'vinti4': return new Vinti4Gateway()
    default:        return new ManualGateway()
  }
}
