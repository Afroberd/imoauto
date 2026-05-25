import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CalendarIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

interface BookingRow {
  id: string
  listing_id: string
  check_in: string
  check_out: string
  status: 'pending' | 'confirmed' | 'paid' | 'in_progress' | 'completed' | 'declined' | 'cancelled' | 'blocked'
  guest_id: string
}

interface ListingLite {
  id: string
  title: string
  kind: 'property' | 'vehicle'
  purpose: string
}

function monthDays(year: number, month0: number): Date[] {
  const last = new Date(year, month0 + 1, 0).getDate()
  return Array.from({ length: last }, (_, i) => new Date(year, month0, i + 1))
}

function startWeekday(year: number, month0: number): number {
  // Monday = 0
  const d = new Date(year, month0, 1).getDay() // Sun=0
  return (d + 6) % 7
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dateInRange(iso: string, ci: string, co: string): boolean {
  return iso >= ci && iso < co
}

function cellState(iso: string, bookings: BookingRow[]): { color: string; label: string } | null {
  const hit = bookings.find((b) => dateInRange(iso, b.check_in, b.check_out))
  if (!hit) return null
  switch (hit.status) {
    case 'in_progress': return { color: 'bg-green-500',  label: 'Ocupado' }
    case 'paid':        return { color: 'bg-sky-500',    label: 'Pago, à espera de check-in' }
    case 'confirmed':   return { color: 'bg-amber-400',  label: 'Confirmado, à espera de pagamento' }
    case 'pending':     return { color: 'bg-amber-300',  label: 'Pedido pendente' }
    case 'blocked':     return { color: 'bg-zinc-700',   label: 'Bloqueado pelo anfitrião' }
    default:            return null
  }
}

export default async function DashboardCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const sp = await searchParams
  const now = new Date()
  const month0 = sp.month ? Math.max(0, Math.min(11, parseInt(sp.month) - 1)) : now.getMonth()
  const year = sp.year ? parseInt(sp.year) : now.getFullYear()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's rent_daily listings (calendar only makes sense for these)
  const { data: listingsData } = await supabase
    .from('listings')
    .select('id, title, kind, purpose')
    .eq('owner_id', user.id)
    .eq('purpose', 'rent_daily')
    .order('created_at', { ascending: false })

  const listings = (listingsData ?? []) as ListingLite[]

  // Fetch all bookings on these listings for the displayed month
  const firstDay = new Date(year, month0, 1)
  const lastDay = new Date(year, month0 + 1, 0)
  const monthStart = toISO(firstDay)
  const monthEnd = toISO(lastDay)

  let bookingsByListing: Record<string, BookingRow[]> = {}
  if (listings.length > 0) {
    const ids = listings.map((l) => l.id)
    const { data: bk } = await supabase
      .from('bookings')
      .select('id, listing_id, check_in, check_out, status, guest_id')
      .in('listing_id', ids)
      .lte('check_in', monthEnd)
      .gte('check_out', monthStart)
    const rows = (bk ?? []) as BookingRow[]
    for (const row of rows) {
      (bookingsByListing[row.listing_id] ||= []).push(row)
    }
  }

  const days = monthDays(year, month0)
  const startPad = startWeekday(year, month0)
  const todayISO = toISO(new Date())

  const monthLabel = new Date(year, month0, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  const prev = month0 === 0 ? { m: 12, y: year - 1 } : { m: month0, y: year }
  const next = month0 === 11 ? { m: 1, y: year + 1 } : { m: month0 + 2, y: year }

  if (listings.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-16 text-center">
        <CalendarIcon className="mx-auto h-10 w-10 text-text-3" />
        <h2 className="mt-3 font-display text-xl text-ink">Calendário só está disponível para alojamento ao dia.</h2>
        <p className="mt-2 text-sm text-text-2">
          Cria um anúncio com aluguer diário ou muda a finalidade de um existente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-medium capitalize text-ink">{monthLabel}</h2>
        <div className="flex gap-2">
          <Link href={`/dashboard/calendar?month=${prev.m}&year=${prev.y}`}
            className="rounded-full border border-shell bg-white px-3 py-1.5 text-sm text-text-2 hover:border-ink hover:text-ink">
            ← Mês anterior
          </Link>
          <Link href={`/dashboard/calendar?month=${now.getMonth() + 1}&year=${now.getFullYear()}`}
            className="rounded-full border border-shell bg-white px-3 py-1.5 text-sm text-text-2 hover:border-ink hover:text-ink">
            Hoje
          </Link>
          <Link href={`/dashboard/calendar?month=${next.m}&year=${next.y}`}
            className="rounded-full border border-shell bg-white px-3 py-1.5 text-sm text-text-2 hover:border-ink hover:text-ink">
            Mês seguinte →
          </Link>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[12px] text-text-2">
        <Legend color="bg-green-500" label="Ocupado" />
        <Legend color="bg-sky-500"   label="Pago — à espera check-in" />
        <Legend color="bg-amber-400" label="Confirmado — à espera pagamento" />
        <Legend color="bg-amber-300" label="Pedido pendente" />
        <Legend color="bg-zinc-700"  label="Bloqueado" />
        <Legend color="bg-white border border-shell" label="Livre" />
      </div>

      {/* Per-listing calendars */}
      {listings.map((l) => {
        const rows = bookingsByListing[l.id] ?? []
        return (
          <section key={l.id} className="rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium text-ink">
                <Link href={`/listings/${l.id}`} className="hover:underline">{l.title}</Link>
              </h3>
              <span className="text-[11px] uppercase tracking-[0.12em] text-text-3">{l.kind === 'vehicle' ? 'Veículo' : 'Imóvel'}</span>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-[11px]">
              {['S','T','Q','Q','S','S','D'].map((d, i) => (
                <div key={i} className="text-center font-medium text-text-3">{d}</div>
              ))}
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((d) => {
                const iso = toISO(d)
                const s = cellState(iso, rows)
                const isToday = iso === todayISO
                return (
                  <div
                    key={iso}
                    title={s ? `${iso} — ${s.label}` : `${iso} — Livre`}
                    className={`relative h-10 rounded-md border ${isToday ? 'border-ink' : 'border-shell'} ${s ? s.color : 'bg-white'} flex items-center justify-center`}
                  >
                    <span className={`text-[11px] tnum ${s ? 'text-white font-medium' : 'text-text-2'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${color}`} />
      {label}
    </span>
  )
}
