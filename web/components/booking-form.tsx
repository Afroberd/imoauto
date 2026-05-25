'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createBooking } from '@/app/actions/bookings'
import { CalendarIcon } from '@/components/icons'
import { DateInput } from '@/components/date-input'

interface Props {
  listingId: string
  pricePerNight: number
  cleaningFee?: number
  minNights?: number
  maxNights?: number
  maxGuests?: number
  unavailable: { check_in: string; check_out: string }[]
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0
  const t1 = new Date(a + 'T00:00:00Z').getTime()
  const t2 = new Date(b + 'T00:00:00Z').getTime()
  return Math.max(0, Math.round((t2 - t1) / 86_400_000))
}

function overlaps(
  inA: string,
  outA: string,
  ranges: { check_in: string; check_out: string }[],
): boolean {
  if (!inA || !outA) return false
  return ranges.some((r) => inA < r.check_out && outA > r.check_in)
}

function formatCVE(n: number): string {
  return n.toLocaleString('pt-PT') + ' CVE'
}

export function BookingForm({
  listingId,
  pricePerNight,
  cleaningFee = 0,
  minNights = 1,
  maxNights,
  maxGuests,
  unavailable,
}: Props) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = nights * pricePerNight
  const total = subtotal + (nights > 0 ? cleaningFee : 0)
  const conflict = overlaps(checkIn, checkOut, unavailable)

  const minNightsError = nights > 0 && nights < minNights
  const maxNightsError = nights > 0 && maxNights != null && nights > maxNights

  const upcomingBlocks = useMemo(
    () =>
      unavailable
        .filter((r) => r.check_out >= todayISO())
        .slice(0, 8),
    [unavailable],
  )

  function handleSubmit() {
    setError(null)
    if (!checkIn || !checkOut) {
      setError('Escolhe data de entrada e saída.')
      return
    }
    if (checkOut <= checkIn) {
      setError('A data de saída tem de ser depois da entrada.')
      return
    }
    if (conflict) {
      setError('Estas datas chocam com uma reserva existente.')
      return
    }
    if (minNightsError) {
      setError(`Estadia mínima: ${minNights} noites.`)
      return
    }
    if (maxNightsError) {
      setError(`Estadia máxima: ${maxNights} noites.`)
      return
    }

    startTransition(async () => {
      const r = await createBooking({
        listingId,
        checkIn,
        checkOut,
        guests,
        message: message.trim() || undefined,
      })
      if (!r.ok) {
        if (r.error === 'unauthenticated') {
          router.push(`/login?next=/listings/${listingId}`)
          return
        }
        if (r.error === 'owner') {
          setError('Não podes reservar o teu próprio anúncio.')
          return
        }
        if (r.error === 'overlap') {
          setError('Estas datas chocam com uma reserva existente.')
          return
        }
        if (r.error === 'invalid_dates') {
          setError('Datas inválidas.')
          return
        }
        setError(r.error)
        return
      }
      router.push('/bookings')
    })
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.18em] text-text-3">
        <CalendarIcon className="h-3.5 w-3.5" />
        Reservar
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Entrada</span>
          <div className="mt-1">
            <DateInput
              value={checkIn}
              onChange={setCheckIn}
              min={todayISO()}
              ariaLabel="Data de entrada"
            />
          </div>
        </label>
        <label className="block">
          <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Saída</span>
          <div className="mt-1">
            <DateInput
              value={checkOut}
              onChange={setCheckOut}
              min={checkIn || todayISO()}
              ariaLabel="Data de saída"
            />
          </div>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Hóspedes</span>
        <input
          type="number"
          min={1}
          max={maxGuests ?? 20}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value) || 1)}
          className="mt-1 w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
        />
      </label>

      <label className="mt-3 block">
        <span className="block text-[12px] uppercase tracking-[0.12em] text-text-3">Mensagem (opcional)</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Olá, gostaria de reservar para…"
          className="mt-1 w-full resize-none rounded-xl border border-shell bg-paper-soft px-3 py-2 text-sm text-ink placeholder:text-text-3 focus:border-ink focus:outline-none"
        />
      </label>

      {/* Price breakdown */}
      {nights > 0 && (
        <dl className="mt-4 space-y-1.5 border-t border-shell pt-4 text-[13px]">
          <Row label={`${nights} ${nights === 1 ? 'noite' : 'noites'} × ${formatCVE(pricePerNight)}`} value={formatCVE(subtotal)} />
          {cleaningFee > 0 && <Row label="Taxa de limpeza" value={formatCVE(cleaningFee)} />}
          <Row label="Total" value={formatCVE(total)} bold />
        </dl>
      )}

      {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
      {conflict && !error && (
        <p className="mt-3 text-[13px] text-red-600">Estas datas chocam com uma reserva existente.</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || nights === 0 || conflict || !!minNightsError || !!maxNightsError}
        className="mt-4 w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50"
      >
        {isPending ? 'A enviar pedido…' : 'Pedir reserva'}
      </button>
      <p className="mt-2 text-[11px] text-text-3">
        O pedido fica pendente até o anfitrião aprovar.
      </p>

      {upcomingBlocks.length > 0 && (
        <details className="mt-4 border-t border-shell pt-3">
          <summary className="cursor-pointer text-[12px] uppercase tracking-[0.12em] text-text-3">
            Datas indisponíveis
          </summary>
          <ul className="mt-2 space-y-0.5 text-[12px] text-text-2">
            {upcomingBlocks.map((r, i) => (
              <li key={i}>
                {r.check_in} → {r.check_out}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${bold ? 'font-medium text-ink' : 'text-text-2'}`}>
      <dt>{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  )
}
