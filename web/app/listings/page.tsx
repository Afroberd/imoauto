import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import { ArrowRightIcon, PlusIcon } from '@/components/icons'
import { CV_ISLANDS, LISTING_KINDS, type ListingKind } from '@/lib/listings/constants'
import type { Listing } from '@/lib/listings/types'

export const dynamic = 'force-dynamic'

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; island?: string; purpose?: string }>
}) {
  const sp = await searchParams
  const kindFilter = (LISTING_KINDS as readonly string[]).includes(sp.kind ?? '')
    ? (sp.kind as ListingKind)
    : null
  const islandFilter = (CV_ISLANDS as readonly string[]).includes(sp.island ?? '')
    ? sp.island
    : null
  const purposeFilter = ['sale', 'rent'].includes(sp.purpose ?? '') ? sp.purpose : null

  const supabase = await createClient()
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (kindFilter) query = query.eq('kind', kindFilter)
  if (islandFilter) query = query.eq('location_island', islandFilter)
  if (purposeFilter) query = query.eq('purpose', purposeFilter)

  const { data, error } = await query
  const listings = (data ?? []) as Listing[]

  const titleText = kindFilter === 'property'
    ? 'Imóveis'
    : kindFilter === 'vehicle'
      ? 'Automóveis'
      : 'Todos os anúncios'

  return (
    <main className="bg-paper">
      {/* Header */}
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            {listings.length} {listings.length === 1 ? 'anúncio' : 'anúncios'}
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-4xl font-medium tracking-[-0.02em] text-ink sm:text-5xl">
              {titleText}
              {islandFilter && (
                <span className="ml-3 italic text-ink-soft">— {islandFilter}</span>
              )}
            </h1>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-ink-deep"
            >
              <PlusIcon className="h-4 w-4" />
              Anunciar
            </Link>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-[64px] z-20 border-b border-shell/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3.5">
          <FilterGroup
            label="Tipo"
            current={kindFilter ?? 'all'}
            params={{ kind: null, island: islandFilter, purpose: purposeFilter }}
            options={[
              { value: 'all', label: 'Tudo', paramValue: null },
              { value: 'property', label: 'Imóveis', paramValue: 'property' },
              { value: 'vehicle', label: 'Automóveis', paramValue: 'vehicle' },
            ]}
            paramName="kind"
          />
          <span aria-hidden className="h-5 w-px bg-line" />
          <FilterGroup
            label="Finalidade"
            current={purposeFilter ?? 'all'}
            params={{ kind: kindFilter, island: islandFilter, purpose: null }}
            options={[
              { value: 'all', label: 'Todas', paramValue: null },
              { value: 'sale', label: 'Venda', paramValue: 'sale' },
              { value: 'rent', label: 'Aluguer', paramValue: 'rent' },
            ]}
            paramName="purpose"
          />
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        {error && (
          <p className="rounded-md border border-coral/40 bg-coral-soft px-4 py-3 text-sm text-coral-deep">
            Erro a carregar: {error.message}
          </p>
        )}

        {listings.length === 0 ? (
          <EmptyState kindFilter={kindFilter} islandFilter={islandFilter} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </main>
  )
}

function FilterGroup({
  label,
  current,
  options,
  params,
  paramName,
}: {
  label: string
  current: string
  options: { value: string; label: string; paramValue: string | null }[]
  params: Record<string, string | null | undefined>
  paramName: string
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-paper-soft p-1">
      <span className="px-2.5 text-[11px] uppercase tracking-[0.15em] text-text-3">
        {label}
      </span>
      {options.map((o) => {
        const next = { ...params, [paramName]: o.paramValue }
        const qs = Object.entries(next)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&')
        const href = qs ? `/listings?${qs}` : '/listings'
        const active = current === o.value
        return (
          <Link
            key={o.value}
            href={href}
            className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${
              active
                ? 'bg-ink text-paper'
                : 'text-text-2 hover:bg-white hover:text-ink'
            }`}
          >
            {o.label}
          </Link>
        )
      })}
    </div>
  )
}

function EmptyState({
  kindFilter,
  islandFilter,
}: {
  kindFilter: string | null
  islandFilter: string | null | undefined
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-20 text-center">
      <span className="numeral text-[44px] text-text-3 tnum">00</span>
      <h2 className="mt-2 font-display text-2xl text-ink">
        {kindFilter || islandFilter
          ? 'Nada por aqui ainda.'
          : 'O marketplace está a aquecer.'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-text-2">
        Sê dos primeiros a publicar. Os teus anúncios aparecem aqui em segundos.
      </p>
      <Link
        href="/listings/new"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
      >
        <PlusIcon className="h-4 w-4" />
        Criar primeiro anúncio
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  )
}
