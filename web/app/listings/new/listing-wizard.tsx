'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createListing, updateListing, attachPhoto, publishListing,
} from '@/app/actions/listings'
import {
  PROPERTY_TYPES, VEHICLE_TYPES,
  purposeLabel, formatCVE,
  type ListingKind, type ListingPurpose,
} from '@/lib/listings/constants'
import type { ListingInput } from '@/lib/listings/types'
import {
  Field, TextField, TextArea, NumberField, ToggleField, FieldGrid,
  type WizardData, type Setter,
} from '@/components/wizard/fields'
import { PropertyFields } from '@/components/wizard/property-fields'
import { VehicleFields } from '@/components/wizard/vehicle-fields'
import { LocationPicker } from '@/components/wizard/location-picker'
import { HouseIcon, CarIcon, CheckIcon, ArrowRightIcon } from '@/components/icons'

type Mode = 'create' | 'edit'

type Initial = {
  kind: ListingKind
  purpose: ListingPurpose
  data: WizardData
}

const TOP_LEVEL = new Set([
  'title', 'description', 'price_cve',
  'location_island', 'location_municipality', 'location_city',
  'latitude', 'longitude', 'contact_phone',
])

const PURPOSES_FOR: Record<ListingKind, { value: ListingPurpose; label: string; sub: string }[]> = {
  property: [
    { value: 'sale', label: 'Venda', sub: 'Vender o imóvel' },
    { value: 'rent_monthly', label: 'Aluguer mensal', sub: 'Arrendamento de longa duração' },
    { value: 'rent_daily', label: 'Aluguer diário', sub: 'Estadia turística, por noite' },
  ],
  vehicle: [
    { value: 'sale', label: 'Venda', sub: 'Vender o veículo' },
    { value: 'rent_daily', label: 'Aluguer diário', sub: 'Rent-a-car, por dia' },
    { value: 'rent_monthly', label: 'Aluguer mensal', sub: 'Aluguer de longa duração' },
  ],
}

type Phase =
  | { name: 'idle' | 'submitting' | 'publishing' }
  | { name: 'uploading'; done: number; total: number }
  | { name: 'error'; message: string }

export function ListingWizard({
  userId,
  mode,
  listingId,
  initial,
}: {
  userId: string
  mode: Mode
  listingId?: string
  initial?: Initial
}) {
  const router = useRouter()
  const [kind, setKind] = useState<ListingKind | null>(initial?.kind ?? null)
  const [purpose, setPurpose] = useState<ListingPurpose | null>(initial?.purpose ?? null)
  const [data, setData] = useState<WizardData>(initial?.data ?? {})
  const [files, setFiles] = useState<File[]>([])
  const [stepIdx, setStepIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [, startTransition] = useTransition()

  const set: Setter = (name, value) => setData((d) => ({ ...d, [name]: value }))

  // Steps — create has a Photos step, edit does not (photo management is separate).
  const steps = useMemo(
    () =>
      mode === 'create'
        ? (['tipo', 'basico', 'detalhes', 'fotos', 'preco', 'rever'] as const)
        : (['tipo', 'basico', 'detalhes', 'preco', 'rever'] as const),
    [mode],
  )
  const step = steps[stepIdx]
  const submitting =
    phase.name === 'submitting' || phase.name === 'uploading' || phase.name === 'publishing'

  // — Per-step validation —
  function stepError(): string | null {
    if (step === 'tipo') {
      if (!kind) return 'Escolhe imóvel ou automóvel.'
      if (!purpose) return 'Escolhe a finalidade.'
    }
    if (step === 'basico') {
      if (((data.title as string) ?? '').trim().length < 3)
        return 'O título precisa de pelo menos 3 caracteres.'
      if (!(data.location_island as string))
        return 'Escolhe a ilha.'
      if (!(data.location_municipality as string))
        return 'Escolhe o concelho.'
    }
    if (step === 'detalhes') {
      if (kind === 'property' && !(data.property_type as string))
        return 'Escolhe o tipo de imóvel.'
      if (kind === 'vehicle' && !(data.vehicle_type as string))
        return 'Escolhe o tipo de veículo.'
    }
    if (step === 'preco') {
      const p = Number(data.price_cve)
      if (!Number.isFinite(p) || p <= 0) return 'Indica um preço válido.'
    }
    return null
  }

  function next() {
    const err = stepError()
    if (err) { setPhase({ name: 'error', message: err }); return }
    setPhase({ name: 'idle' })
    setStepIdx((i) => Math.min(i + 1, steps.length - 1))
  }
  function back() {
    setPhase({ name: 'idle' })
    setStepIdx((i) => Math.max(i - 1, 0))
  }

  function buildInput(): ListingInput {
    const attributes = Object.fromEntries(
      Object.entries(data).filter(([k]) => !TOP_LEVEL.has(k)),
    )
    return {
      kind: kind!,
      purpose: purpose!,
      title: ((data.title as string) ?? '').trim(),
      description: ((data.description as string) ?? '').trim(),
      price_cve: Number(data.price_cve) || 0,
      location_island: (data.location_island as string) ?? '',
      location_municipality: ((data.location_municipality as string) ?? '').trim(),
      location_city: ((data.location_city as string) ?? '').trim(),
      latitude: data.latitude ? Number(data.latitude) : null,
      longitude: data.longitude ? Number(data.longitude) : null,
      contact_phone: ((data.contact_phone as string) ?? '').trim(),
      attributes,
    }
  }

  // — Final submit —
  async function handleSubmit() {
    const input = buildInput()

    if (mode === 'edit' && listingId) {
      setPhase({ name: 'submitting' })
      const res = await updateListing(listingId, input)
      if (!res.ok) { setPhase({ name: 'error', message: res.error }); return }
      router.push(`/listings/${listingId}`)
      router.refresh()
      return
    }

    // create
    setPhase({ name: 'submitting' })
    const res = await createListing(input)
    if (!res.ok) { setPhase({ name: 'error', message: res.error }); return }
    const newId = res.listingId

    if (files.length > 0) {
      setPhase({ name: 'uploading', done: 0, total: files.length })
      const supabase = createClient()
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${userId}/${newId}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('listings')
          .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
        if (upErr) {
          setPhase({ name: 'error', message: `Falha ao enviar foto ${i + 1}: ${upErr.message}` })
          return
        }
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(path)
        const att = await attachPhoto(newId, publicUrl, path, i)
        if (!att.ok) { setPhase({ name: 'error', message: att.error }); return }
        setPhase({ name: 'uploading', done: i + 1, total: files.length })
      }
    }

    setPhase({ name: 'publishing' })
    startTransition(async () => {
      try {
        await publishListing(newId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro inesperado.'
        if (msg.toLowerCase().includes('next_redirect')) { router.refresh(); return }
        setPhase({ name: 'error', message: msg })
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Progress — telemóvel: barra + label do passo atual. Desktop: lista completa. */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between text-[12px] text-text-2">
          <span className="font-medium text-ink">
            Passo {stepIdx + 1} de {steps.length}
          </span>
          <span className="uppercase tracking-[0.12em] text-text-3">
            {stepName(steps[stepIdx])}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-shell">
          <div
            className="h-full rounded-full bg-ink transition-all"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="hidden flex-wrap gap-x-2 gap-y-1 text-[11px] uppercase tracking-[0.14em] sm:flex">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={
                i === stepIdx
                  ? 'text-ink font-medium'
                  : i < stepIdx
                    ? 'text-text-3'
                    : 'text-text-3/50'
              }
            >
              {String(i + 1).padStart(2, '0')} {stepName(s)}
            </span>
            {i < steps.length - 1 && <span className="text-text-3/40">·</span>}
          </li>
        ))}
      </ol>

      {/* Step body */}
      <div className="min-h-[280px]">
        {step === 'tipo' && (
          <StepTipo
            kind={kind} purpose={purpose}
            onKind={(k) => { setKind(k); setPurpose(null) }}
            onPurpose={setPurpose}
          />
        )}

        {step === 'basico' && (
          <div className="space-y-5">
            <TextField
              data={data} set={set} name="title" label="Título" required maxLength={140}
              placeholder={
                kind === 'property'
                  ? 'Ex: Apartamento T2 luminoso com varanda'
                  : 'Ex: Toyota Corolla 2018 em excelente estado'
              }
            />
            <TextArea
              data={data} set={set} name="description" label="Descrição"
              placeholder="Estado, localização aproximada, condições, motivações…"
            />
            <LocationPicker data={data} set={set} />
          </div>
        )}

        {step === 'detalhes' && kind === 'property' && purpose && (
          <PropertyFields data={data} set={set} purpose={purpose} />
        )}
        {step === 'detalhes' && kind === 'vehicle' && purpose && (
          <VehicleFields data={data} set={set} purpose={purpose} />
        )}

        {step === 'fotos' && (
          <StepFotos files={files} setFiles={setFiles} />
        )}

        {step === 'preco' && purpose && (
          <StepPreco data={data} set={set} kind={kind!} purpose={purpose} />
        )}

        {step === 'rever' && (
          <StepRever data={data} kind={kind!} purpose={purpose!} fileCount={files.length} mode={mode} />
        )}
      </div>

      {/* Error / progress feedback */}
      {phase.name === 'error' && (
        <p className="rounded-md border border-coral/40 bg-coral-soft px-4 py-3 text-sm text-coral-deep">
          {phase.message}
        </p>
      )}
      {phase.name === 'uploading' && (
        <p className="rounded-md border border-shell bg-paper-soft px-4 py-3 text-sm text-text-2">
          A enviar foto {phase.done}/{phase.total}…
        </p>
      )}
      {phase.name === 'publishing' && (
        <p className="rounded-md border border-shell bg-paper-soft px-4 py-3 text-sm text-text-2">
          A publicar…
        </p>
      )}

      {/* Nav — no mobile fica sticky no fundo do ecrã para sempre acessível */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-shell bg-paper px-4 pb-4 pt-4 sm:static sm:mx-0 sm:border-t sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-6">
        <button
          type="button"
          onClick={back}
          disabled={stepIdx === 0 || submitting}
          className="rounded-full border border-shell px-4 py-3 text-sm text-text-2 transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 sm:py-2.5"
        >
          Voltar
        </button>

        {step !== 'rever' ? (
          <button
            type="button"
            onClick={next}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep sm:flex-initial"
          >
            Continuar <ArrowRightIcon className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-60 sm:flex-initial"
          >
            {submitting
              ? 'A guardar…'
              : mode === 'edit' ? 'Guardar alterações' : 'Publicar anúncio'}
            {!submitting && <CheckIcon className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function stepName(s: string): string {
  return {
    tipo: 'Tipo', basico: 'Básico', detalhes: 'Detalhes',
    fotos: 'Fotos', preco: 'Preço', rever: 'Rever',
  }[s] ?? s
}

/* — Step 1: Tipo — */
function StepTipo({
  kind, purpose, onKind, onPurpose,
}: {
  kind: ListingKind | null
  purpose: ListingPurpose | null
  onKind: (k: ListingKind) => void
  onPurpose: (p: ListingPurpose) => void
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-medium text-ink">O que vais anunciar?</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <KindCard
            active={kind === 'property'} onClick={() => onKind('property')}
            icon={<HouseIcon className="h-7 w-7" />} label="Imóvel"
            sub="Casa, apartamento, terreno, comercial"
          />
          <KindCard
            active={kind === 'vehicle'} onClick={() => onKind('vehicle')}
            icon={<CarIcon className="h-7 w-7" />} label="Automóvel"
            sub="Carro, mota, comercial, camião"
          />
        </div>
      </div>

      {kind && (
        <div>
          <h2 className="font-display text-xl font-medium text-ink">Para quê?</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PURPOSES_FOR[kind].map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPurpose(p.value)}
                className={`rounded-[var(--radius-card)] border p-4 text-left transition-all ${
                  purpose === p.value
                    ? 'border-ink bg-ink text-paper'
                    : 'border-shell bg-white hover:border-line-strong'
                }`}
              >
                <div className="font-display text-lg font-medium">{p.label}</div>
                <div
                  className={`mt-1 text-[12px] ${
                    purpose === p.value ? 'text-paper/70' : 'text-text-3'
                  }`}
                >
                  {p.sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KindCard({
  active, onClick, icon, label, sub,
}: {
  active: boolean; onClick: () => void
  icon: React.ReactNode; label: string; sub: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative overflow-hidden rounded-[var(--radius-card)] border p-5 text-left transition-all ${
        active
          ? 'border-ink shadow-[var(--shadow-card-hover)]'
          : 'border-shell hover:border-line-strong hover:shadow-[var(--shadow-card)]'
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
        active ? 'bg-ink text-paper' : 'bg-paper-soft text-ink'
      }`}>
        {icon}
      </div>
      <div className="mt-4 font-display text-xl font-medium text-ink">{label}</div>
      <div className="mt-1 text-[13px] text-text-2">{sub}</div>
      {active && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  )
}

/* — Step: Fotos — */
function StepFotos({
  files, setFiles,
}: {
  files: File[]; setFiles: (f: File[]) => void
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-medium text-ink">Fotos</h2>
      <label className="block cursor-pointer rounded-[var(--radius-card)] border-2 border-dashed border-shell bg-paper-soft px-6 py-12 text-center transition-colors hover:border-ink hover:bg-white">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="sr-only"
        />
        <span className="font-display text-lg text-ink">
          {files.length === 0
            ? 'Adicionar fotos'
            : `${files.length} foto${files.length === 1 ? '' : 's'} selecionada${files.length === 1 ? '' : 's'}`}
        </span>
        <span className="mt-1 block text-sm text-text-3">
          {files.length === 0
            ? 'JPG, PNG ou WebP. A primeira foto será a capa. Recomendado: 5+.'
            : 'Clica novamente para mudar a seleção.'}
        </span>
      </label>
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.slice(0, 10).map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-paper-soft px-3 py-1.5 text-[12px] text-text-2"
            >
              <span className="numeral text-text-3 tnum">{String(i + 1).padStart(2, '0')}</span>
              {f.name.length > 24 ? f.name.slice(0, 22) + '…' : f.name}
            </li>
          ))}
          {files.length > 10 && (
            <li className="inline-flex items-center rounded-full bg-paper-soft px-3 py-1.5 text-[12px] text-text-2">
              + {files.length - 10} mais
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

/* — Step: Preço e contacto — */
function StepPreco({
  data, set, kind, purpose,
}: {
  data: WizardData; set: Setter; kind: ListingKind; purpose: ListingPurpose
}) {
  const priceLabel =
    purpose === 'sale' ? 'Preço de venda'
      : purpose === 'rent_monthly' ? 'Renda mensal'
        : 'Preço por noite'

  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-medium text-ink">Preço e contacto</h2>

      <NumberField
        data={data} set={set} name="price_cve" label={priceLabel} required
        suffix="CVE" min={0} placeholder="0"
      />

      {purpose === 'rent_daily' && (
        <FieldGrid>
          <NumberField
            data={data} set={set} name="price_weekly_cve" label="Preço por semana"
            suffix="CVE" min={0} hint="Opcional — desconto para estadias longas."
          />
          {kind === 'property' && (
            <NumberField
              data={data} set={set} name="cleaning_fee_cve" label="Taxa de limpeza"
              suffix="CVE" min={0} hint="Cobrada uma vez por estadia."
            />
          )}
        </FieldGrid>
      )}

      {(purpose === 'rent_daily' || purpose === 'rent_monthly') && (
        <NumberField
          data={data} set={set} name="deposit_cve" label="Caução"
          suffix="CVE" min={0} hint="Valor devolvido no fim, se aplicável."
        />
      )}

      {purpose === 'sale' && (
        <ToggleField
          data={data} set={set} name="negotiable"
          label="Preço negociável"
          hint="Mostra um selo 'Negociável' no anúncio."
        />
      )}

      <Field label="Contacto WhatsApp / Telefone" hint="Recomendado — abre o WhatsApp com mensagem pronta.">
        <input
          type="tel"
          inputMode="tel"
          value={(data.contact_phone as string) ?? ''}
          onChange={(e) => set('contact_phone', e.target.value)}
          placeholder="+238 9XX XX XX"
          className="w-full rounded-lg border border-shell bg-white px-4 py-2.5 text-[15px] text-text-1 placeholder-text-3 outline-none transition-colors focus:border-ink"
        />
      </Field>
    </div>
  )
}

/* — Step: Rever — */
function StepRever({
  data, kind, purpose, fileCount, mode,
}: {
  data: WizardData; kind: ListingKind; purpose: ListingPurpose
  fileCount: number; mode: Mode
}) {
  const price = Number(data.price_cve) || 0
  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-medium text-ink">Rever e publicar</h2>
      <dl className="overflow-hidden rounded-[var(--radius-card)] border border-shell">
        <Row label="Tipo" value={`${kind === 'property' ? 'Imóvel' : 'Automóvel'} · ${purposeLabel(purpose)}`} />
        <Row label="Título" value={(data.title as string) || '—'} />
        <Row
          label="Localização"
          value={
            [
              data.location_island as string,
              data.location_municipality as string,
              data.location_city as string,
            ]
              .filter(Boolean)
              .join(' · ') || '—'
          }
        />
        <Row label="Preço" value={price > 0 ? formatCVE(price) : '—'} />
        {kind === 'property' && (
          <Row
            label="Imóvel"
            value={
              PROPERTY_TYPES.find((t) => t.value === data.property_type)?.label ?? '—'
            }
          />
        )}
        {kind === 'vehicle' && (
          <Row
            label="Veículo"
            value={
              [
                VEHICLE_TYPES.find((t) => t.value === data.vehicle_type)?.label,
                data.brand, data.model,
              ].filter(Boolean).join(' · ') || '—'
            }
          />
        )}
        {mode === 'create' && (
          <Row label="Fotos" value={fileCount > 0 ? `${fileCount} selecionada${fileCount === 1 ? '' : 's'}` : 'Nenhuma'} />
        )}
        <Row label="Contacto" value={(data.contact_phone as string) || 'Não fornecido'} />
      </dl>
      <p className="text-[12px] text-text-3">
        {mode === 'edit'
          ? 'As alterações ficam visíveis imediatamente.'
          : 'Ao publicar, o anúncio fica visível para qualquer pessoa.'}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-shell/70 px-4 py-3 text-sm last:border-0">
      <dt className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">{label}</dt>
      <dd className="col-span-2 text-text-1">{value}</dd>
    </div>
  )
}
