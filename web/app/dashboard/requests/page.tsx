import Link from 'next/link'
import Image from 'next/image'
import { getPendingRequests, type DashboardBooking } from '@/app/actions/dashboard'
import { BookingActions } from '@/components/booking-actions'
import { KindFilter } from '@/components/dashboard/kind-filter'
import { HouseIcon, CarIcon, MessageIcon } from '@/components/icons'

export const dynamic = 'force-dynamic'

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

export default async function DashboardRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>
}) {
  const { kind } = await searchParams
  const all = await getPendingRequests()
  const counts = {
    all: all.length,
    property: all.filter((b) => b.listing_kind !== 'vehicle').length,
    vehicle: all.filter((b) => b.listing_kind === 'vehicle').length,
  }
  const requests =
    kind === 'property' ? all.filter((b) => b.listing_kind !== 'vehicle')
    : kind === 'vehicle' ? all.filter((b) => b.listing_kind === 'vehicle')
    : all

  if (all.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft px-6 py-16 text-center">
        <MessageIcon className="mx-auto h-10 w-10 text-text-3" />
        <h2 className="mt-3 font-display text-xl text-ink">Sem pedidos por responder.</h2>
        <p className="mt-2 text-sm text-text-2">
          Quando alguém pedir reserva num dos teus anúncios, aparece aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <KindFilter counts={counts} />
      <p className="text-sm text-text-2">
        Tens <span className="font-medium text-ink">{requests.length}</span> {requests.length === 1 ? 'pedido' : 'pedidos'} à espera de resposta.
      </p>
      <ul className="space-y-3">
        {requests.map((b) => <RequestCard key={b.id} b={b} />)}
      </ul>
    </div>
  )
}

function RequestCard({ b }: { b: DashboardBooking }) {
  const nights = Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86_400_000)
  const Icon = b.listing_kind === 'vehicle' ? CarIcon : HouseIcon
  return (
    <li className="rounded-[var(--radius-card)] border border-shell bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-shell">
          {b.listing_cover ? (
            <Image src={b.listing_cover} alt="" fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-6 w-6 text-text-3" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Link href={`/listings/${b.listing_id}`} className="truncate text-sm font-medium text-ink hover:underline">
              {b.listing_title}
            </Link>
            <span className="rounded-full border border-warn/40 bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn-strong">
              Pendente
            </span>
          </div>

          <div className="mt-1 text-[13px] text-text-2">
            <p>
              <span className="font-medium text-ink">{b.guest_name}</span>
              <span className="mx-1.5 text-text-3">·</span>
              <a href={`mailto:${b.guest_email}`} className="text-text-3 hover:text-ink hover:underline">
                {b.guest_email}
              </a>
            </p>
            <p className="mt-1">
              {b.check_in} → {b.check_out}
              <span className="mx-1.5 text-text-3">·</span>
              {nights} {nights === 1 ? 'noite' : 'noites'}
              <span className="mx-1.5 text-text-3">·</span>
              {b.guests} {b.guests === 1 ? 'pessoa' : 'pessoas'}
              <span className="mx-1.5 text-text-3">·</span>
              <span className="font-medium text-ink tnum">{formatCVE(b.total_cve)}</span>
            </p>
            {b.host_payout_cve > 0 && (
              <p className="mt-0.5 text-[12px] text-text-3">
                Recebes <span className="font-medium text-green-700 tnum">{formatCVE(b.host_payout_cve)}</span>{' '}
                · após comissão de serviço (10%)
              </p>
            )}
          </div>

          {b.message && (
            <p className="mt-2 rounded-[var(--radius-card)] bg-paper-soft px-3 py-2 text-[13px] italic text-text-1">
              "{b.message}"
            </p>
          )}

          <div className="mt-3">
            <BookingActions bookingId={b.id} role="owner" status="pending" />
          </div>
        </div>
      </div>
    </li>
  )
}
