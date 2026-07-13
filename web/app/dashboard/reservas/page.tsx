import Link from 'next/link'
import Image from 'next/image'
import { getMyGuestBookings, type DashboardBooking } from '@/app/actions/dashboard'
import { BookingActions } from '@/components/booking-actions'
import { PaymentOptions } from '@/components/payment-options'
import { HouseIcon, CarIcon, CalendarIcon } from '@/components/icons'
import { STRIPE_ENABLED } from '@/lib/payments/stripe'
import { VINTI4_ENABLED } from '@/lib/payments/vinti4'

export const dynamic = 'force-dynamic'

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

function statusBadge(s: string): { label: string; cls: string } {
  switch (s) {
    case 'pending':     return { label: 'Pendente',                cls: 'bg-warn-soft text-warn-strong border-warn/40' }
    case 'confirmed':   return { label: 'Confirmada · paga já',    cls: 'bg-warn-soft text-warn-strong border-warn/40' }
    case 'paid':        return { label: 'Paga · à espera check-in', cls: 'bg-sky-soft text-ink border-sky/30' }
    case 'in_progress': return { label: 'Em curso',                cls: 'bg-green-50 text-green-800 border-green-200' }
    case 'completed':   return { label: 'Concluída',               cls: 'bg-shell-soft text-text-2 border-shell' }
    case 'declined':    return { label: 'Recusada',                cls: 'bg-shell-soft text-text-2 border-shell' }
    case 'cancelled':   return { label: 'Cancelada',               cls: 'bg-shell-soft text-text-2 border-shell' }
    default:            return { label: s,                          cls: 'bg-shell-soft text-text-2 border-shell' }
  }
}

export default async function MyReservationsPage() {
  const rows = await getMyGuestBookings()

  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-16 text-center">
        <CalendarIcon className="mx-auto h-10 w-10 text-text-3" />
        <h2 className="mt-3 font-display text-xl text-ink">Ainda não fizeste nenhuma reserva.</h2>
        <p className="mt-2 text-sm text-text-2">Explora anúncios de aluguer ao dia para fazeres a primeira.</p>
        <Link href="/listings?purpose=rent_daily"
          className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm text-paper hover:bg-ink-deep">
          Explorar alojamentos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-2">
        Tens <span className="font-medium text-ink">{rows.length}</span> {rows.length === 1 ? 'reserva' : 'reservas'}.
      </p>
      <ul className="space-y-3">
        {rows.map((b) => <GuestBookingCard key={b.id} b={b} />)}
      </ul>
    </div>
  )
}

function GuestBookingCard({ b }: { b: DashboardBooking }) {
  const Icon = b.listing_kind === 'vehicle' ? CarIcon : HouseIcon
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
            {b.check_in} → {b.check_out}
            <span className="mx-1.5 text-text-3">·</span>
            {nights} {nights === 1 ? 'noite' : 'noites'}
            <span className="mx-1.5 text-text-3">·</span>
            {b.guests} {b.guests === 1 ? 'hóspede' : 'hóspedes'}
            <span className="mx-1.5 text-text-3">·</span>
            <span className="font-medium text-ink tnum">{formatCVE(b.total_cve)}</span>
          </p>

          {b.message && (
            <p className="mt-2 text-[13px] italic text-text-2">&ldquo;{b.message}&rdquo;</p>
          )}

          {b.status === 'confirmed' && (
            <div className="mt-3">
              <PaymentOptions
                bookingId={b.id}
                totalCve={b.total_cve - b.paid_amount_cve}
                stripeEnabled={STRIPE_ENABLED}
                vinti4Enabled={VINTI4_ENABLED}
                simulationEnabled={process.env.PAYMENT_SIMULATION === 'true'}
              />
            </div>
          )}

          {b.status === 'paid' && (
            <p className="mt-2 text-[12px] text-green-700">
              ✓ Pagamento confirmado pelo anfitrião. Aguarda o dia do check-in.
            </p>
          )}

          {b.status === 'in_progress' && (
            <p className="mt-2 text-[12px] text-green-700">
              Estadia em curso. Boa estadia!
            </p>
          )}

          <div className="mt-3">
            <BookingActions
              bookingId={b.id}
              role="guest"
              status={b.status as 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'blocked'}
            />
          </div>
        </div>
      </div>
    </li>
  )
}
