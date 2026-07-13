'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { paySimulated } from '@/app/actions/simulate-payment'

export function SimulatePayButton({
  bookingId,
  amountLabel,
}: {
  bookingId: string
  amountLabel: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function pay() {
    setError(null)
    startTransition(async () => {
      const r = await paySimulated(bookingId)
      if (!r.ok) { setError(r.error); return }
      setDone(true)
      setTimeout(() => router.push('/dashboard/reservas'), 1500)
    })
  }

  if (done) {
    return (
      <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        ✓ Pagamento confirmado! A tua reserva está garantida. A redirecionar…
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={pay}
        disabled={isPending}
        className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50"
      >
        {isPending ? 'A processar…' : `Pagar ${amountLabel} (teste)`}
      </button>
      {error && <p className="text-[13px] text-red-600">{error}</p>}
    </div>
  )
}
