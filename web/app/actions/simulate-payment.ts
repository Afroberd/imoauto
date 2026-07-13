'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// NOTE: a "use server" file may only export async functions. The simulation
// flag is read directly from process.env.PAYMENT_SIMULATION where needed.

export type SimulatePayResult = { ok: true } | { ok: false; error: string }

/**
 * "Pay" a confirmed booking in simulation mode. Guards live in the
 * SECURITY DEFINER SQL function record_simulated_payment (migration 016):
 * only the booking's guest, only status 'confirmed'. The payments trigger
 * then promotes the booking to 'paid' and fires the usual notifications.
 */
export async function paySimulated(bookingId: string): Promise<SimulatePayResult> {
  if (process.env.PAYMENT_SIMULATION !== 'true') {
    return { ok: false, error: 'O pagamento online ainda não está ativo.' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const { error } = await supabase.rpc('record_simulated_payment', {
    p_booking_id: bookingId,
  })
  if (error) {
    const msg = error.message.includes('not_payable')
      ? 'Esta reserva não está no estado "confirmada".'
      : error.message.includes('forbidden')
        ? 'Só o titular da reserva pode pagar.'
        : error.message
    return { ok: false, error: msg }
  }

  revalidatePath('/dashboard/reservas')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/payments')
  return { ok: true }
}
