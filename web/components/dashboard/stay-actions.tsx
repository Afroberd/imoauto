'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markCheckin, markCheckout } from '@/app/actions/bookings'

interface CheckinProps {
  bookingId: string
  isVehicle: boolean
}

export function CheckinButton({ bookingId, isVehicle }: CheckinProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [km, setKm] = useState('')
  const [fuel, setFuel] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const r = await markCheckin({
        bookingId,
        pickupKm: km ? Number(km) : undefined,
        pickupFuel: fuel ? Number(fuel) : undefined,
        pickupNotes: notes || undefined,
      })
      if (r.ok) {
        setOpen(false)
        router.refresh()
      } else {
        alert(r.error)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-green-700 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-green-800"
      >
        Marcar check-in
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-[var(--radius-card)] border border-shell bg-paper-soft p-3">
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">
        {isVehicle ? 'Dados de entrega do veículo' : 'Confirmar check-in'}
      </p>
      {isVehicle && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[11px] text-text-3">KM no momento</span>
            <input type="number" value={km} onChange={(e) => setKm(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-shell bg-white px-2 py-1.5 text-sm tnum focus:border-ink focus:outline-none" />
          </label>
          <label className="block">
            <span className="block text-[11px] text-text-3">Combustível %</span>
            <input type="number" min={0} max={100} value={fuel} onChange={(e) => setFuel(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-shell bg-white px-2 py-1.5 text-sm tnum focus:border-ink focus:outline-none" />
          </label>
        </div>
      )}
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        placeholder={isVehicle ? 'Estado do carro, arranhões existentes…' : 'Observações da entrega…'}
        className="mt-2 w-full resize-none rounded-lg border border-shell bg-white px-2 py-1.5 text-sm focus:border-ink focus:outline-none" />
      <div className="mt-2 flex gap-2">
        <button onClick={submit} disabled={isPending}
          className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-ink-deep disabled:opacity-50">
          {isPending ? 'A guardar…' : 'Confirmar'}
        </button>
        <button onClick={() => setOpen(false)}
          className="rounded-full border border-shell px-3 py-1.5 text-[12px] text-text-2 hover:border-ink hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  )
}

interface CheckoutProps {
  bookingId: string
  isVehicle: boolean
}

export function CheckoutButton({ bookingId, isVehicle }: CheckoutProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [km, setKm] = useState('')
  const [fuel, setFuel] = useState('')
  const [notes, setNotes] = useState('')
  const [damage, setDamage] = useState('')
  const [isPending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const r = await markCheckout({
        bookingId,
        returnKm: km ? Number(km) : undefined,
        returnFuel: fuel ? Number(fuel) : undefined,
        returnNotes: notes || undefined,
        damageNotes: damage || undefined,
      })
      if (r.ok) {
        setOpen(false)
        router.refresh()
      } else {
        alert(r.error)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-coral px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
      >
        Marcar check-out
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-[var(--radius-card)] border border-shell bg-paper-soft p-3">
      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">
        {isVehicle ? 'Devolução do veículo' : 'Confirmar check-out'}
      </p>
      {isVehicle && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="block text-[11px] text-text-3">KM final</span>
            <input type="number" value={km} onChange={(e) => setKm(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-shell bg-white px-2 py-1.5 text-sm tnum focus:border-ink focus:outline-none" />
          </label>
          <label className="block">
            <span className="block text-[11px] text-text-3">Combustível %</span>
            <input type="number" min={0} max={100} value={fuel} onChange={(e) => setFuel(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-shell bg-white px-2 py-1.5 text-sm tnum focus:border-ink focus:outline-none" />
          </label>
        </div>
      )}
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
        placeholder="Observações da devolução…"
        className="mt-2 w-full resize-none rounded-lg border border-shell bg-white px-2 py-1.5 text-sm focus:border-ink focus:outline-none" />
      <textarea value={damage} onChange={(e) => setDamage(e.target.value)} rows={2}
        placeholder="Danos (se houver) — deduz da caução se aplicável"
        className="mt-2 w-full resize-none rounded-lg border border-shell bg-white px-2 py-1.5 text-sm focus:border-ink focus:outline-none" />
      <div className="mt-2 flex gap-2">
        <button onClick={submit} disabled={isPending}
          className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-ink-deep disabled:opacity-50">
          {isPending ? 'A guardar…' : 'Concluir estadia'}
        </button>
        <button onClick={() => setOpen(false)}
          className="rounded-full border border-shell px-3 py-1.5 text-[12px] text-text-2 hover:border-ink hover:text-ink">
          Cancelar
        </button>
      </div>
    </div>
  )
}
