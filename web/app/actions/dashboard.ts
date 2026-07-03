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
  commission_cve: number
  host_payout_cve: number
  message: string | null
  checked_in_at: string | null
  checked_out_at: string | null
  created_at: string
  listing_title: string
  listing_cover: string | null
  listing_kind: 'property' | 'vehicle'
  listing_island: string
  payout_iban: string | null
  payout_holder_name: string | null
  payout_instructions: string | null
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

  // Two-step fetch: bookings + listings inline, profiles separately. The
  // bookings.guest_id FK points to auth.users (not profiles), so PostgREST
  // can't resolve a hint-style join — we map profiles in JS instead.
  const { data: rows } = await supabase
    .from('bookings')
    .select(`
      id, listing_id, guest_id, check_in, check_out, guests, status, payment_status,
      total_cve, paid_amount_cve, commission_cve, host_payout_cve, message, checked_in_at, checked_out_at, created_at,
      listing:listings(title, cover_image_url, kind, location_island)
    `)
    .in('listing_id', listingIds)
    .neq('status', 'blocked')
    .order('created_at', { ascending: false })

  const rowsRaw = (rows ?? []) as unknown as Array<{
    id: string; listing_id: string; guest_id: string
    check_in: string; check_out: string; guests: number
    status: string; payment_status: string; total_cve: number; paid_amount_cve: number
  commission_cve: number | null; host_payout_cve: number | null
    message: string | null; checked_in_at: string | null; checked_out_at: string | null
    created_at: string
    listing: { title: string; cover_image_url: string | null; kind: 'property' | 'vehicle'; location_island: string } | null
  }>

  const guestIds = Array.from(new Set(rowsRaw.map((r) => r.guest_id)))
  const profileMap = await fetchProfilesMap(supabase, guestIds)
  const bookings = rowsRaw.map((b) => normalise(b, profileMap))

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
  return hostBookings(['pending'], { byCreatedDesc: true })
}

/** Active + upcoming stays (paid + in_progress + confirmed) on host's listings. */
export async function getActiveAndUpcomingStays(): Promise<DashboardBooking[]> {
  return hostBookings(['paid', 'in_progress', 'confirmed'], { byCheckInAsc: true })
}

/** All bookings (any status) for the payments page. */
export async function getBookingsForPayments(): Promise<DashboardBooking[]> {
  return hostBookings(['confirmed', 'paid', 'in_progress', 'completed'], { byCreatedDesc: true })
}

/**
 * Guest-side: all bookings I'VE made (regardless of host's listing).
 * Used in /dashboard/reservas (replaces the old /bookings page).
 */
export async function getMyGuestBookings(): Promise<DashboardBooking[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: rows } = await supabase
    .from('bookings')
    .select(`
      id, listing_id, guest_id, check_in, check_out, guests, status, payment_status,
      total_cve, paid_amount_cve, commission_cve, host_payout_cve, message, checked_in_at, checked_out_at, created_at,
      listing:listings(title, cover_image_url, kind, location_island, payout_iban, payout_holder_name, payout_instructions)
    `)
    .eq('guest_id', user.id)
    .neq('status', 'blocked')
    .order('check_in', { ascending: false })

  const rowsRaw = (rows ?? []) as unknown as RawBookingRow[]
  // Host profile (owner) — for showing who the guest is paying
  const ownerIds: string[] = [] // not currently needed; payout info is inline on listing
  const profileMap = await fetchProfilesMap(supabase, ownerIds)
  return rowsRaw.map((b) => normalise(b, profileMap))
}

// ── Internal helpers ─────────────────────────────────────────────────────────

type RawBookingRow = {
  id: string; listing_id: string; guest_id: string
  check_in: string; check_out: string; guests: number
  status: string; payment_status: string; total_cve: number; paid_amount_cve: number
  commission_cve: number | null; host_payout_cve: number | null
  message: string | null; checked_in_at: string | null; checked_out_at: string | null
  created_at: string
  listing: {
    title: string; cover_image_url: string | null
    kind: 'property' | 'vehicle'; location_island: string
    payout_iban?: string | null; payout_holder_name?: string | null; payout_instructions?: string | null
  } | null
}

async function hostBookings(
  statuses: string[],
  sort: { byCheckInAsc?: boolean; byCreatedDesc?: boolean },
): Promise<DashboardBooking[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: myListings } = await supabase.from('listings').select('id').eq('owner_id', user.id)
  const ids = (myListings ?? []).map((l) => (l as { id: string }).id)
  if (ids.length === 0) return []

  let q = supabase
    .from('bookings')
    .select(`
      id, listing_id, guest_id, check_in, check_out, guests, status, payment_status,
      total_cve, paid_amount_cve, commission_cve, host_payout_cve, message, checked_in_at, checked_out_at, created_at,
      listing:listings(title, cover_image_url, kind, location_island, payout_iban, payout_holder_name, payout_instructions)
    `)
    .in('listing_id', ids)
    .in('status', statuses)
  if (sort.byCheckInAsc) q = q.order('check_in', { ascending: true })
  if (sort.byCreatedDesc) q = q.order('created_at', { ascending: false })

  const { data: rows } = await q
  const rowsRaw = (rows ?? []) as unknown as RawBookingRow[]
  const guestIds = Array.from(new Set(rowsRaw.map((r) => r.guest_id)))
  const profileMap = await fetchProfilesMap(supabase, guestIds)
  return rowsRaw.map((b) => normalise(b, profileMap))
}

async function fetchProfilesMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[],
): Promise<Map<string, { email: string; display_name: string | null }>> {
  if (ids.length === 0) return new Map()
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .in('id', ids)
  return new Map(
    ((profs ?? []) as Array<{ id: string; email: string; display_name: string | null }>)
      .map((p) => [p.id, { email: p.email, display_name: p.display_name }]),
  )
}

function normalise(
  b: RawBookingRow,
  profileMap: Map<string, { email: string; display_name: string | null }>,
): DashboardBooking {
  const listing = b.listing
  const guest = profileMap.get(b.guest_id)
  return {
    id: b.id,
    listing_id: b.listing_id,
    guest_id: b.guest_id,
    guest_name: guest?.display_name || (guest?.email ? guest.email.split('@')[0] : 'Hóspede'),
    guest_email: guest?.email ?? '',
    guest_phone: null,
    check_in: b.check_in,
    check_out: b.check_out,
    guests: b.guests,
    status: b.status,
    payment_status: b.payment_status,
    total_cve: b.total_cve,
    paid_amount_cve: b.paid_amount_cve ?? 0,
    commission_cve: b.commission_cve ?? 0,
    host_payout_cve: b.host_payout_cve ?? 0,
    message: b.message,
    checked_in_at: b.checked_in_at,
    checked_out_at: b.checked_out_at,
    created_at: b.created_at,
    listing_title: listing?.title ?? 'Anúncio removido',
    listing_cover: listing?.cover_image_url ?? null,
    listing_kind: listing?.kind ?? 'property',
    listing_island: listing?.location_island ?? '',
    payout_iban: listing?.payout_iban ?? null,
    payout_holder_name: listing?.payout_holder_name ?? null,
    payout_instructions: listing?.payout_instructions ?? null,
  }
}
