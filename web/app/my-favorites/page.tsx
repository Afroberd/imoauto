import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing-card'
import { HeartIcon, SearchIcon } from '@/components/icons'
import type { Listing } from '@/lib/listings/types'

export const dynamic = 'force-dynamic'

export default async function MyFavoritesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/my-favorites')

  // Fetch favorites ordered by when they were saved, joined with the listing data.
  const { data: rows } = await supabase
    .from('favorites')
    .select('listing_id, listing:listings(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Filter out any null listings (deleted listings cascade from favorites, but be safe).
  const listings = (rows ?? [])
    .map((r) => (r as { listing_id: string; listing: unknown }).listing)
    .filter((l): l is Listing => l != null && typeof l === 'object')

  const favIds = new Set(listings.map((l) => l.id))

  return (
    <main className="bg-paper">
      {/* Header */}
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-text-3 sm:tracking-[0.22em]">
            <span className="h-px w-8 bg-line-strong" />
            Os meus favoritos
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl md:text-5xl">
              Guardados
            </h1>
            <Link
              href="/listings"
              className="inline-flex items-center gap-1.5 rounded-full border border-shell bg-white px-4 py-2 text-sm text-text-2 transition-colors hover:border-ink hover:text-ink"
            >
              <SearchIcon className="h-4 w-4" />
              Explorar anúncios
            </Link>
          </div>

          {/* Count chip */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-shell bg-white px-3 py-1.5 text-[12px] text-text-2 shadow-[var(--shadow-card)]">
            <HeartIcon filled className="h-3.5 w-3.5 text-coral" />
            <span className="tnum">{listings.length}</span>
            <span>{listings.length === 1 ? 'anúncio guardado' : 'anúncios guardados'}</span>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-5 sm:py-12">
        {listings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} isFavorited={favIds.has(l.id)} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-20 text-center">
      <HeartIcon className="mx-auto h-10 w-10 text-text-3" />
      <h2 className="mt-4 font-display text-2xl text-ink">
        Ainda não guardaste nada.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-text-2">
        Carrega no coração em qualquer anúncio para o guardar aqui.
      </p>
      <Link
        href="/listings"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
      >
        <SearchIcon className="h-4 w-4" />
        Explorar anúncios
      </Link>
    </div>
  )
}
