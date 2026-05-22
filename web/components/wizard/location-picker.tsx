'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { CV_ISLANDS, municipalitiesOf } from '@/lib/listings/constants'
import { Field, TextField, inputClass, type WizardData, type Setter } from './fields'
import { PinIcon } from '@/components/icons'

/** Leaflet only runs in the browser — load the picker map client-side only. */
const LocationMap = dynamic(() => import('./location-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-paper-soft text-sm text-text-3">
      A carregar mapa…
    </div>
  ),
})

/**
 * Step 2 location block: island → concelho dropdowns, an optional
 * zona/bairro freetext, and an optional "Marcar no mapa" pin picker.
 *
 * Logic kept deliberately simple:
 *  - picking an island resets the concelho (and any stale pin);
 *  - islands with a single concelho auto-select it;
 *  - without a pin, the concelho centre is used as the listing's location.
 */
export function LocationPicker({ data, set }: { data: WizardData; set: Setter }) {
  const island = (data.location_island as string) ?? ''
  const municipality = (data.location_municipality as string) ?? ''

  const latRaw = data.latitude
  const lngRaw = data.longitude
  const lat =
    latRaw != null && latRaw !== '' && Number.isFinite(Number(latRaw))
      ? Number(latRaw)
      : null
  const lng =
    lngRaw != null && lngRaw !== '' && Number.isFinite(Number(lngRaw))
      ? Number(lngRaw)
      : null
  const hasPin = lat != null && lng != null

  const munis = municipalitiesOf(island)
  const [mapOpen, setMapOpen] = useState(hasPin)

  function onIsland(value: string) {
    set('location_island', value)
    const list = municipalitiesOf(value)
    set('location_municipality', list.length === 1 ? list[0] : '')
    set('latitude', '')
    set('longitude', '')
  }
  function onMunicipality(value: string) {
    set('location_municipality', value)
    // Drop a stale street-level pin; the new concelho centre takes over.
    set('latitude', '')
    set('longitude', '')
  }
  function onPick(la: number, lo: number) {
    set('latitude', la.toFixed(6))
    set('longitude', lo.toFixed(6))
  }
  function clearPin() {
    set('latitude', '')
    set('longitude', '')
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Ilha" required>
          <select
            value={island}
            onChange={(e) => onIsland(e.target.value)}
            className={inputClass}
          >
            <option value="">Escolhe…</option>
            {CV_ISLANDS.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </Field>

        <Field
          label="Concelho"
          required
          hint={island ? undefined : 'Escolhe primeiro a ilha.'}
        >
          <select
            value={municipality}
            onChange={(e) => onMunicipality(e.target.value)}
            disabled={!island}
            className={`${inputClass} ${!island ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <option value="">{island ? 'Escolhe…' : '—'}</option>
            {munis.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>
      </div>

      <TextField
        data={data}
        set={set}
        name="location_city"
        label="Zona / Bairro"
        placeholder="Ex: Achada Santo António, Palmarejo, Chã de Areia…"
        hint="Opcional — ajuda quem procura a situar-se."
      />

      {/* Map pin picker */}
      <div className="rounded-md border border-shell bg-paper-soft/50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Localização no mapa</p>
            <p className="text-[12px] text-text-3">
              {hasPin
                ? 'Pino colocado — arrasta-o para afinar.'
                : 'Opcional. Sem pino, usamos o centro do concelho.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMapOpen((open) => !open)}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-shell bg-white px-3 py-1.5 text-[13px] text-text-2 transition-colors hover:border-ink hover:text-ink"
          >
            <PinIcon className="h-3.5 w-3.5" />
            {mapOpen ? 'Fechar mapa' : 'Marcar no mapa'}
          </button>
        </div>

        {mapOpen && (
          <div className="mt-3 space-y-2">
            <div className="h-[320px] w-full overflow-hidden rounded-lg border border-shell">
              <LocationMap
                island={island}
                municipality={municipality}
                lat={lat}
                lng={lng}
                onPick={onPick}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span className="text-text-3 tnum">
                {hasPin
                  ? `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`
                  : 'Clica no mapa para colocar o pino.'}
              </span>
              {hasPin && (
                <button
                  type="button"
                  onClick={clearPin}
                  className="flex-shrink-0 text-coral-deep underline underline-offset-2 transition-colors hover:text-coral"
                >
                  Limpar marcação
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
