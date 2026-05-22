import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCVE, purposeLabel } from '@/lib/listings/constants'
import type { Listing } from '@/lib/listings/types'
import { setListingStatus } from '@/app/actions/listings'
import { PlusIcon, PinIcon, HouseIcon, CarIcon } from '@/components/icons'
import { DeleteListingButton } from '@/components/delete-listing-button'

export const dynamic = 'force-dynamic'

export default async function MyListingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/my-listings')

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  const listings = (data ?? []) as Listing[]

  const stats = {
    total: listings.length,
    published: listings.filter((l) => l.status === 'published').length,
    draft: listings.filter((l) => l.status === 'draft').length,
  }

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Painel
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-4xl font-medium tracking-[-0.022em] text-ink sm:text-5xl">
              Os meus anúncios
            </h1>
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
            >
              <PlusIcon className="h-4 w-4" />
              Novo anúncio
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-card)] border border-shell bg-shell">
            <Stat num={stats.total} label="Total" />
            <Stat num={stats.published} label="Publicados" tone="success" />
            <Stat num={stats.draft} label="Rascunhos" tone="muted" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12">
        {error && (
          <p className="rounded-md border border-coral/40 bg-coral-soft px-4 py-3 text-sm text-coral-deep">
            Erro: {error.message}
          </p>
        )}

        {listings.length === 0 ? (
          <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-20 text-center">
            <span className="numeral text-[44px] text-text-3 tnum">00</span>
            <h2 className="mt-2 font-display text-2xl text-ink">
              Ainda não publicaste nada.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-text-2">
              O teu primeiro anúncio leva menos de um minuto.
            </p>
            <Link
              href="/listings/new"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
            >
              <PlusIcon className="h-4 w-4" />
              Criar primeiro anúncio
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {listings.map((l) => (
              <ListingRow key={l.id} listing={l} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function Stat({
  num, label, tone,
}: {
  num: number; label: string; tone?: 'success' | 'muted'
}) {
  const color =
    tone === 'success' ? 'text-ink' : tone === 'muted' ? 'text-text-3' : 'text-ink'
  return (
    <div className="bg-white p-5">
      <div className={`font-display text-4xl font-medium tnum ${color}`}>{num}</div>
      <div className="mt-1 text-[12px] uppercase tracking-[0.15em] text-text-3">
        {label}
      </div>
    </div>
  )
}

function ListingRow({ listing }: { listing: Listing }) {
  const l = listing
  return (
    <li className="overflow-hidden rounded-[var(--radius-card)] border border-shell bg-white shadow-[var(--shadow-card)] transition-colors hover:border-line-strong">
      <div className="flex items-center gap-4 px-4 py-4">
        <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-md bg-paper-soft">
          {l.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.cover_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-soft">
              {l.kind === 'property' ? <HouseIcon className="h-6 w-6" /> : <CarIcon className="h-6 w-6" />}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/listings/${l.id}`} className="block truncate font-display text-lg font-medium text-ink hover:underline">
            {l.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
            <StatusBadge status={l.status} />
            <span className="text-text-2 tnum">{formatCVE(l.price_cve)}</span>
            <span className="text-text-3">·</span>
            <span className="inline-flex items-center gap-1 text-text-2">
              <PinIcon className="h-3 w-3 text-text-3" />
              {l.location_island}
            </span>
            <span className="text-text-3">·</span>
            <span className="text-text-3">{purposeLabel(l.purpose)}</span>
          </div>
        </div>
        {(l.status === 'published' || l.status === 'paused') && (
          <form action={setListingStatus} className="hidden sm:block">
            <input type="hidden" name="id" value={l.id} />
            <input
              type="hidden"
              name="status"
              value={l.status === 'published' ? 'paused' : 'published'}
            />
            <button
              type="submit"
              className="rounded-full border border-shell px-3 py-1.5 text-[12px] text-text-2 transition-colors hover:border-ink hover:text-ink"
            >
              {l.status === 'published' ? 'Pausar' : 'Republicar'}
            </button>
          </form>
        )}
        <Link
          href={`/listings/${l.id}/edit`}
          className="rounded-full border border-shell px-3 py-1.5 text-[12px] text-text-2 transition-colors hover:border-ink hover:text-ink"
        >
          Editar
        </Link>
        <DeleteListingButton id={l.id} title={l.title} />
      </div>
    </li>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    draft: { cls: 'bg-paper-soft text-text-2 border border-shell', label: 'Rascunho' },
    published: { cls: 'bg-success-soft text-success border border-success/30', label: 'Publicado' },
    sold: { cls: 'bg-ink/10 text-ink border border-ink/20', label: 'Vendido' },
    rented: { cls: 'bg-coral-soft text-coral-deep border border-coral/30', label: 'Alugado' },
    archived: { cls: 'bg-paper-soft text-text-3 border border-shell', label: 'Arquivado' },
  }
  const s = map[status] ?? map.draft
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${s.cls}`}>{s.label}</span>
}
