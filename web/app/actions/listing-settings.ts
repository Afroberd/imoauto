'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type UpdateSettingsResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Update host-managed settings on a listing: instant booking, verification
 * requirement, payment window, and payout details (IBAN / instructions).
 */
export async function updateListingSettings(input: {
  listingId: string
  instantBooking: boolean
  requireVerification: boolean
  paymentWindowHours: number
  payoutIban?: string
  payoutHolderName?: string
  payoutInstructions?: string
}): Promise<UpdateSettingsResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  // Verify ownership before update
  const { data: listing } = await supabase
    .from('listings')
    .select('owner_id')
    .eq('id', input.listingId)
    .maybeSingle()
  if (!listing) return { ok: false, error: 'Anúncio não encontrado.' }
  if ((listing as { owner_id: string }).owner_id !== user.id) {
    return { ok: false, error: 'Só o dono pode mudar definições.' }
  }

  const hours = Math.max(1, Math.min(168, Math.round(input.paymentWindowHours))) // 1h-7 days

  const { error } = await supabase
    .from('listings')
    .update({
      instant_booking: input.instantBooking,
      require_verification: input.requireVerification,
      payment_window_hours: hours,
      payout_iban: input.payoutIban?.trim() || null,
      payout_holder_name: input.payoutHolderName?.trim() || null,
      payout_instructions: input.payoutInstructions?.trim() || null,
    })
    .eq('id', input.listingId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/listings/${input.listingId}`)
  revalidatePath(`/listings/${input.listingId}/settings`)
  revalidatePath('/my-listings')
  return { ok: true }
}
