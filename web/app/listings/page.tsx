import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import ListingsMap from '@/components/listings-map-client'
import { ArrowRightIcon, PlusIcon, SearchIcon } from '@/components/icons'
import {
  CV_ISLANDS,
  LISTING_KINDS,
  type ListingKind,
} from '@/lib/listings/constants'
import type { Listing } from '@/lib/listings/types'

export const dynamic = 'force-dynamic'

/**
 * Clean a free-text search term before it goes into a PostgREST `.or()` filter.
 * Commas and parentheses are PostgREST syntax separators; `%`, `_`, `*` and `\`
 * are LIKE wildcards/escapes. Left raw, a query like "T2, Praia" would break the
 * filter (400 error). We replace them with spaces and cap the length.
 */
function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()%_*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

type Params = {
  kind?: string
  island?: string
  purpose?: string
  q?: string
  min?: string
  max?: string
  view?: string
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<Params>
}) {
  const sp = await searchParams
  const kindFilter = (LISTING_KINDS as readonly string[]).includes(sp.kind ?? '')
    ? (sp.kind as ListingKind)
    : null
  const islandFilter = (CV_ISLANDS as readonly string[]).includes(sp.island ?? '')
    ? sp.island
    : null
  const purposeFilter = ['sale', 'rent_monthly', 'rent_daily'].includes(sp.purpose ?? '')
    ? sp.purpose
    : null
  const q = sanitizeSearch(sp.q ?? '')
  const minPrice = sp.min ? Number(sp.min) : null
  const maxPrice = sp.max ? Number(sp.max) : null
  const view = sp.view === 'map' ? 'map' : 'grid'

  const supabase = await createClient()
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (kindFilter) query = query.eq('kind', kindFilter)
  if (islandFilter) query = query.eq('location_island', islandFilter)
  if (purposeFilter) query = query.eq('purpose', purposeFilter)
  if (minPrice && Number.isFinite(minPrice)) query = query.gte('price_cve', minPrice)
  if (maxPrice && Number.isFinite(maxPrice)) query = query.lte('price_cve', maxPrice)
  if (q.length > 0) {
    const term = `%${q}%`
    query = query.or(`title.ilike.${term},description.ilike.${term}`)
  }

  const { data, error } = await query
  const listings = (data ?? []) as Listing[]

  const titleText = kindFilter === 'property'
    ? 'Imóveis'
    : kindFilter === 'vehicle'
      ? 'Automóveis'
      : 'Todos os anúncios'

  // Preserve current params when building filter links
  const baseParams = {
    kind: kindFilter,
    island: islandFilter,
    purpose: purposeFilter,
    q: q || null,
    min: minPrice ? String(minPrice) : null,
    max: maxPrice ? String(maxPrice) : null,
  }

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

          {/* Search + price form */}
          <form
            action="/listings"
            method="GET"
            className="mt-8 flex flex-col gap-3 rounded-2xl border border-shell bg-white p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-stretch"
          >
            {/* preserve type filters via hidden inputs */}
            {kindFilter && <input type="hidden" name="kind" value={kindFilter} />}
            {islandFilter && <input type="hidden" name="island" value={islandFilter} />}
            {purposeFilter && <input type="hidden" name="purpose" value={purposeFilter} />}
            {view === 'map' && <input type="hidden" name="view" value="map" />}

            <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 sm:px-4">
              <SearchIcon className="h-4 w-4 text-text-3" />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Procurar por título ou descrição…"
                className="w-full bg-transparent text-sm text-text-1 outline-none placeholder:text-text-3"
              />
            </label>

            <span aria-hidden className="hidden w-px self-stretch bg-line sm:block" />

            <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
              <span className="text-[11px] uppercase tracking-[0.15em] text-text-3">Preço</span>
              <input
                type="number"
                name="min"
                defaultValue={minPrice ?? ''}
                placeholder="min"
                className="w-24 bg-transparent text-sm text-text-1 outline-none tnum placeholder:text-text-3"
              />
              <span className="text-text-3">—</span>
              <input
                type="number"
                name="max"
                defaultValue={maxPrice ?? ''}
                placeholder="max"
                className="w-24 bg-transparent text-sm text-text-1 outline-none tnum placeholder:text-text-3"
              />
              <span className="text-[11px] uppercase tracking-[0.15em] text-text-3">CVE</span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep"
            >
              Aplicar
            </button>
          </form>
        </div>
      </section>

      {/* Filter bar + view toggle */}
      <section className="sticky top-[64px] z-20 border-b border-shell/70 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 py-3.5">
          <FilterGroup
            label="Tipo"
            current={kindFilter ?? 'all'}
            params={{ ...baseParams, kind: null, view }}
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
            params={{ ...baseParams, purpose: null, view }}
            options={[
              { value: 'all', label: 'Todas', paramValue: null },
              { value: 'sale', label: 'Venda', paramValue: 'sale' },
              { value: 'rent_monthly', label: 'Mensal', paramValue: 'rent_monthly' },
              { value: 'rent_daily', label: 'Diário', paramValue: 'rent_daily' },
            ]}
            paramName="purpose"
          />
          <span aria-hidden className="h-5 w-px bg-line" />
          <IslandFilter current={islandFilter ?? null} params={{ ...baseParams, island: null, view }} />

          <div className="ml-auto">
            <ViewToggle current={view} params={baseParams} />
          </div>
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
          <EmptyState hasFilters={!!(kindFilter || islandFilter || purposeFilter || q || minPrice || maxPrice)} />
        ) : view === 'map' ? (
          <ListingsMap listings={listings} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </main>
  )
}

function buildHref(base: Record<string, string | null | undefined>): string {
  const qs = Object.entries(base)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  return qs ? `/listings?${qs}` : '/listings'
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
        const href = buildHref({ ...params, [paramName]: o.paramValue })
        const active = current === o.value
        return (
          <Link
            key={o.value}
            href={href}
            className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${
              active ? 'bg-ink text-paper' : 'text-text-2 hover:bg-white hover:text-ink'
            }`}
          >
            {o.label}
          </Link>
        )
      })}
    </div>
  )
}

function IslandFilter({
  current,
  params,
}: {
  current: string | null
  params: Record<string, string | null | undefined>
}) {
  return (
    <details className="relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-2 rounded-full px-3 py-1.5 text-[13px] transition-colors ${
          current
            ? 'bg-ink text-paper'
            : 'bg-paper-soft text-text-2 hover:bg-white hover:text-ink'
        }`}
      >
        <span className="text-[11px] uppercase tracking-[0.15em] opacity-70">Ilha</span>
        <span>{current ?? 'Todas'}</span>
        <span aria-hidden className="text-[10px] opacity-60">▼</span>
      </summary>
      <div className="absolute left-0 top-[calc(100%+4px)] z-30 min-w-[180px] overflow-hidden rounded-lg border border-shell bg-white p-1 shadow-[var(--shadow-pop)]">
        <Link
          href={buildHref({ ...params, island: null })}
          className="block rounded px-3 py-1.5 text-[13px] text-text-2 hover:bg-paper-soft hover:text-ink"
        >
          Todas
        </Link>
        {CV_ISLANDS.map((island) => (
          <Link
            key={island}
            href={buildHref({ ...params, island })}
            className={`block rounded px-3 py-1.5 text-[13px] hover:bg-paper-soft ${
              current === island ? 'text-ink font-medium' : 'text-text-2 hover:text-ink'
            }`}
          >
            {island}
          </Link>
        ))}
      </div>
    </details>
  )
}

function ViewToggle({
  current,
  params,
}: {
  current: string
  params: Record<string, string | null | undefined>
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-paper-soft p-1">
      <Link
        href={buildHref({ ...params, view: null })}
        className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${
          current === 'grid' ? 'bg-ink text-paper' : 'text-text-2 hover:bg-white hover:text-ink'
        }`}
      >
        Lista
      </Link>
      <Link
        href={buildHref({ ...params, view: 'map' })}
        className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${
          current === 'map' ? 'bg-ink text-paper' : 'text-text-2 hover:bg-white hover:text-ink'
        }`}
      >
        Mapa
      </Link>
    </div>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-20 text-center">
      <span className="numeral text-[44px] text-text-3 tnum">00</span>
      <h2 className="mt-2 font-display text-2xl text-ink">
        {hasFilters
          ? 'Nenhum anúncio bate com a tua pesquisa.'
          : 'O marketplace está a aquecer.'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-text-2">
        {hasFilters
          ? 'Tenta limpar alguns filtros ou alargar a faixa de preço.'
          : 'Sê dos primeiros a publicar. Os teus anúncios aparecem aqui em segundos.'}
      </p>
      {hasFilters ? (
        <Link
          href="/listings"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-shell bg-white px-5 py-2.5 text-sm text-ink transition-colors hover:border-ink"
        >
          Limpar filtros
        </Link>
      ) : (
        <Link
          href="/listings/new"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
        >
          <PlusIcon className="h-4 w-4" />
          Criar primeiro anúncio
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
