import type { ListingKind, ListingPurpose, ListingStatus } from './constants'

export type PropertyAttributes = {
  property_type?: string
  bedrooms?: number
  bathrooms?: number
  area_sqm?: number
  has_parking?: boolean
}

export type VehicleAttributes = {
  vehicle_type?: string
  brand?: string
  model?: string
  year?: number
  km?: number
  fuel?: string
  transmission?: string
}

export type ListingAttributes = PropertyAttributes & VehicleAttributes

export type Listing = {
  id: string
  owner_id: string
  kind: ListingKind
  purpose: ListingPurpose
  title: string
  description: string | null
  price_cve: number
  location_island: string
  location_city: string | null
  latitude: number | null
  longitude: number | null
  contact_phone: string | null
  attributes: ListingAttributes
  status: ListingStatus
  cover_image_url: string | null
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
