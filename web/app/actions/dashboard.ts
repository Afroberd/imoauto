'use server'

import { createClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TodayStats = {
  pendingRequests: number
  checkinsToday: number
  checkoutsToday: number
  activeStays: number
  unpaidConfirmed: number
  totalListings: number
  occupiedListings: number
  monthRevenueCve: number
}

export type DashboardBooking = {
  id: string
  listing_id: string
  guest_id: string
  guest_name: string
  guest_email: string
  guest_phone: string | null
  check_in: string
  check_out: string
  guests: number
  status: string
  payment_status: string
  total_cve: number
  paid_amount_cve: number
  message: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  created_at: string
  listing_title: string
  listing_cover: string | null
  listing_kind: 'property' | 'vehicle'
  listing_island: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstOfMonthISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Gather host-side dashboard metrics for the current authenticated user.
 * Returns nulls/zeros if user is not a host (no listings).
 */
export async function getDashboardData(): Promise<{
  stats: TodayStats
  recentRequests: DashboardBooking[]
  todayCheckins: DashboardBooking[]
  todayCheckouts: DashboardBooking[]
  activeNow: DashboardBooking[]
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const empty: TodayStats = {
    pendingRequests: 0, checkinsToday: 0, checkoutsToday: 0, activeStays: 0,
    unpaidConfirmed: 0, totalListings: 0, occupiedListings: 0, monthRevenueCve: 0,
  }
  if (!user) {
    return { stats: empty, recentRequests: [], todayCheckins: [], todayCheckouts: [], activeNow: [] }
  }

  // Find user's listings
  const { data: myListings } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_id', user.id)

  const listingIds = (myListings ?? []).map((l) => (l as { id: string }).id)

  if (listingIds.length === 0) {
    return { stats: empty, recentRequests: [], todayCheckins: [], todayCheckouts: [], activeNow: [] }
  }

  // Fetch all bookings on these listings with rich data (joined)
  const { data: rows } = await supabase
    .from('bookings')
    .select(`
      id, listing_id, guest_id, check_in, check_out, guests, status, payment_status,
      total_cve, paid_amount_cve, message, checked_in_at, checked_out_at, created_at,
      listing:listings(title, cover_image_url, kind, location_island),
      guest:profiles!guest_id(email, display_name)
    `)
    .in('listing_id', listingIds)
    .neq('status', 'blocked')
    .order('created_at', { ascending: false })

  const bookings = ((rows ?? []) as unknown as Array<{
    id: string; listing_id: string; guest_id: string
    check_in: string; check_out: string; guests: number
    status: string; payment_status: string; total_cve: number; paid_amount_cve: number
    message: string | null; checked_in_at: string | null; checked_out_at: string | null
    created_at: string
    listing: { title: string; cover_image_url: string | null; kind: 'property' | 'vehicle'; location_island: string } | null
    guest: { email: string; display_name: string | null } | null
  }>).map((b) => normalise(b))

  const today = todayISO()
  const monthStart = firstOfMonthISO()

  const pending = bookings.filter((b) => b.status === 'pending')
  const checkinsToday = bookings.filter((b) => b.status === 'paid' && b.check_in === today)
  const checkoutsToday = bookings.filter((b) => b.status === 'in_progress' && b.check_out === today)
  const active = bookings.filter((b) => b.status === 'in_progress')
  const unpaidConfirmed = bookings.filter((b) => b.status === 'confirmed' && b.payment_status !== 'paid')

  // Month revenue: sum of total_cve for bookings with payment_status='paid' and check_in >= month start
  const monthRevenue = bookings
    .filter((b) => b.payment_status === 'paid' && b.check_in >= monthStart)
    .reduce((sum, b) => sum + b.paid_amount_cve, 0)

  const stats: TodayStats = {
    pendingRequests: pending.length,
    checkinsToday: checkinsToday.length,
    checkoutsToday: checkoutsToday.length,
    activeStays: active.length,
    unpaidConfirmed: unpaidConfirmed.length,
    totalListings: listingIds.length,
    occupiedListings: new Set(active.map((b) => b.listing_id)).size,
    monthRevenueCve: monthRevenue,
  }

  return {
    stats,
    recentRequests: pending.slice(0, 5),
    todayCheckins: checkinsToday,
    todayCheckouts: checkoutsToday,
    activeNow: active,
  }
}

/** All pending booking requests on the host's listings. */
export async function getPendingRequests(): Promise<DashboardBooking[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: myListings } = await supabase.from('listings').select('id').eq('owner_id', user.id)
  const ids = (myListings ?? []).map((l) => (l as { id: string }).id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('bookings')
    .select(`
      id, listing_id, guest_id, check_in, check_out, guests, status, payment_status,
      total_cve, paid_amount_cve, message, checked_in_at, checked_out_at, created_at,
      listing:listings(title, cover_image_url, kind, location_island),
      guest:profiles!guest_id(email, display_name)
    `)
    .in('listing_id', ids)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return ((data ?? []) as unknown as any[]).map(normalise)
}

/** Active + upcoming stays (paid + in_progress) on host's listings. */
export async function getActiveAndUpcomingStays(): Promise<DashboardBooking[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: myListings } = await supabase.from('listings').select('id').eq('owner_id', user.id)
  const ids = (myListings ?? []).map((l) => (l as { id: string }).id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('bookings')
    .select(`
      id, listing_id, guest_id, check_in, check_out, guests, status, payment_status,
      total_cve, paid_amount_cve, message, checked_in_at, checked_out_at, created_at,
      listing:listings(title, cover_image_url, kind, location_island),
      guest:profiles!guest_id(email, display_name)
    `)
    .in('listing_id', ids)
    .in('status', ['paid', 'in_progress', 'confirmed'])
    .order('check_in', { ascending: true })

  return ((data ?? []) as unknown as any[]).map(normalise)
}

/** All bookings (any status) for the payments page, with payment rows summed. */
export async function getBookingsForPayments(): Promise<DashboardBooking[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: myListings } = await supabase.from('listings').select('id').eq('owner_id', user.id)
  const ids = (myListings ?? []).map((l) => (l as { id: string }).id)
  if (ids.length === 0) return []

  const { data } = await supabase
    .from('bookings')
    .select(`
      id, listing_id, guest_id, check_in, check_out, guests, status, payment_status,
      total_cve, paid_amount_cve, message, checked_in_at, checked_out_at, created_at,
      listing:listings(title, cover_image_url, kind, location_island),
      guest:profiles!guest_id(email, display_name)
    `)
    .in('listing_id', ids)
    .in('status', ['confirmed', 'paid', 'in_progress', 'completed'])
    .order('created_at', { ascending: false })

  return ((data ?? []) as unknown as any[]).map(normalise)
}

function normalise(b: any): DashboardBooking {
  const listing = b.listing
  const guest = b.guest
  return {
    id: b.id,
    listing_id: b.listing_id,
    guest_id: b.guest_id,
    guest_name: guest?.display_name || (guest?.email ? guest.email.split('@')[0] : 'Hóspede'),
    guest_email: guest?.email ?? '',
    guest_phone: null, // populated via guest_verifications when implemented
    check_in: b.check_in,
    check_out: b.check_out,
    guests: b.guests,
    status: b.status,
    payment_status: b.payment_status,
    total_cve: b.total_cve,
    paid_amount_cve: b.paid_amount_cve ?? 0,
    message: b.message,
    checked_in_at: b.checked_in_at,
    checked_out_at: b.checked_out_at,
    created_at: b.created_at,
    listing_title: listing?.title ?? 'Anúncio removido',
    listing_cover: listing?.cover_image_url ?? null,
    listing_kind: listing?.kind ?? 'property',
    listing_island: listing?.location_island ?? '',
  }
}
