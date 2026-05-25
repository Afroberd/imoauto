'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ToggleFavoriteResult =
  | { ok: true; favorited: boolean }
  | { ok: false; error: 'unauthenticated' | string }

/**
 * Toggle a listing in the current user's favorites.
 * Returns whether the listing is now favorited (true) or removed (false).
 * Returns { ok: false, error: 'unauthenticated' } when no session exists —
 * the client uses this to redirect to /login.
 */
export async function toggleFavorite(listingId: string): Promise<ToggleFavoriteResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Check if it is already saved.
  const { data: existing } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/my-favorites')
    return { ok: true, favorited: false }
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, listing_id: listingId })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/my-favorites')
    return { ok: true, favorited: true }
  }
}

/**
 * Return the listing IDs favorited by the given user.
 * Used by server components to populate initialFavorited props.
 */
export async function getFavoriteIds(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)
  return (data ?? []).map((r) => r.listing_id as string)
}
