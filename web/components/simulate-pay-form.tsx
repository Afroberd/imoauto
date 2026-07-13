'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { paySimulated } from '@/app/actions/simulate-payment'

/**
 * Realistic card-entry form that MIRRORS the future Vinti4/SISP hosted page:
 * card number, expiry, CVV, cardholder name, with formatting + basic
 * validation and a "processing" step. It does NOT charge — on submit it calls
 * paySimulated (records the payment in test mode). When SISP credentials
 * arrive, this page is replaced by the real hosted gateway redirect and the
 * booking → paid → emails pipeline stays identical.
 */
export function SimulatePayForm({
  bookingId,
  amountLabel,
}: {
  bookingId: string
  amountLabel: string
}) {
  const router = useRouter()
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  const digits = number.replace(/\s/g, '')
  const brand = detectBrand(digits)
  const valid =
    digits.length >= 13 &&
    digits.length <= 19 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvv.length >= 3 &&
    name.trim().length >= 3

  function onNumber(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 19)
    setNumber(d.replace(/(.{4})/g, '$1 ').trim())
  }
  function onExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4)
    setExpiry(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) {
      setError('Preenche os dados do cartão corretamente.')
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await paySimulated(bookingId)
      if (!r.ok) { setError(r.error); return }
      setDone(true)
      setTimeout(() => router.push('/dashboard/reservas'), 1800)
    })
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-2xl text-white">✓</div>
        <p className="mt-3 text-sm font-medium text-green-800">Pagamento aprovado!</p>
        <p className="mt-1 text-[13px] text-green-700">A tua reserva está garantida. A redirecionar…</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1 block text-[12px] font-medium text-text-2">Número do cartão</label>
        <div className="relative">
          <input
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={number}
            onChange={(e) => onNumber(e.target.value)}
            className="w-full rounded-xl border border-shell bg-white px-3 py-2.5 pr-16 text-[15px] tracking-[0.06em] text-ink outline-none focus:border-ink"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase text-text-3">
            {brand}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-text-2">Validade</label>
          <input
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => onExpiry(e.target.value)}
            className="w-full rounded-xl border border-shell bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-text-2">CVV</label>
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full rounded-xl border border-shell bg-white px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[12px] font-medium text-text-2">Nome no cartão</label>
        <input
          autoComplete="cc-name"
          placeholder="NOME APELIDO"
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase())}
          className="w-full rounded-xl border border-shell bg-white px-3 py-2.5 text-[15px] uppercase text-ink outline-none focus:border-ink"
        />
      </div>

      {error && <p className="text-[13px] text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !valid}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50"
      >
        {isPending ? 'A processar pagamento…' : `Pagar ${amountLabel}`}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-text-3">
        <span>🔒</span> Pagamento encriptado · rede vinti4 (Vinti4, Visa, Mastercard)
      </p>
    </form>
  )
}

function detectBrand(digits: string): string {
  if (/^4/.test(digits)) return 'VISA'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD'
  if (/^(50|60|61|62|63|64|65)/.test(digits)) return 'VINTI4'
  return ''
}
