import Link from 'next/link'
import Image from 'next/image'
import { getDashboardData, type DashboardBooking } from '@/app/actions/dashboard'
import { CalendarIcon, MessageIcon, HouseIcon, CarIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

export default async function DashboardHomePage() {
  const { stats, recentRequests, todayCheckins, todayCheckouts, activeNow } = await getDashboardData()

  if (stats.totalListings === 0) {
    return <NoListings />
  }

  return (
    <div className="space-y-8">
      {/* Top stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pedidos por responder" value={stats.pendingRequests} accent={stats.pendingRequests > 0 ? 'warn' : 'neutral'} href="/dashboard/requests" />
        <Stat label="Check-ins hoje" value={stats.checkinsToday} accent="green" href="/dashboard/stays" />
        <Stat label="Check-outs hoje" value={stats.checkoutsToday} accent="coral" href="/dashboard/stays" />
        <Stat label="Estadias em curso" value={stats.activeStays} accent="neutral" href="/dashboard/stays" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Por receber pagamento" value={stats.unpaidConfirmed} accent={stats.unpaidConfirmed > 0 ? 'warn' : 'neutral'} href="/dashboard/payments" />
        <Stat label={`Ocupação (${stats.totalListings} anúncios)`} value={`${stats.occupiedListings}/${stats.totalListings}`} accent="neutral" />
        <Stat label="Receita este mês" value={formatCVE(stats.monthRevenueCve)} accent="green" />
      </div>

      {/* Today's actions */}
      <Panel title="Check-ins de hoje" empty="Nenhum check-in agendado para hoje.">
        {todayCheckins.length === 0 ? null : (
          <ul className="space-y-2">
            {todayCheckins.map((b) => <BookingRow key={b.id} b={b} action="checkin" />)}
          </ul>
        )}
      </Panel>

      <Panel title="Check-outs de hoje" empty="Nenhum check-out agendado para hoje.">
        {todayCheckouts.length === 0 ? null : (
          <ul className="space-y-2">
            {todayCheckouts.map((b) => <BookingRow key={b.id} b={b} action="checkout" />)}
          </ul>
        )}
      </Panel>

      <Panel title="Pedidos pendentes" empty="Sem pedidos por responder.">
        {recentRequests.length === 0 ? null : (
          <ul className="space-y-2">
            {recentRequests.map((b) => <BookingRow key={b.id} b={b} action="review" />)}
          </ul>
        )}
        {stats.pendingRequests > 5 && (
          <Link href="/dashboard/requests" className="mt-3 inline-block text-sm text-text-2 underline hover:text-ink">
            Ver todos os {stats.pendingRequests} pedidos →
          </Link>
        )}
      </Panel>

      <Panel title="Em curso agora" empty="Nenhuma estadia em curso.">
        {activeNow.length === 0 ? null : (
          <ul className="space-y-2">
            {activeNow.map((b) => <BookingRow key={b.id} b={b} action="view" />)}
          </ul>
        )}
      </Panel>
    </div>
  )
}

function Stat({
  label, value, accent, href,
}: {
  label: string
  value: number | string
  accent: 'neutral' | 'warn' | 'green' | 'coral'
  href?: string
}) {
  const ring = {
    neutral: 'border-shell',
    warn: 'border-warn/40 bg-warn-soft',
    green: 'border-green-200 bg-green-50',
    coral: 'border-coral/30 bg-coral/5',
  }[accent]

  const inner = (
    <div className={`rounded-[var(--radius-card)] border bg-white p-4 shadow-[var(--shadow-card)] ${ring}`}>
      <p className="text-[12px] uppercase tracking-[0.12em] text-text-3">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium text-ink tnum">{value}</p>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

function Panel({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasContent = !!children && (Array.isArray(children) ? children.length > 0 : true)
  return (
    <section className="rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">{title}</h2>
      <div className="mt-3">
        {hasContent ? children : <p className="text-sm italic text-text-3">{empty}</p>}
      </div>
    </section>
  )
}

function BookingRow({ b, action }: { b: DashboardBooking; action: 'review' | 'checkin' | 'checkout' | 'view' }) {
  const nights = Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86_400_000)
  const Icon = b.listing_kind === 'vehicle' ? CarIcon : HouseIcon

  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-card)] border border-shell bg-paper-soft p-3">
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-shell">
        {b.listing_cover ? (
          <Image src={b.listing_cover} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-5 w-5 text-text-3" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/listings/${b.listing_id}`} className="block truncate text-sm font-medium text-ink hover:underline">
          {b.listing_title}
        </Link>
        <p className="text-[12px] text-text-2">
          <span className="font-medium text-ink">{b.guest_name}</span>
          <span className="mx-1.5 text-text-3">·</span>
          {b.check_in} → {b.check_out} ({nights} {nights === 1 ? 'noite' : 'noites'})
          <span className="mx-1.5 text-text-3">·</span>
          {b.guests} {b.guests === 1 ? 'pessoa' : 'pessoas'}
        </p>
        {b.message && <p className="mt-1 truncate text-[12px] italic text-text-3">"{b.message}"</p>}
      </div>
      <div className="flex-shrink-0">
        <Link
          href={action === 'review' ? '/dashboard/requests' : '/dashboard/stays'}
          className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-deep"
        >
          {action === 'review' ? 'Responder' : action === 'checkin' ? 'Check-in' : action === 'checkout' ? 'Check-out' : 'Ver'}
        </Link>
      </div>
    </li>
  )
}

function NoListings() {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-20 text-center">
      <CalendarIcon className="mx-auto h-10 w-10 text-text-3" />
      <h2 className="mt-4 font-display text-2xl text-ink">Ainda não tens anúncios.</h2>
      <p className="mx-auto mt-2 max-w-md text-text-2">
        Cria o primeiro anúncio para começares a receber pedidos de reserva.
      </p>
      <Link
        href="/listings/new"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
      >
        Criar anúncio
      </Link>
    </div>
  )
}
