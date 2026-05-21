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
