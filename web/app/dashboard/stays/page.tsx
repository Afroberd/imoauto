import Link from 'next/link'
import Image from 'next/image'
import { getActiveAndUpcomingStays, type DashboardBooking } from '@/app/actions/dashboard'
import { CheckinButton, CheckoutButton } from '@/components/dashboard/stay-actions'
import { RecordPaymentButton } from '@/components/dashboard/record-payment'
import { HouseIcon, CarIcon, CalendarIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

function formatCVE(n: number): string { return n.toLocaleString('pt-PT') + ' CVE' }

function statusBadge(s: string): { label: string; cls: string } {
  switch (s) {
    case 'confirmed':   return { label: 'Confirmada · à espera de pagamento', cls: 'bg-warn-soft text-warn-strong border-warn/40' }
    case 'paid':        return { label: 'Paga · à espera de check-in',        cls: 'bg-sky-soft text-ink border-sky/30' }
    case 'in_progress': return { label: 'Em curso',                            cls: 'bg-green-50 text-green-800 border-green-200' }
    default:            return { label: s,                                     cls: 'bg-shell-soft text-text-2 border-shell' }
  }
}

export default async function DashboardStaysPage() {
  const stays = await getActiveAndUpcomingStays()

  const today = new Date().toISOString().slice(0, 10)
  const inProgress = stays.filter((s) => s.status === 'in_progress')
  const checkInToday = stays.filter((s) => s.status === 'paid' && s.check_in === today)
  const upcomingPaid = stays.filter((s) => s.status === 'paid' && s.check_in > today)
  const confirmedUnpaid = stays.filter((s) => s.status === 'confirmed')

  if (stays.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-16 text-center">
        <CalendarIcon className="mx-auto h-10 w-10 text-text-3" />
        <h2 className="mt-3 font-display text-xl text-ink">Sem estadias ativas.</h2>
        <p className="mt-2 text-sm text-text-2">
          As reservas aprovadas e pagas aparecem aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {inProgress.length > 0 && (
        <Section title={`Em curso (${inProgress.length})`}>
          {inProgress.map((b) => <StayCard key={b.id} b={b} actionType="checkout" />)}
        </Section>
      )}
      {checkInToday.length > 0 && (
        <Section title={`Check-in hoje (${checkInToday.length})`}>
          {checkInToday.map((b) => <StayCard key={b.id} b={b} actionType="checkin" />)}
        </Section>
      )}
      {upcomingPaid.length > 0 && (
        <Section title={`Pagas — futuras (${upcomingPaid.length})`}>
          {upcomingPaid.map((b) => <StayCard key={b.id} b={b} actionType="none" />)}
        </Section>
      )}
      {confirmedUnpaid.length > 0 && (
        <Section title={`Confirmadas — à espera de pagamento (${confirmedUnpaid.length})`}>
          {confirmedUnpaid.map((b) => <StayCard key={b.id} b={b} actionType="payment" />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">{title}</h2>
      <ul className="space-y-3">{children}</ul>
    </section>
  )
}

function StayCard({ b, actionType }: { b: DashboardBooking; actionType: 'checkin' | 'checkout' | 'payment' | 'none' }) {
  const Icon = b.listing_kind === 'vehicle' ? CarIcon : HouseIcon
  const isVehicle = b.listing_kind === 'vehicle'
  const badge = statusBadge(b.status)
  const nights = Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86_400_000)

  return (
    <li className="rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-shell">
          {b.listing_cover ? (
            <Image src={b.listing_cover} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Icon className="h-6 w-6 text-text-3" /></div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link href={`/listings/${b.listing_id}`} className="truncate text-sm font-medium text-ink hover:underline">
              {b.listing_title}
            </Link>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
          </div>

          <p className="mt-1 text-[13px] text-text-2">
            <span className="font-medium text-ink">{b.guest_name}</span>
            <span className="mx-1.5 text-text-3">·</span>
            <a href={`mailto:${b.guest_email}`} className="text-text-3 hover:text-ink hover:underline">{b.guest_email}</a>
          </p>
          <p className="text-[13px] text-text-2">
            {b.check_in} → {b.check_out}
            <span className="mx-1.5 text-text-3">·</span>{nights} {nights === 1 ? 'noite' : 'noites'}
            <span className="mx-1.5 text-text-3">·</span>{b.guests} {b.guests === 1 ? 'pessoa' : 'pessoas'}
            <span className="mx-1.5 text-text-3">·</span><span className="font-medium text-ink tnum">{formatCVE(b.total_cve)}</span>
            {b.paid_amount_cve > 0 && b.paid_amount_cve < b.total_cve && (
              <> <span className="mx-1.5 text-text-3">·</span><span className="text-warn-strong">Pago {formatCVE(b.paid_amount_cve)}</span></>
            )}
          </p>

          {b.checked_in_at && (
            <p className="mt-1 text-[12px] text-text-3">
              Check-in: {new Date(b.checked_in_at).toLocaleString('pt-PT')}
            </p>
          )}

          <div className="mt-3">
            {actionType === 'checkin'  && <CheckinButton  bookingId={b.id} isVehicle={isVehicle} />}
            {actionType === 'checkout' && <CheckoutButton bookingId={b.id} isVehicle={isVehicle} />}
            {actionType === 'payment'  && (
              <RecordPaymentButton bookingId={b.id} amountDue={b.total_cve - b.paid_amount_cve} />
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
