'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'blocked'

export type CreateBookingResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: 'unauthenticated' | 'owner' | 'overlap' | 'invalid_dates' | string }

export type UpdateBookingResult =
  | { ok: true }
  | { ok: false; error: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00Z').getTime()
  const b = new Date(checkOut + 'T00:00:00Z').getTime()
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Create a new pending booking request (guest -> owner).
 * Conflict-prevention is enforced by an exclusion constraint in Postgres,
 * but we also pre-check so the user gets a friendlier error.
 */
export async function createBooking(input: {
  listingId: string
  checkIn: string  // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  guests: number
  message?: string
}): Promise<CreateBookingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // Basic date validation
  if (!input.checkIn || !input.checkOut) return { ok: false, error: 'invalid_dates' }
  if (input.checkOut <= input.checkIn) return { ok: false, error: 'invalid_dates' }
  const nights = nightsBetween(input.checkIn, input.checkOut)
  if (nights < 1) return { ok: false, error: 'invalid_dates' }

  // Fetch listing for owner check + price calc.
  const { data: listing } = await supabase
    .from('listings')
    .select('id, owner_id, price_cve, attributes, purpose')
    .eq('id', input.listingId)
    .maybeSingle()

  if (!listing) return { ok: false, error: 'Anúncio não encontrado.' }
  if (listing.owner_id === user.id) return { ok: false, error: 'owner' }
  if (listing.purpose !== 'rent_daily') {
    return { ok: false, error: 'Este anúncio não aceita reservas ao dia.' }
  }

  // Pre-check overlap (best-effort; the DB exclusion constraint is the source of truth).
  const { data: clashes } = await supabase
    .from('bookings')
    .select('id')
    .eq('listing_id', input.listingId)
    .in('status', ['pending', 'confirmed', 'blocked'])
    .lt('check_in', input.checkOut)
    .gt('check_out', input.checkIn)

  if (clashes && clashes.length > 0) return { ok: false, error: 'overlap' }

  // Compute price: nights × nightly + cleaning fee.
  const attr = (listing.attributes ?? {}) as { cleaning_fee_cve?: number }
  const total = nights * (listing.price_cve as number) + (attr.cleaning_fee_cve ?? 0)

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      listing_id: input.listingId,
      guest_id: user.id,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests: Math.max(1, input.guests),
      total_cve: total,
      message: input.message?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23P01' || /exclude/i.test(error.message)) {
      return { ok: false, error: 'overlap' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/bookings')
  revalidatePath(`/listings/${input.listingId}`)
  return { ok: true, bookingId: data.id as string }
}

/**
 * Owner approves / declines a pending booking. RLS allows owner via listing FK.
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'declined' | 'cancelled',
): Promise<UpdateBookingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/bookings')
  return { ok: true }
}

/**
 * Owner self-blocks a date range (eg. for personal use, maintenance, etc.).
 * Inserted as a booking row with status='blocked' and guest_id=owner.
 */
export async function blockDates(input: {
  listingId: string
  checkIn: string
  checkOut: string
}): Promise<CreateBookingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  if (input.checkOut <= input.checkIn) return { ok: false, error: 'invalid_dates' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, owner_id')
    .eq('id', input.listingId)
    .maybeSingle()
  if (!listing) return { ok: false, error: 'Anúncio não encontrado.' }
  if (listing.owner_id !== user.id) return { ok: false, error: 'Só o dono pode bloquear datas.' }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      listing_id: input.listingId,
      guest_id: user.id,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests: 1,
      total_cve: 0,
      status: 'blocked',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23P01' || /exclude/i.test(error.message)) {
      return { ok: false, error: 'overlap' }
    }
    return { ok: false, error: error.message }
  }

  revalidatePath('/bookings')
  revalidatePath(`/listings/${input.listingId}`)
  return { ok: true, bookingId: data.id as string }
}

/**
 * Fetch the set of unavailable date ranges (for the booking calendar UI).
 * Returns ranges of pending/confirmed/blocked bookings.
 */
export async function getUnavailableRanges(listingId: string): Promise<
  { check_in: string; check_out: string; status: BookingStatus }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select('check_in, check_out, status')
    .eq('listing_id', listingId)
    .in('status', ['pending', 'confirmed', 'blocked'])
    .order('check_in', { ascending: true })

  return (data ?? []) as { check_in: string; check_out: string; status: BookingStatus }[]
}
