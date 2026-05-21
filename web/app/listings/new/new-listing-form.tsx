'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CV_ISLANDS,
  PROPERTY_TYPES,
  VEHICLE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  type ListingKind,
} from '@/lib/listings/constants'
import {
  createListing,
  attachPhoto,
  publishListing,
} from '@/app/actions/listings'
import { HouseIcon, CarIcon, CheckIcon } from '@/components/icons'

type Status = {
  phase: 'idle' | 'submitting' | 'uploading' | 'publishing' | 'error'
  message?: string
  uploadedCount?: number
  totalCount?: number
}

export function NewListingForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [kind, setKind] = useState<ListingKind>('property')
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>({ phase: 'idle' })
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus({ phase: 'submitting' })

    const formData = new FormData(e.currentTarget)
    const result = await createListing(formData)
    if (!result.ok) {
      setStatus({ phase: 'error', message: result.error })
      return
    }
    const listingId = result.listingId

    if (files.length > 0) {
      setStatus({ phase: 'uploading', uploadedCount: 0, totalCount: files.length })
      const supabase = createClient()
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${userId}/${listingId}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('listings')
          .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
        if (upErr) {
          setStatus({ phase: 'error', message: `Falha ao enviar foto ${i + 1}: ${upErr.message}` })
          return
        }
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(path)
        const attachResult = await attachPhoto(listingId, publicUrl, path, i)
        if (!attachResult.ok) {
          setStatus({ phase: 'error', message: attachResult.error })
          return
        }
        setStatus({ phase: 'uploading', uploadedCount: i + 1, totalCount: files.length })
      }
    }

    setStatus({ phase: 'publishing' })
    startTransition(async () => {
      try {
        await publishListing(listingId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro inesperado.'
        if (msg.toLowerCase().includes('next_redirect')) {
          router.refresh()
          return
        }
        setStatus({ phase: 'error', message: msg })
      }
    })
  }

  const submitting =
    status.phase === 'submitting' ||
    status.phase === 'uploading' ||
    status.phase === 'publishing'

  return (
    <form onSubmit={handleSubmit} className="space-y-14">
      {/* 01 — Tipo */}
      <Section num="01" title="Tipo">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KindCard
            checked={kind === 'property'}
            onChange={() => setKind('property')}
            icon={<HouseIcon className="h-7 w-7" />}
            label="Imóvel"
            sub="Casa, apartamento, terreno, comercial"
          />
          <KindCard
            checked={kind === 'vehicle'}
            onChange={() => setKind('vehicle')}
            icon={<CarIcon className="h-7 w-7" />}
            label="Automóvel"
            sub="Carro, mota, comercial, camião"
          />
        </div>
        <input type="hidden" name="kind" value={kind} />

        <div className="mt-5 grid grid-cols-2 gap-3">
          <PurposeCard name="purpose" value="sale" label="Venda" defaultChecked />
          <PurposeCard name="purpose" value="rent" label="Aluguer" />
        </div>
      </Section>

      {/* 02 — Detalhes */}
      <Section num="02" title="Detalhes">
        <Field id="title" label="Título" required>
          <input
            id="title"
            name="title"
            required
            minLength={3}
            maxLength={140}
            placeholder={kind === 'property' ? 'Ex: Apartamento T2 luminoso com varanda' : 'Ex: Toyota Corolla 2018 em excelente estado'}
            className={inputClass}
          />
        </Field>
        <Field id="description" label="Descrição">
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Descreve o estado, localização aproximada, condições, motivações…"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="price_cve" label="Preço" required>
            <div className="relative">
              <input
                id="price_cve"
                name="price_cve"
                type="number"
                min={0}
                required
                placeholder="0"
                className={`${inputClass} pr-12 tnum`}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs uppercase tracking-[0.15em] text-text-3">
                CVE
              </span>
            </div>
          </Field>
          <Field id="location_island" label="Ilha" required>
            <select
              id="location_island"
              name="location_island"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>Escolhe…</option>
              {CV_ISLANDS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </Field>
        </div>
        <Field id="location_city" label="Cidade / Localidade">
          <input
            id="location_city"
            name="location_city"
            placeholder="Ex: Praia, Mindelo, Santa Maria…"
            className={inputClass}
          />
        </Field>

        <div className="rounded-md border border-shell bg-paper-soft/50 p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-text-3">
              Coordenadas <span className="normal-case tracking-normal text-text-3">(opcional)</span>
            </span>
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-ink-soft underline-offset-2 hover:underline"
            >
              Como copiar do Google Maps ↗
            </a>
          </div>
          <p className="mt-1 text-[12px] text-text-3">
            Sem coordenadas o pino aparece no centro da ilha. Para mostrar a localização exacta no mapa, cola aqui valores do Google Maps (clica no local → copia o par de números).
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field id="latitude" label="Latitude">
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                placeholder="14.917"
                className={`${inputClass} tnum`}
              />
            </Field>
            <Field id="longitude" label="Longitude">
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                placeholder="-23.508"
                className={`${inputClass} tnum`}
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* 03 — Características */}
      <Section
        num="03"
        title={kind === 'property' ? 'Características do imóvel' : 'Características do automóvel'}
      >
        {kind === 'property' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="property_type" label="Tipo">
              <select id="property_type" name="property_type" defaultValue="" className={inputClass}>
                <option value="">—</option>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field id="area_sqm" label="Área (m²)">
              <input id="area_sqm" name="area_sqm" type="number" min={0} className={`${inputClass} tnum`} />
            </Field>
            <Field id="bedrooms" label="Quartos">
              <input id="bedrooms" name="bedrooms" type="number" min={0} className={`${inputClass} tnum`} />
            </Field>
            <Field id="bathrooms" label="Casas de banho">
              <input id="bathrooms" name="bathrooms" type="number" min={0} className={`${inputClass} tnum`} />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="vehicle_type" label="Tipo">
              <select id="vehicle_type" name="vehicle_type" defaultValue="" className={inputClass}>
                <option value="">—</option>
                {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field id="year" label="Ano">
              <input id="year" name="year" type="number" min={1900} max={2100} className={`${inputClass} tnum`} />
            </Field>
            <Field id="brand" label="Marca">
              <input id="brand" name="brand" className={inputClass} placeholder="Toyota, Hyundai…" />
            </Field>
            <Field id="model" label="Modelo">
              <input id="model" name="model" className={inputClass} placeholder="Corolla, Tucson…" />
            </Field>
            <Field id="km" label="Quilometragem">
              <input id="km" name="km" type="number" min={0} className={`${inputClass} tnum`} />
            </Field>
            <Field id="fuel" label="Combustível">
              <select id="fuel" name="fuel" defaultValue="" className={inputClass}>
                <option value="">—</option>
                {FUEL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field id="transmission" label="Caixa">
              <select id="transmission" name="transmission" defaultValue="" className={inputClass}>
                <option value="">—</option>
                {TRANSMISSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
          </div>
        )}
      </Section>

      {/* 04 — Fotos */}
      <Section num="04" title="Fotos">
        <label className="block cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed border-shell bg-paper-soft px-6 py-12 text-center transition-colors hover:border-ink hover:bg-white">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="sr-only"
          />
          <span className="font-display text-lg text-ink">
            {files.length === 0 ? 'Adicionar fotos' : `${files.length} foto${files.length === 1 ? '' : 's'} selecionada${files.length === 1 ? '' : 's'}`}
          </span>
          <span className="mt-1 block text-sm text-text-3">
            {files.length === 0
              ? 'JPG, PNG ou WebP. A primeira foto será a capa.'
              : 'Clica novamente para mudar a seleção.'}
          </span>
        </label>

        {files.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {files.slice(0, 8).map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-paper-soft px-3 py-1.5 text-[12px] text-text-2"
              >
                <span className="numeral text-text-3 tnum">{String(i + 1).padStart(2, '0')}</span>
                {f.name}
              </li>
            ))}
            {files.length > 8 && (
              <li className="inline-flex items-center rounded-full bg-paper-soft px-3 py-1.5 text-[12px] text-text-2">
                + {files.length - 8} mais
              </li>
            )}
          </ul>
        )}
      </Section>

      {/* Footer / submit */}
      <div className="space-y-3 border-t border-shell pt-8">
        {status.phase === 'error' && (
          <p className="rounded-md border border-coral/40 bg-coral-soft px-4 py-3 text-sm text-coral-deep">
            {status.message}
          </p>
        )}
        {status.phase === 'uploading' && (
          <p className="rounded-md border border-shell bg-paper-soft px-4 py-3 text-sm text-text-2">
            A enviar foto {status.uploadedCount}/{status.totalCount}…
          </p>
        )}
        {status.phase === 'publishing' && (
          <p className="rounded-md border border-shell bg-paper-soft px-4 py-3 text-sm text-text-2">
            A publicar…
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-text-3">
            Ao publicar, o teu anúncio fica visível para qualquer pessoa.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'A publicar…' : 'Publicar anúncio'}
            {!submitting && <CheckIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </form>
  )
}

const inputClass =
  'w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 placeholder-text-3 shadow-[inset_0_-1px_0_rgb(11_46_64_/_0.02)] outline-none transition-colors focus:border-ink'

function Section({
  num,
  title,
  children,
}: {
  num: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 border-b border-shell pb-3">
        <span className="numeral text-[28px] text-text-3 tnum">{num}</span>
        <h2 className="font-display text-2xl font-medium tracking-[-0.015em] text-ink">{title}</h2>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  )
}

function Field({
  id, label, required, children,
}: {
  id: string; label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[13px] font-medium uppercase tracking-[0.12em] text-text-3">
        {label} {required && <span className="text-coral">*</span>}
      </label>
      {children}
    </div>
  )
}

function KindCard({
  checked, onChange, icon, label, sub,
}: {
  checked: boolean; onChange: () => void; icon: React.ReactNode; label: string; sub: string
}) {
  return (
    <label
      className={`group relative cursor-pointer overflow-hidden rounded-[var(--radius-card)] border bg-white p-5 transition-all ${
        checked
          ? 'border-ink shadow-[var(--shadow-card-hover)]'
          : 'border-shell hover:border-line-strong hover:shadow-[var(--shadow-card)]'
      }`}
    >
      <input type="radio" name="kind_picker" checked={checked} onChange={onChange} className="sr-only" />
      <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
        checked ? 'bg-ink text-paper' : 'bg-paper-soft text-ink'
      }`}>
        {icon}
      </div>
      <div className="mt-4 font-display text-xl font-medium text-ink">{label}</div>
      <div className="mt-1 text-[13px] text-text-2">{sub}</div>
      {checked && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      )}
    </label>
  )
}

function PurposeCard({
  name, value, label, defaultChecked,
}: {
  name: string; value: string; label: string; defaultChecked?: boolean
}) {
  return (
    <label className="relative flex cursor-pointer items-center gap-3 rounded-lg border border-shell bg-white px-4 py-3 transition-colors has-[:checked]:border-ink has-[:checked]:bg-paper-soft">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-shell peer-checked:border-ink peer-checked:bg-ink">
        <span className="hidden h-1.5 w-1.5 rounded-full bg-paper peer-checked:block" />
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </label>
  )
}
