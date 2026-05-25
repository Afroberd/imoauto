import Link from 'next/link'
import Image from 'next/image'
import { getBookingsForPayments, type DashboardBooking } from '@/app/actions/dashboard'
import { RecordPaymentButton } from '@/components/dashboard/record-payment'
import { HouseIcon, CarIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

function formatCVE(n: number): string { return n.toLocaleString('pt-PT') + ' CVE' }

function payStatusBadge(s: string) {
  switch (s) {
    case 'paid':     return { label: 'Pago',     cls: 'bg-green-50 text-green-800 border-green-200' }
    case 'partial':  return { label: 'Parcial',  cls: 'bg-warn-soft text-warn-strong border-warn/40' }
    case 'unpaid':   return { label: 'Por pagar', cls: 'bg-coral/10 text-coral border-coral/30' }
    case 'refunded': return { label: 'Reembolsado', cls: 'bg-shell-soft text-text-2 border-shell' }
    default:         return { label: s, cls: 'bg-shell-soft text-text-2 border-shell' }
  }
}

export default async function DashboardPaymentsPage() {
  const bookings = await getBookingsForPayments()

  const totalDue = bookings.reduce((s, b) => s + (b.total_cve - b.paid_amount_cve), 0)
  const totalReceived = bookings.reduce((s, b) => s + b.paid_amount_cve, 0)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[12px] uppercase tracking-[0.12em] text-text-3">Total recebido</p>
          <p className="mt-2 font-display text-2xl text-ink tnum">{formatCVE(totalReceived)}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="text-[12px] uppercase tracking-[0.12em] text-text-3">Por receber</p>
          <p className="mt-2 font-display text-2xl text-warn-strong tnum">{formatCVE(totalDue)}</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-12 text-center">
          <p className="text-sm italic text-text-3">Sem reservas confirmadas ainda.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => <PaymentRow key={b.id} b={b} />)}
        </ul>
      )}
    </div>
  )
}

function PaymentRow({ b }: { b: DashboardBooking }) {
  const Icon = b.listing_kind === 'vehicle' ? CarIcon : HouseIcon
  const due = b.total_cve - b.paid_amount_cve
  const badge = payStatusBadge(b.payment_status)

  return (
    <li className="rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-shell">
          {b.listing_cover ? (
            <Image src={b.listing_cover} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><Icon className="h-5 w-5 text-text-3" /></div>
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
            {b.check_in} → {b.check_out}
          </p>
          <p className="mt-1 text-[13px]">
            <span className="text-text-2">Total: </span>
            <span className="font-medium text-ink tnum">{formatCVE(b.total_cve)}</span>
            <span className="mx-2 text-text-3">·</span>
            <span className="text-text-2">Recebido: </span>
            <span className="font-medium text-green-700 tnum">{formatCVE(b.paid_amount_cve)}</span>
            {due > 0 && (
              <>
                <span className="mx-2 text-text-3">·</span>
                <span className="text-text-2">Em falta: </span>
                <span className="font-medium text-warn-strong tnum">{formatCVE(due)}</span>
              </>
            )}
          </p>

          {due > 0 && b.status !== 'cancelled' && b.status !== 'declined' && (
            <div className="mt-3">
              <RecordPaymentButton bookingId={b.id} amountDue={due} />
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
