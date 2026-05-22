'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { locationCenter } from '@/lib/listings/constants'

/** Coral drop-pin built inline — avoids leaflet's default marker images,
 *  which break under Next bundling. */
const pickPin = L.divIcon({
  className: '',
  html: `
    <svg width="32" height="42" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11 15 25 15 25s15-14 15-25C30 6.7 23.3 0 15 0z" fill="#E76B4F"/>
      <circle cx="15" cy="15" r="6" fill="#FAF7F0"/>
      <circle cx="15" cy="15" r="2.5" fill="#0B2E40"/>
    </svg>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
})

/** Captures map clicks and reports the picked coordinate. */
function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Re-centres the map when the island/municipality target changes — but never
 *  on first mount, so an existing pin stays framed. */
function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    map.setView([lat, lng], zoom)
  }, [lat, lng, zoom, map])
  return null
}

export default function LocationMap({
  island,
  municipality,
  lat,
  lng,
  onPick,
}: {
  island: string
  municipality: string
  lat: number | null
  lng: number | null
  onPick: (lat: number, lng: number) => void
}) {
  const target = locationCenter(island, municipality)
  const hasPin = lat != null && lng != null
  const start = hasPin ? { lat, lng } : target
  const areaZoom = municipality ? 13 : island ? 11 : 7
  const startZoom = hasPin ? 15 : areaZoom

  return (
    <MapContainer
      center={[start.lat, start.lng]}
      zoom={startZoom}
      className="h-full w-full"
      style={{ background: '#E5DCC4', cursor: 'crosshair' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      <ClickCapture onPick={onPick} />
      <Recenter lat={target.lat} lng={target.lng} zoom={areaZoom} />
      {hasPin && (
        <Marker
          position={[lat, lng]}
          icon={pickPin}
          draggable
          eventHandlers={{
            dragend(e) {
              const p = (e.target as L.Marker).getLatLng()
              onPick(p.lat, p.lng)
            },
          }}
        />
      )}
    </MapContainer>
  )
}
