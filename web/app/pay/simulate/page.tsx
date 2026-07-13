import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SimulatePayButton } from '@/components/simulate-pay-button'

export const metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

/**
 * Simulated payment gateway page (test mode). Mirrors the future Vinti4
 * redirect flow: the guest reviews the amount and confirms. Replaced by the
 * real SISP gateway once credentials arrive.
 */
export default async function SimulatePayPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>
}) {
  if (process.env.PAYMENT_SIMULATION !== 'true') notFound()

  const { booking: bookingId } = await searchParams
  if (!bookingId) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/pay/simulate?booking=${bookingId}`)

  const { data } = await supabase
    .from('bookings')
    .select('id, guest_id, status, total_cve, paid_amount_cve, check_in, check_out, listing:listings(title)')
    .eq('id', bookingId)
    .maybeSingle()

  const b = data as unknown as {
    id: string; guest_id: string; status: string
    total_cve: number; paid_amount_cve: number
    check_in: string; check_out: string
    listing: { title: string } | null
  } | null
  if (!b || b.guest_id !== user.id) notFound()

  const due = b.total_cve - (b.paid_amount_cve ?? 0)
  const payable = b.status === 'confirmed' && due > 0

  return (
    <main className="bg-paper">
      <div className="mx-auto max-w-lg px-5 py-12">
        <div className="rounded-full bg-amber-100 px-4 py-2 text-center text-[12px] font-medium uppercase tracking-[0.14em] text-amber-800">
          Modo de teste — nenhum pagamento real será cobrado
        </div>

        <div className="mt-6 rounded-[var(--radius-card)] border border-shell bg-white p-6 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-2xl font-medium text-ink">Pagamento da reserva</h1>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-3">Anúncio</dt>
              <dd className="text-ink">{b.listing?.title ?? 'Anúncio'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-3">Datas</dt>
              <dd className="text-ink tnum">{b.check_in} → {b.check_out}</dd>
            </div>
            <div className="flex justify-between border-t border-shell pt-2">
              <dt className="font-medium text-ink">Total a pagar</dt>
              <dd className="font-display text-xl font-medium text-ink tnum">{formatCVE(due)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            {payable ? (
              <SimulatePayButton bookingId={b.id} amountLabel={formatCVE(due)} />
            ) : (
              <p className="rounded-xl bg-paper-soft px-4 py-3 text-sm text-text-2">
                Esta reserva não está pagável neste momento (estado: {b.status}).
              </p>
            )}
          </div>

          <p className="mt-4 text-[12px] leading-relaxed text-text-3">
            Quando o Vinti4 estiver ativo, esta página é substituída pela página segura
            da rede vinti4 (Vinti4, Visa e Mastercard).
          </p>
        </div>
      </div>
    </main>
  )
}
