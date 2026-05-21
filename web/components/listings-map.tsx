'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  CV_CENTER,
  CV_DEFAULT_ZOOM,
  ISLAND_CENTERS,
  formatCVE,
  type CVIsland,
} from '@/lib/listings/constants'
import type { Listing } from '@/lib/listings/types'

// Custom pin icon, ink-coloured. Built inline so we don't depend on leaflet's
// default marker images (which break under Next bundling).
const inkPin = L.divIcon({
  className: '',
  html: `
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#0B2E40"/>
      <circle cx="15" cy="15" r="6" fill="#FAF7F0"/>
      <circle cx="15" cy="15" r="2.5" fill="#E76B4F"/>
    </svg>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
})

const coralPin = L.divIcon({
  className: '',
  html: `
    <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#E76B4F"/>
      <circle cx="15" cy="15" r="6" fill="#FAF7F0"/>
      <circle cx="15" cy="15" r="2.5" fill="#0B2E40"/>
    </svg>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
})

function resolveCoords(l: Listing) {
  if (l.latitude != null && l.longitude != null) {
    return { lat: l.latitude, lng: l.longitude, approx: false }
  }
  const center = ISLAND_CENTERS[l.location_island as CVIsland]
  if (center) return { lat: center.lat, lng: center.lng, approx: true }
  return { lat: CV_CENTER.lat, lng: CV_CENTER.lng, approx: true }
}

// Spread pins that share the same approximate island centre so they don't overlap
function spreadApproximate(listings: Listing[]) {
  const buckets: Record<string, number> = {}
  return listings.map((l) => {
    const r = resolveCoords(l)
    if (!r.approx) return { listing: l, lat: r.lat, lng: r.lng, approx: false as const }
    const key = `${r.lat.toFixed(2)},${r.lng.toFixed(2)}`
    const idx = (buckets[key] = (buckets[key] ?? 0) + 1)
    // simple circular spread within ~0.02° (~2km)
    const angle = (idx * 2.4) % (2 * Math.PI)
    const radius = 0.015 + (idx * 0.008)
    return {
      listing: l,
      lat: r.lat + Math.sin(angle) * radius,
      lng: r.lng + Math.cos(angle) * radius,
      approx: true as const,
    }
  })
}

export default function ListingsMap({ listings }: { listings: Listing[] }) {
  const points = useMemo(() => spreadApproximate(listings), [listings])

  return (
    <div className="relative h-[68vh] min-h-[480px] w-full overflow-hidden rounded-[var(--radius-card)] border border-shell">
      <MapContainer
        center={[CV_CENTER.lat, CV_CENTER.lng]}
        zoom={CV_DEFAULT_ZOOM}
        zoomControl={false}
        className="h-full w-full"
        style={{ background: '#E5DCC4' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />
        {points.map(({ listing: l, lat, lng, approx }) => (
          <Marker
            key={l.id}
            position={[lat, lng]}
            icon={l.purpose === 'rent' ? coralPin : inkPin}
          >
            <Popup>
              <div className="min-w-[200px]">
                {l.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.cover_image_url}
                    alt=""
                    className="mb-2 h-24 w-full rounded object-cover"
                  />
                )}
                <div className="text-[11px] uppercase tracking-[0.15em] text-neutral-500">
                  {l.kind === 'property' ? 'Imóvel' : 'Automóvel'} ·{' '}
                  {l.purpose === 'rent' ? 'Aluguer' : 'Venda'}
                </div>
                <div className="mt-1 font-medium text-neutral-900">{l.title}</div>
                <div className="mt-1 text-sm text-neutral-700 tnum">
                  {formatCVE(l.price_cve)}
                </div>
                <div className="mt-0.5 text-[11px] text-neutral-500">
                  {l.location_island}
                  {l.location_city ? `, ${l.location_city}` : ''}
                  {approx && ' · localização aproximada'}
                </div>
                <Link
                  href={`/listings/${l.id}`}
                  className="mt-2 inline-block text-[12px] font-medium text-ink underline underline-offset-2"
                >
                  Ver anúncio →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute left-4 top-4 z-[1000] rounded-full border border-shell bg-white/95 px-3 py-1.5 text-[11px] text-text-2 shadow-[var(--shadow-card)] backdrop-blur">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" /> Venda
          <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-coral" /> Aluguer
        </span>
      </div>
    </div>
  )
}
