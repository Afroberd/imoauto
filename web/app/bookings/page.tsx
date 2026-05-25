import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CalendarIcon } from '@/components/icons'
import { BookingActions } from '@/components/booking-actions'

export const dynamic = 'force-dynamic'

interface BookingRow {
  id: string
  listing_id: string
  guest_id: string
  check_in: string
  check_out: string
  guests: number
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'blocked'
  total_cve: number
  message: string | null
  created_at: string
  listing: {
    id: string
    title: string
    cover_image_url: string | null
    owner_id: string
    location_island: string
  } | null
}

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

function statusLabel(s: BookingRow['status']): { label: string; cls: string } {
  switch (s) {
    case 'pending':   return { label: 'Pendente',  cls: 'bg-warn-soft text-warn-strong border-warn/40' }
    case 'confirmed': return { label: 'Confirmada', cls: 'bg-green-50 text-green-800 border-green-200' }
    case 'declined':  return { label: 'Recusada',  cls: 'bg-shell-soft text-text-2 border-shell' }
    case 'cancelled': return { label: 'Cancelada', cls: 'bg-shell-soft text-text-2 border-shell' }
    case 'blocked':   return { label: 'Bloqueada (interno)', cls: 'bg-sky-soft text-ink border-sky/30' }
  }
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const sp = await searchParams
  const view: 'guest' | 'owner' = sp.view === 'owner' ? 'owner' : 'guest'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/bookings${view === 'owner' ? '?view=owner' : ''}`)

  let rows: BookingRow[] = []
  if (view === 'guest') {
    const { data } = await supabase
      .from('bookings')
      .select('id, listing_id, guest_id, check_in, check_out, guests, status, total_cve, message, created_at, listing:listings(id, title, cover_image_url, owner_id, location_island)')
      .eq('guest_id', user.id)
      .neq('status', 'blocked')
      .order('check_in', { ascending: false })
    rows = (data ?? []) as unknown as BookingRow[]
  } else {
    // Owner view: bookings ON listings I own.
    const { data: myListings } = await supabase
      .from('listings')
      .select('id')
      .eq('owner_id', user.id)
    const ids = (myListings ?? []).map((l) => (l as { id: string }).id)
    if (ids.length > 0) {
      const { data } = await supabase
        .from('bookings')
        .select('id, listing_id, guest_id, check_in, check_out, guests, status, total_cve, message, created_at, listing:listings(id, title, cover_image_url, owner_id, location_island)')
        .in('listing_id', ids)
        .neq('status', 'blocked')
        .order('check_in', { ascending: false })
      rows = (data ?? []) as unknown as BookingRow[]
    }
  }

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-4xl px-5 py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.22em] text-text-3">
            <span className="h-px w-8 bg-line-strong" />
            Reservas
          </div>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-[-0.022em] text-ink sm:text-5xl">
            {view === 'owner' ? 'Pedidos recebidos' : 'As minhas reservas'}
          </h1>

          {/* View tabs */}
          <div className="mt-6 inline-flex gap-2 rounded-full border border-shell bg-white p-1 shadow-[var(--shadow-card)]">
            <TabLink href="/bookings" active={view === 'guest'}>Como hóspede</TabLink>
            <TabLink href="/bookings?view=owner" active={view === 'owner'}>Como anfitrião</TabLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-8">
        {rows.length === 0 ? (
          <EmptyState view={view} />
        ) : (
          <ul className="space-y-4">
            {rows.map((b) => (
              <li key={b.id}>
                <BookingCard b={b} role={view} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
        active ? 'bg-ink text-paper' : 'text-text-2 hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}

function BookingCard({ b, role }: { b: BookingRow; role: 'guest' | 'owner' }) {
  const s = statusLabel(b.status)
  const nights = Math.round(
    (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86_400_000,
  )
  return (
    <div className="rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-shell">
          {b.listing?.cover_image_url ? (
            <Image src={b.listing.cover_image_url} alt={b.listing.title} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CalendarIcon className="h-6 w-6 text-text-3" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {b.listing ? (
              <Link href={`/listings/${b.listing.id}`} className="truncate text-sm font-medium text-ink hover:underline">
                {b.listing.title}
              </Link>
            ) : (
              <span className="truncate text-sm italic text-text-3">Anúncio removido</span>
            )}
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${s.cls}`}>{s.label}</span>
          </div>

          <p className="mt-1 text-[13px] text-text-2">
            {b.check_in} → {b.check_out}
            <span className="mx-1.5 text-text-3">·</span>
            {nights} {nights === 1 ? 'noite' : 'noites'}
            <span className="mx-1.5 text-text-3">·</span>
            {b.guests} {b.guests === 1 ? 'hóspede' : 'hóspedes'}
          </p>

          {b.total_cve > 0 && (
            <p className="mt-1 text-[13px] text-ink tnum">Total: {formatCVE(b.total_cve)}</p>
          )}

          {b.message && (
            <p className="mt-2 text-[13px] italic text-text-2">"{b.message}"</p>
          )}

          <div className="mt-3">
            <BookingActions bookingId={b.id} role={role} status={b.status} />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ view }: { view: 'guest' | 'owner' }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-20 text-center">
      <CalendarIcon className="mx-auto h-10 w-10 text-text-3" />
      <h2 className="mt-4 font-display text-2xl text-ink">
        {view === 'owner' ? 'Sem pedidos.' : 'Sem reservas.'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-text-2">
        {view === 'owner'
          ? 'Quando alguém pedir uma reserva num dos teus anúncios, aparece aqui.'
          : 'Explora anúncios de alojamento ao dia para fazer a primeira reserva.'}
      </p>
      {view === 'guest' && (
        <Link
          href="/listings?purpose=rent_daily"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
        >
          Explorar alojamentos
        </Link>
      )}
    </div>
  )
}
