'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SubmitReviewResult =
  | { ok: true; reviewId: string }
  | { ok: false; error: 'unauthenticated' | 'ineligible' | string }

/**
 * Submit (or update) a review for a listing. RLS enforces eligibility:
 *   - reviewer != owner
 *   - reviewer either had a confirmed past booking, OR contacted seller via a conversation
 */
export async function submitReview(input: {
  listingId: string
  rating: number
  body: string
}): Promise<SubmitReviewResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'A classificação deve ser entre 1 e 5.' }
  }
  const body = input.body.trim().slice(0, 2000)

  // Upsert: replace existing review by this user for this listing.
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      {
        listing_id: input.listingId,
        reviewer_id: user.id,
        rating: input.rating,
        body: body || null,
      },
      { onConflict: 'listing_id,reviewer_id' },
    )
    .select('id')
    .single()

  if (error) {
    // RLS rejection usually surfaces as a 42501 / "new row violates row-level security".
    if (/row-level security/i.test(error.message) || error.code === '42501') {
      return { ok: false, error: 'ineligible' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath(`/listings/${input.listingId}`)
  return { ok: true, reviewId: data.id as string }
}

export async function deleteReview(reviewId: string, listingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' as const }

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('reviewer_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/listings/${listingId}`)
  return { ok: true as const }
}

/** Check whether the current user is eligible to review this listing. */
export async function checkReviewEligibility(listingId: string): Promise<{
  eligible: boolean
  reason: 'unauthenticated' | 'owner' | 'no_interaction' | 'ok'
  existingReview?: { id: string; rating: number; body: string | null }
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { eligible: false, reason: 'unauthenticated' }

  // Owner?
  const { data: listing } = await supabase
    .from('listings')
    .select('owner_id')
    .eq('id', listingId)
    .maybeSingle()
  if (!listing) return { eligible: false, reason: 'no_interaction' }
  if (listing.owner_id === user.id) return { eligible: false, reason: 'owner' }

  // Existing review by this user?
  const { data: existing } = await supabase
    .from('reviews')
    .select('id, rating, body')
    .eq('listing_id', listingId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  // Confirmed past booking?
  const today = new Date().toISOString().slice(0, 10)
  const { data: bk } = await supabase
    .from('bookings')
    .select('id')
    .eq('listing_id', listingId)
    .eq('guest_id', user.id)
    .eq('status', 'confirmed')
    .lte('check_out', today)
    .limit(1)
    .maybeSingle()

  // Conversation as buyer?
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .limit(1)
    .maybeSingle()

  const eligible = !!bk || !!conv || !!existing
  return {
    eligible,
    reason: eligible ? 'ok' : 'no_interaction',
    existingReview: existing
      ? { id: existing.id as string, rating: existing.rating as number, body: existing.body as string | null }
      : undefined,
  }
}
