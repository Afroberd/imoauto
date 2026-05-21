'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ListingAttributes } from '@/lib/listings/types'
import {
  CV_ISLANDS,
  LISTING_KINDS,
  LISTING_PURPOSES,
  type ListingKind,
  type ListingPurpose,
} from '@/lib/listings/constants'

export type CreateListingResult =
  | { ok: true; listingId: string }
  | { ok: false; error: string }

function isKind(value: string): value is ListingKind {
  return (LISTING_KINDS as readonly string[]).includes(value)
}
function isPurpose(value: string): value is ListingPurpose {
  return (LISTING_PURPOSES as readonly string[]).includes(value)
}

export async function createListing(
  formData: FormData
): Promise<CreateListingResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Não autenticado.' }

  const kindRaw = String(formData.get('kind') ?? '')
  const purposeRaw = String(formData.get('purpose') ?? 'sale')
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const priceStr = String(formData.get('price_cve') ?? '').trim()
  const island = String(formData.get('location_island') ?? '').trim()
  const city = String(formData.get('location_city') ?? '').trim() || null

  if (!isKind(kindRaw)) return { ok: false, error: 'Tipo inválido.' }
  if (!isPurpose(purposeRaw)) return { ok: false, error: 'Finalidade inválida.' }
  if (title.length < 3) return { ok: false, error: 'Título muito curto.' }
  const priceNum = Number(priceStr.replace(/[^\d]/g, ''))
  if (!Number.isFinite(priceNum) || priceNum < 0)
    return { ok: false, error: 'Preço inválido.' }
  if (!(CV_ISLANDS as readonly string[]).includes(island))
    return { ok: false, error: 'Ilha inválida.' }

  const latRaw = String(formData.get('latitude') ?? '').trim()
  const lngRaw = String(formData.get('longitude') ?? '').trim()
  const contactPhoneRaw = String(formData.get('contact_phone') ?? '').trim()
  let latitude: number | null = null
  let longitude: number | null = null
  // Light normalisation — keep digits, +, spaces, dashes. Reject if too short.
  let contact_phone: string | null = null
  if (contactPhoneRaw.length > 0) {
    const cleaned = contactPhoneRaw.replace(/[^\d+]/g, '')
    if (cleaned.length < 7) return { ok: false, error: 'Contacto demasiado curto.' }
    contact_phone = contactPhoneRaw // store as user typed (visual), wa.me normalises later
  }
  if (latRaw) {
    const n = Number(latRaw)
    if (!Number.isFinite(n) || n < -90 || n > 90)
      return { ok: false, error: 'Latitude inválida (entre -90 e 90).' }
    latitude = n
  }
  if (lngRaw) {
    const n = Number(lngRaw)
    if (!Number.isFinite(n) || n < -180 || n > 180)
      return { ok: false, error: 'Longitude inválida (entre -180 e 180).' }
    longitude = n
  }

  const attributes: ListingAttributes = {}
  if (kindRaw === 'property') {
    const property_type = String(formData.get('property_type') ?? '').trim()
    const bedrooms = Number(formData.get('bedrooms') ?? '')
    const bathrooms = Number(formData.get('bathrooms') ?? '')
    const area_sqm = Number(formData.get('area_sqm') ?? '')
    if (property_type) attributes.property_type = property_type
    if (Number.isFinite(bedrooms) && bedrooms >= 0) attributes.bedrooms = bedrooms
    if (Number.isFinite(bathrooms) && bathrooms >= 0) attributes.bathrooms = bathrooms
    if (Number.isFinite(area_sqm) && area_sqm > 0) attributes.area_sqm = area_sqm
  } else {
    const vehicle_type = String(formData.get('vehicle_type') ?? '').trim()
    const brand = String(formData.get('brand') ?? '').trim()
    const model = String(formData.get('model') ?? '').trim()
    const year = Number(formData.get('year') ?? '')
    const km = Number(formData.get('km') ?? '')
    const fuel = String(formData.get('fuel') ?? '').trim()
    const transmission = String(formData.get('transmission') ?? '').trim()
    if (vehicle_type) attributes.vehicle_type = vehicle_type
    if (brand) attributes.brand = brand
    if (model) attributes.model = model
    if (Number.isFinite(year) && year > 1900) attributes.year = year
    if (Number.isFinite(km) && km >= 0) attributes.km = km
    if (fuel) attributes.fuel = fuel
    if (transmission) attributes.transmission = transmission
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      owner_id: user.id,
      kind: kindRaw,
      purpose: purposeRaw,
      title,
      description,
      price_cve: priceNum,
      location_island: island,
      location_city: city,
      latitude,
      longitude,
      contact_phone,
      attributes,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, listingId: data.id }
}

export async function attachPhoto(
  listingId: string,
  url: string,
  storagePath: string,
  position: number
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

export async function deleteListing(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) throw new Error('ID em falta.')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado.')

  // First fetch storage paths of all attached photos so we can purge them from Storage.
  // RLS guarantees we only see photos of listings we own — and we filter by listing_id
  // matching the listing whose owner is auth.uid().
  const { data: photoRows } = await supabase
    .from('listing_photos')
    .select('storage_path')
    .eq('listing_id', id)

  const photoPaths = (photoRows ?? [])
    .map((p) => p.storage_path)
    .filter((p): p is string => typeof p === 'string' && p.length > 0)

  // Delete the listing row — cascade removes listing_photos rows.
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) throw new Error(error.message)

  // Best-effort: purge orphaned files from Storage. If this fails we don't roll back
  // the listing deletion — the row is already gone and that's what matters for UX.
  if (photoPaths.length > 0) {
    await supabase.storage.from('listings').remove(photoPaths)
  }

  revalidatePath('/listings')
  revalidatePath('/my-listings')
}
