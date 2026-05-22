'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ListingAttributes, ListingInput } from '@/lib/listings/types'
import {
  CV_ISLANDS,
  LISTING_KINDS,
  LISTING_PURPOSES,
  municipalitiesOf,
  type ListingKind,
  type ListingPurpose,
} from '@/lib/listings/constants'

export type SaveListingResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string }

/** Anti-spam: maximum listings a single account may hold at once. */
const MAX_LISTINGS_PER_USER = 25

function isKind(v: string): v is ListingKind {
  return (LISTING_KINDS as readonly string[]).includes(v)
}
function isPurpose(v: string): v is ListingPurpose {
  return (LISTING_PURPOSES as readonly string[]).includes(v)
}

function num(v: unknown): number | undefined {
  if (v === '' || v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
function bool(v: unknown): boolean | undefined {
  if (v === true || v === false) return v
  return undefined
}
function strArr(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const arr = v.filter((x): x is string => typeof x === 'string' && x.length > 0)
  return arr.length > 0 ? arr : undefined
}
function str(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length > 0 ? t : undefined
}

/**
 * Keep only the attribute keys that make sense for the chosen kind+purpose,
 * coercing each to its expected type. Anything irrelevant is dropped so we
 * never persist, say, `min_nights` on a vehicle sale.
 */
function sanitizeAttributes(
  kind: ListingKind,
  purpose: ListingPurpose,
  raw: Record<string, unknown>,
): ListingAttributes {
  const a: ListingAttributes = {}
  const isProp = kind === 'property'
  const isVeh = kind === 'vehicle'
  const daily = purpose === 'rent_daily'
  const monthly = purpose === 'rent_monthly'
  const rent = daily || monthly
  const sale = purpose === 'sale'

  if (isProp) {
    a.property_type = str(raw.property_type)
    a.area_sqm = num(raw.area_sqm)
    a.bedrooms = num(raw.bedrooms)
    a.bathrooms = num(raw.bathrooms)
    a.year_built = num(raw.year_built)
    a.has_garage = bool(raw.has_garage)
    if (sale) {
      a.property_condition = str(raw.property_condition)
      a.negotiable = bool(raw.negotiable)
    }
    if (rent) {
      a.furnished = str(raw.furnished)
      a.rules = strArr(raw.rules)
      a.deposit_cve = num(raw.deposit_cve)
    }
    if (monthly) {
      a.utilities_included = strArr(raw.utilities_included)
      a.min_contract_months = num(raw.min_contract_months)
      a.available_from = str(raw.available_from)
    }
    if (daily) {
      a.beds = num(raw.beds)
      a.guests = num(raw.guests)
      a.amenities = strArr(raw.amenities)
      a.cleaning_fee_cve = num(raw.cleaning_fee_cve)
      a.min_nights = num(raw.min_nights)
      a.max_nights = num(raw.max_nights)
      a.checkin_time = str(raw.checkin_time)
      a.checkout_time = str(raw.checkout_time)
      a.cancellation = str(raw.cancellation)
      a.price_weekly_cve = num(raw.price_weekly_cve)
    }
  }

  if (isVeh) {
    a.vehicle_type = str(raw.vehicle_type)
    a.brand = str(raw.brand)
    a.model = str(raw.model)
    a.year = num(raw.year)
    a.km = num(raw.km)
    a.fuel = str(raw.fuel)
    a.transmission = str(raw.transmission)
    a.seats = num(raw.seats)
    a.doors = num(raw.doors)
    a.color = str(raw.color)
    if (sale) {
      a.vehicle_condition = str(raw.vehicle_condition)
      a.docs_ok = bool(raw.docs_ok)
      a.negotiable = bool(raw.negotiable)
    }
    if (rent) {
      a.vehicle_extras = strArr(raw.vehicle_extras)
      a.deposit_cve = num(raw.deposit_cve)
      a.min_driver_age = num(raw.min_driver_age)
      a.daily_km_included = num(raw.daily_km_included)
      a.insurance_included = bool(raw.insurance_included)
      a.delivery_options = strArr(raw.delivery_options)
    }
    if (daily) {
      a.price_weekly_cve = num(raw.price_weekly_cve)
    }
  }

  // Drop undefined keys so the jsonb stays tidy.
  return Object.fromEntries(
    Object.entries(a).filter(([, v]) => v !== undefined),
  ) as ListingAttributes
}

/** Shared validation for create + update. Returns a clean row or an error. */
function validate(input: ListingInput):
  | { ok: true; row: Record<string, unknown> }
  | { ok: false; error: string } {
  if (!isKind(input.kind)) return { ok: false, error: 'Tipo inválido.' }
  if (!isPurpose(input.purpose)) return { ok: false, error: 'Finalidade inválida.' }

  const title = (input.title ?? '').trim()
  if (title.length < 3) return { ok: false, error: 'Título demasiado curto (mín. 3 caracteres).' }
  if (title.length > 140) return { ok: false, error: 'Título demasiado longo (máx. 140).' }

  const price = Number(input.price_cve)
  if (!Number.isFinite(price) || price < 0)
    return { ok: false, error: 'Preço inválido.' }

  const island = (input.location_island ?? '').trim()
  if (!(CV_ISLANDS as readonly string[]).includes(island))
    return { ok: false, error: 'Ilha inválida.' }

  const municipality = (input.location_municipality ?? '').trim()
  if (!municipality) return { ok: false, error: 'Escolhe o concelho.' }
  if (!(municipalitiesOf(island) as readonly string[]).includes(municipality))
    return { ok: false, error: 'O concelho não pertence à ilha escolhida.' }

  let latitude: number | null = null
  let longitude: number | null = null
  if (input.latitude != null) {
    const n = Number(input.latitude)
    if (!Number.isFinite(n) || n < -90 || n > 90)
      return { ok: false, error: 'Latitude inválida.' }
    latitude = n
  }
  if (input.longitude != null) {
    const n = Number(input.longitude)
    if (!Number.isFinite(n) || n < -180 || n > 180)
      return { ok: false, error: 'Longitude inválida.' }
    longitude = n
  }

  let contact_phone: string | null = null
  const phoneRaw = (input.contact_phone ?? '').trim()
  if (phoneRaw.length > 0) {
    if (phoneRaw.replace(/[^\d+]/g, '').length < 7)
      return { ok: false, error: 'Contacto demasiado curto.' }
    contact_phone = phoneRaw
  }

  const attributes = sanitizeAttributes(input.kind, input.purpose, input.attributes ?? {})

  return {
    ok: true,
    row: {
      kind: input.kind,
      purpose: input.purpose,
      title,
      description: (input.description ?? '').trim() || null,
      price_cve: Math.round(price),
      location_island: island,
      location_municipality: municipality,
      location_city: (input.location_city ?? '').trim() || null,
      latitude,
      longitude,
      contact_phone,
      attributes,
    },
  }
}

export async function createListing(input: ListingInput): Promise<SaveListingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const v = validate(input)
  if (!v.ok) return v

  // Anti-spam: cap how many listings one account can hold.
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)
  if ((count ?? 0) >= MAX_LISTINGS_PER_USER) {
    return {
      ok: false,
      error: `Atingiste o limite de ${MAX_LISTINGS_PER_USER} anúncios. Apaga ou arquiva alguns antes de criar mais.`,
    }
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({ ...v.row, owner_id: user.id, status: 'draft' })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, listingId: data.id }
}

export async function updateListing(
  listingId: string,
  input: ListingInput,
): Promise<SaveListingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const v = validate(input)
  if (!v.ok) return v

  const { error } = await supabase
    .from('listings')
    .update(v.row)
    .eq('id', listingId)
    .eq('owner_id', user.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/listings')
  revalidatePath('/my-listings')
  revalidatePath(`/listings/${listingId}`)
  return { ok: true, listingId }
}

export async function attachPhoto(
  listingId: string,
  url: string,
  storagePath: string,
  position: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const { error } = await supabase.from('listing_photos').insert({
    listing_id: listingId,
    url,
    storage_path: storagePath,
    position,
  })
  if (error) return { ok: false, error: error.message }

  if (position === 0) {
    await supabase
      .from('listings')
      .update({ cover_image_url: url })
      .eq('id', listingId)
      .eq('owner_id', user.id)
  }
  return { ok: true }
}

export async function publishListing(listingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  const { error } = await supabase
    .from('listings')
    .update({ status: 'published' })
    .eq('id', listingId)
    .eq('owner_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/listings')
  revalidatePath('/my-listings')
  redirect(`/listings/${listingId}`)
}

/** Toggle a listing between published and paused. */
export async function setListingStatus(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['published', 'paused'].includes(status))
    throw new Error('Pedido inválido.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/listings')
  revalidatePath('/my-listings')
  revalidatePath(`/listings/${id}`)
}

export async function deleteListing(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('ID em falta.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  const { data: photoRows } = await supabase
    .from('listing_photos')
    .select('storage_path')
    .eq('listing_id', id)

  const photoPaths = (photoRows ?? [])
    .map((p) => p.storage_path)
    .filter((p): p is string => typeof p === 'string' && p.length > 0)

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw new Error(error.message)

  if (photoPaths.length > 0) {
    await supabase.storage.from('listings').remove(photoPaths)
  }

  revalidatePath('/listings')
  revalidatePath('/my-listings')
}
