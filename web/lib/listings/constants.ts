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
 * (capital city or busiest town), not the geometric centroid.
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

export const CV_CENTER = { lat: 15.85, lng: -23.85 }
export const CV_DEFAULT_ZOOM = 7

/**
 * The 22 municipalities (concelhos) of Cabo Verde, grouped by island.
 * Powers the structured location dropdown when publishing a listing.
 */
export const CV_MUNICIPALITIES: Record<CVIsland, readonly string[]> = {
  Santiago: [
    'Praia',
    'Ribeira Grande de Santiago',
    'Santa Catarina',
    'Santa Cruz',
    'São Domingos',
    'São Lourenço dos Órgãos',
    'São Miguel',
    'São Salvador do Mundo',
    'Tarrafal',
  ],
  'São Vicente': ['São Vicente'],
  Sal: ['Sal'],
  'Boa Vista': ['Boa Vista'],
  Fogo: ['Mosteiros', 'Santa Catarina do Fogo', 'São Filipe'],
  'Santo Antão': ['Paul', 'Porto Novo', 'Ribeira Grande'],
  'São Nicolau': ['Ribeira Brava', 'Tarrafal de São Nicolau'],
  Maio: ['Maio'],
  Brava: ['Brava'],
}

/** Municipalities available on a given island ([] if the island is unknown). */
export function municipalitiesOf(island: string | undefined | null): readonly string[] {
  if (!island) return []
  return CV_MUNICIPALITIES[island as CVIsland] ?? []
}

/**
 * Approximate centre of each municipality — used to pre-position the
 * "Marcar no mapa" picker so the owner starts zoomed near the right area.
 * Keys are unique across all 22 municipalities.
 */
export const MUNICIPALITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  // Santiago
  Praia: { lat: 14.9177, lng: -23.5092 },
  'Ribeira Grande de Santiago': { lat: 14.9153, lng: -23.6033 },
  'Santa Catarina': { lat: 15.11, lng: -23.68 },
  'Santa Cruz': { lat: 15.1339, lng: -23.5667 },
  'São Domingos': { lat: 15.0297, lng: -23.5483 },
  'São Lourenço dos Órgãos': { lat: 15.05, lng: -23.6 },
  'São Miguel': { lat: 15.1833, lng: -23.6 },
  'São Salvador do Mundo': { lat: 15.0833, lng: -23.6333 },
  Tarrafal: { lat: 15.2772, lng: -23.7547 },
  // São Vicente
  'São Vicente': { lat: 16.8866, lng: -24.9956 },
  // Sal
  Sal: { lat: 16.7356, lng: -22.9472 },
  // Boa Vista
  'Boa Vista': { lat: 16.1797, lng: -22.917 },
  // Fogo
  Mosteiros: { lat: 15.0333, lng: -24.3333 },
  'Santa Catarina do Fogo': { lat: 14.9167, lng: -24.3167 },
  'São Filipe': { lat: 14.8965, lng: -24.4956 },
  // Santo Antão
  Paul: { lat: 17.1667, lng: -25.0167 },
  'Porto Novo': { lat: 17.0186, lng: -25.0656 },
  'Ribeira Grande': { lat: 17.1833, lng: -25.0667 },
  // São Nicolau
  'Ribeira Brava': { lat: 16.6175, lng: -24.3036 },
  'Tarrafal de São Nicolau': { lat: 16.5667, lng: -24.3556 },
  // Maio
  Maio: { lat: 15.1372, lng: -23.2128 },
  // Brava
  Brava: { lat: 14.8672, lng: -24.7103 },
}

/**
 * Best starting coordinates for the map picker, given an island + municipality.
 * Falls back: municipality centre → island centre → archipelago centre.
 */
export function locationCenter(
  island: string | undefined | null,
  municipality?: string | null,
): { lat: number; lng: number } {
  if (municipality && MUNICIPALITY_CENTERS[municipality]) {
    return MUNICIPALITY_CENTERS[municipality]
  }
  if (island && ISLAND_CENTERS[island as CVIsland]) {
    return ISLAND_CENTERS[island as CVIsland]
  }
  return CV_CENTER
}

/* — Listing kind — */
export const LISTING_KINDS = ['property', 'vehicle'] as const
export type ListingKind = (typeof LISTING_KINDS)[number]

/* — Listing purpose (3 values) — */
export const LISTING_PURPOSES = ['sale', 'rent_monthly', 'rent_daily'] as const
export type ListingPurpose = (typeof LISTING_PURPOSES)[number]

export function purposeLabel(p: string): string {
  switch (p) {
    case 'sale': return 'Venda'
    case 'rent_monthly': return 'Aluguer mensal'
    case 'rent_daily': return 'Aluguer diário'
    default: return 'Aluguer'
  }
}
export function purposeShort(p: string): string {
  switch (p) {
    case 'sale': return 'Venda'
    case 'rent_monthly': return 'Mensal'
    case 'rent_daily': return 'Diário'
    default: return '—'
  }
}
export function isRent(p: string): boolean {
  return p === 'rent_monthly' || p === 'rent_daily'
}
/** Unit suffix shown next to a price for a given purpose. */
export function priceSuffix(p: string): string {
  if (p === 'rent_monthly') return '/ mês'
  if (p === 'rent_daily') return '/ noite'
  return ''
}

/* — Listing status — */
export const LISTING_STATUSES = ['draft', 'published', 'paused', 'sold', 'rented', 'archived'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

/* — Property types — */
export const PROPERTY_TYPES = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'quarto', label: 'Quarto' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'comercial', label: 'Espaço comercial' },
  { value: 'escritorio', label: 'Escritório' },
  { value: 'outro', label: 'Outro' },
] as const

/* — Vehicle types — */
export const VEHICLE_TYPES = [
  { value: 'carro', label: 'Carro' },
  { value: 'mota', label: 'Mota' },
  { value: 'scooter', label: 'Scooter' },
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

/* — Conditions — */
export const PROPERTY_CONDITIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'bom', label: 'Bom estado' },
  { value: 'obras', label: 'A precisar de obras' },
] as const

export const VEHICLE_CONDITIONS = [
  { value: 'novo', label: 'Novo' },
  { value: 'semi-novo', label: 'Semi-novo' },
  { value: 'usado', label: 'Usado' },
  { value: 'pecas', label: 'Para peças' },
] as const

/* — Furnished (rent) — */
export const FURNISHED_OPTIONS = [
  { value: 'yes', label: 'Mobilado' },
  { value: 'partial', label: 'Parcialmente mobilado' },
  { value: 'no', label: 'Sem mobília' },
] as const

/* — Amenities (property rent_daily) — */
export const AMENITIES = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'ac', label: 'Ar condicionado' },
  { value: 'kitchen', label: 'Cozinha equipada' },
  { value: 'washer', label: 'Máquina de lavar' },
  { value: 'pool', label: 'Piscina' },
  { value: 'parking', label: 'Estacionamento' },
  { value: 'sea_view', label: 'Vista mar' },
  { value: 'tv', label: 'TV' },
  { value: 'workspace', label: 'Zona de trabalho' },
  { value: 'generator', label: 'Gerador' },
  { value: 'balcony', label: 'Varanda' },
  { value: 'elevator', label: 'Elevador' },
] as const

/* — House rules (property rent) — */
export const HOUSE_RULES = [
  { value: 'no_smoking', label: 'Proibido fumar' },
  { value: 'no_pets', label: 'Sem animais' },
  { value: 'no_parties', label: 'Sem festas' },
  { value: 'family_friendly', label: 'Adequado a famílias' },
] as const

/* — Utilities included (property rent_monthly) — */
export const UTILITIES = [
  { value: 'agua', label: 'Água' },
  { value: 'luz', label: 'Eletricidade' },
  { value: 'internet', label: 'Internet' },
  { value: 'condominio', label: 'Condomínio' },
] as const

/* — Vehicle extras — */
export const VEHICLE_EXTRAS = [
  { value: 'ac', label: 'Ar condicionado' },
  { value: 'bluetooth', label: 'Bluetooth' },
  { value: 'gps', label: 'GPS' },
  { value: 'parking_sensors', label: 'Sensores de estacionamento' },
  { value: 'rear_camera', label: 'Câmara traseira' },
  { value: 'alloy_wheels', label: 'Jantes de liga' },
  { value: 'electric_windows', label: 'Vidros elétricos' },
  { value: 'leather_seats', label: 'Bancos em pele' },
] as const

/* — Delivery options (vehicle rent_daily) — */
export const DELIVERY_OPTIONS = [
  { value: 'balcao', label: 'Levantamento no balcão' },
  { value: 'aeroporto', label: 'Entrega no aeroporto' },
  { value: 'domicilio', label: 'Entrega ao domicílio' },
] as const

/* — Cancellation policy (rent_daily) — */
export const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexível — reembolso total até 24h antes' },
  { value: 'moderate', label: 'Moderada — reembolso total até 5 dias antes' },
  { value: 'strict', label: 'Rigorosa — sem reembolso' },
] as const

/** Look up a human label from one of the {value,label} option lists. */
export function labelOf(
  list: readonly { value: string; label: string }[],
  value: string | undefined | null,
): string {
  if (!value) return '—'
  return list.find((o) => o.value === value)?.label ?? value
}

export function formatCVE(amount: number): string {
  return (
    new Intl.NumberFormat('pt-PT', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' CVE'
  )
}
