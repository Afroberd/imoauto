'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type VerificationResult =
  | { ok: true }
  | { ok: false; error: 'unauthenticated' | string }

/**
 * Submit or update the current user's verification record. Submissions enter the
 * review queue as `pending` (verified_at stays null) until an admin approves them
 * in /admin/verificacoes. Any edit re-opens review.
 */
export async function submitVerification(input: {
  idType: 'bi' | 'passport'
  idNumber: string
  idPhotoUrl?: string | null
  driverLicenseNumber?: string
  driverLicensePhotoUrl?: string | null
  phone?: string
}): Promise<VerificationResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  if (!input.idType || !input.idNumber?.trim()) {
    return { ok: false, error: 'Tipo e número de documento são obrigatórios.' }
  }

  const { error } = await supabase
    .from('guest_verifications')
    .upsert(
      {
        user_id: user.id,
        id_type: input.idType,
        id_number: input.idNumber.trim(),
        id_photo_url: input.idPhotoUrl ?? null,
        driver_license_number: input.driverLicenseNumber?.trim() || null,
        driver_license_photo_url: input.driverLicensePhotoUrl ?? null,
        phone: input.phone?.trim() || null,
        status: 'pending',
        verified_at: null,
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

  if (error) return { ok: false, error: error.message }

  revalidatePath('/verificacao')
  revalidatePath('/dashboard')
  return { ok: true }
}

/** Get current user's verification record. */
export async function getMyVerification() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('guest_verifications')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return data
}

/** Check if the current user is verified — used as a guard before booking. */
export async function isCurrentUserVerified(): Promise<boolean> {
  const v = await getMyVerification()
  return !!(v && (v as { verified_at: string | null }).verified_at)
}
