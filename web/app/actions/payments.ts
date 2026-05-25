'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RecordPaymentResult =
  | { ok: true; paymentId: string }
  | { ok: false; error: string }

/**
 * Host records that a payment has been received for a booking. The trigger
 * `handle_payment_recorded` on the payments table will recompute
 * paid_amount_cve and promote the booking to status='paid' once total is met.
 */
export async function recordPayment(input: {
  bookingId: string
  amountCve: number
  method: 'manual_transfer' | 'cash' | 'vinti4' | 'stripe' | 'other'
  reference?: string
  notes?: string
}): Promise<RecordPaymentResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  if (input.amountCve <= 0) return { ok: false, error: 'Valor tem de ser positivo.' }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      booking_id: input.bookingId,
      amount_cve: Math.round(input.amountCve),
      method: input.method,
      reference: input.reference?.trim() || null,
      notes: input.notes?.trim() || null,
      recorded_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/payments')
  revalidatePath('/bookings')
  return { ok: true, paymentId: data.id as string }
}

/** Get all payments for a given booking (audit trail). */
export async function getPaymentsForBooking(bookingId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payments')
    .select('id, amount_cve, method, reference, notes, paid_at, recorded_by')
    .eq('booking_id', bookingId)
    .order('paid_at', { ascending: false })
  return data ?? []
}
