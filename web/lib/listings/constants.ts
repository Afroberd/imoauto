export const CV_ISLANDS = [
  'Santiago',
  'São Vicente',
  'Sal',
  'Boa Vista',
  'Fogo',
  'Santo Antão',
  'São Nicolau',
  'Maio',
  'Brava',
] as const

export type CVIsland = (typeof CV_ISLANDS)[number]

/**
 * Approximate centre coordinates for each island. Used as a fallback when a
 * listing has no precise lat/long. Source: rough geographic centres taken from
 * publicly known island centroids.
 */
export const ISLAND_CENTERS: Record<CVIsland, { lat: number; lng: number }> = {
  Santiago:      { lat: 15.10, lng: -23.62 },
  'São Vicente': { lat: 16.83, lng: -24.99 },
  Sal:           { lat: 16.73, lng: -22.93 },
  'Boa Vista':   { lat: 16.10, lng: -22.82 },
  Fogo:          { lat: 14.92, lng: -24.39 },
  'Santo Antão': { lat: 17.07, lng: -25.16 },
  'São Nicolau': { lat: 16.60, lng: -24.30 },
  Maio:          { lat: 15.20, lng: -23.16 },
  Brava:         { lat: 14.85, lng: -24.71 },
}

/** Centre of Cabo Verde for the default map view. */
export const CV_CENTER = { lat: 15.85, lng: -23.85 }
export const CV_DEFAULT_ZOOM = 7

export const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Espaço comercial' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'outro', label: 'Outro' },
] as const

export const VEHICLE_TYPES = [
  { value: 'carro', label: 'Carro' },
  { value: 'mota', label: 'Mota' },
  { value: 'comercial', label: 'Comercial / Pickup' },
  { value: 'camiao', label: 'Camião' },
  { value: 'outro', label: 'Outro' },
] as const

export const FUEL_TYPES = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'gasoleo', label: 'Gasóleo' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'eletrico', label: 'Elétrico' },
  { value: 'glp', label: 'GPL' },
] as const

export const TRANSMISSION_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatica', label: 'Automática' },
] as const

export const LISTING_KINDS = ['property', 'vehicle'] as const
export type ListingKind = (typeof LISTING_KINDS)[number]

export const LISTING_PURPOSES = ['sale', 'rent'] as const
export type ListingPurpose = (typeof LISTING_PURPOSES)[number]

export const LISTING_STATUSES = ['draft', 'published', 'sold', 'rented', 'archived'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export function formatCVE(cents: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(cents) + ' CVE'
}
