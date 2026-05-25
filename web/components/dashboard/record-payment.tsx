'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recordPayment } from '@/app/actions/payments'

interface Props {
  bookingId: string
  amountDue: number
}

export function RecordPaymentButton({ bookingId, amountDue }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(amountDue))
  const [method, setMethod] = useState<'manual_transfer' | 'cash' | 'vinti4' | 'stripe' | 'other'>('manual_transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    setError(null)
    const n = Number(amount)
    if (!n || n <= 0) { setError('Valor inválido.'); return }
    startTransition(async () => {
      const r = await recordPayment({
        bookingId,
        amountCve: n,
        method,
        reference: reference || undefined,
        notes: notes || undefined,
      })
      if (r.ok) {
        setOpen(false)
        router.refresh()
      } else {
        setError(r.error)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-ink-deep"
      >
        Recebi pagamento
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-[var(--radius-card)] border border-shell bg-paper-soft p-3">
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">Registar pagamento recebido</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="block text-[11px] text-text-3">Valor (CVE)</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="mt-0.5 w-full rounded-lg border border-shell bg-white px-2 py-1.5 text-sm tnum focus:border-ink focus:outline-none" />
        </label>
        <label className="block">
          <span className="block text-[11px] text-text-3">Método</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)}
            className="mt-0.5 w-full rounded-lg border border-shell bg-white px-2 py-1.5 text-sm focus:border-ink focus:outline-none">
            <option value="manual_transfer">Transferência bancária</option>
            <option value="cash">Dinheiro</option>
            <option value="vinti4">Vinti4</option>
            <option value="other">Outro</option>
          </select>
        </label>
      </div>
      <label className="mt-2 block">
        <span className="block text-[11px] text-text-3">Referência (opcional — ex: nº da transferência)</span>
        <input value={reference} onChange={(e) => setReference(e.target.value)}
          className="mt-0.5 w-full rounded-lg border border-shell bg-white px-2 py-1.5 text-sm focus:border-ink focus:outline-none" />
      </label>
      <label className="mt-2 block">
        <span className="block text-[11px] text-text-3">Notas</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="mt-0.5 w-full resize-none rounded-lg border border-shell bg-white px-2 py-1.5 text-sm focus:border-ink focus:outline-none" />
      </label>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button onClick={submit} disabled={isPending}
          className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-ink-deep disabled:opacity-50">
          {isPending ? 'A registar…' : 'Confirmar pagamento'}
        </button>
        <button onClick={() => setOpen(false)}
          className="rounded-full border border-shell px-3 py-1.5 text-[12px] text-text-2 hover:border-ink hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  )
}
