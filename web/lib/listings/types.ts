import type { ListingKind, ListingPurpose, ListingStatus } from './constants'

/**
 * Type-specific attributes. All optional — which fields are relevant depends
 * on kind + purpose. The wizard fills only the relevant subset; the server
 * action strips anything not applicable to the chosen combination.
 */
export type ListingAttributes = {
  // — Property: common —
  property_type?: string
  area_sqm?: number
  bedrooms?: number
  bathrooms?: number
  year_built?: number
  has_garage?: boolean

  // — Property: sale —
  property_condition?: string // novo | bom | obras

  // — Property: rent (monthly + daily) —
  furnished?: string // yes | partial | no
  rules?: string[]

  // — Property: rent_monthly —
  utilities_included?: string[]
  min_contract_months?: number
  available_from?: string // ISO date

  // — Property: rent_daily —
  beds?: number
  guests?: number
  amenities?: string[]
  cleaning_fee_cve?: number
  min_nights?: number
  max_nights?: number
  checkin_time?: string
  checkout_time?: string
  cancellation?: string // flexible | moderate | strict

  // — Vehicle: common —
  vehicle_type?: string
  brand?: string
  model?: string
  year?: number
  km?: number
  fuel?: string
  transmission?: string
  seats?: number
  doors?: number
  color?: string

  // — Vehicle: sale —
  vehicle_condition?: string // novo | semi-novo | usado | pecas
  docs_ok?: boolean

  // — Vehicle: rent (daily + monthly) —
  vehicle_extras?: string[]
  min_driver_age?: number
  daily_km_included?: number // omit/undefined = ilimitado
  insurance_included?: boolean
  delivery_options?: string[]

  // — Shared: rent pricing extras —
  price_weekly_cve?: number
  deposit_cve?: number

  // — Shared: sale —
  negotiable?: boolean
}

export type Listing = {
  id: string
  owner_id: string
  kind: ListingKind
  purpose: ListingPurpose
  title: string
  description: string | null
  price_cve: number
  location_island: string
  location_municipality: string | null
  location_city: string | null
  latitude: number | null
  longitude: number | null
  contact_phone: string | null
  attributes: ListingAttributes
  status: ListingStatus
  cover_image_url: string | null
  rating_avg: number | null
  rating_count: number
  created_at: string
  updated_at: string
}

export type ListingPhoto = {
  id: string
  listing_id: string
  url: string
  storage_path: string
  position: number
  created_at: string
}

export type ListingWithPhotos = Listing & { photos: ListingPhoto[] }

/** Payload accepted by the create/update server actions. */
export type ListingInput = {
  kind: ListingKind
  purpose: ListingPurpose
  title: string
  description: string
  price_cve: number
  location_island: string
  location_municipality: string
  location_city: string
  latitude: number | null
  longitude: number | null
  contact_phone: string
  attributes: ListingAttributes
}
