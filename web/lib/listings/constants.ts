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
 * Fallback coordinates for each island — pinned to the main population centre
 * (capital city or busiest town), not the geometric centroid. Most listings
 * will be at or near these cities, so this gives sensible pin positions when
 * a listing has no precise lat/long.
 */
export const ISLAND_CENTERS: Record<CVIsland, { lat: number; lng: number }> = {
  Santiago:      { lat: 14.9177, lng: -23.5092 },  // Praia
  'São Vicente': { lat: 16.8866, lng: -24.9956 },  // Mindelo
  Sal:           { lat: 16.6028, lng: -22.9097 },  // Santa Maria
  'Boa Vista':   { lat: 16.1797, lng: -22.9170 },  // Sal Rei
  Fogo:          { lat: 14.8965, lng: -24.4956 },  // São Filipe
  'Santo Antão': { lat: 17.1969, lng: -25.0942 },  // Ponta do Sol
  'São Nicolau': { lat: 16.6175, lng: -24.3036 },  // Ribeira Brava
  Maio:          { lat: 15.1372, lng: -23.2128 },  // Vila do Maio
  Brava:         { lat: 14.8672, lng: -24.7103 },  // Nova Sintra
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
