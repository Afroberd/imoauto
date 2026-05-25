'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBookingStatus } from '@/app/actions/bookings'

interface Props {
  bookingId: string
  role: 'owner' | 'guest'
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'blocked'
}

export function BookingActions({ bookingId, role, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function act(next: 'confirmed' | 'declined' | 'cancelled') {
    startTransition(async () => {
      const r = await updateBookingStatus(bookingId, next)
      if (r.ok) router.refresh()
      else alert(r.error)
    })
  }

  if (role === 'owner' && status === 'pending') {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => act('confirmed')}
          disabled={isPending}
          className="rounded-full bg-ink px-3 py-1.5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50"
        >
          Aceitar
        </button>
        <button
          onClick={() => act('declined')}
          disabled={isPending}
          className="rounded-full border border-shell bg-white px-3 py-1.5 text-[12px] text-text-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
        >
          Recusar
        </button>
      </div>
    )
  }

  if (role === 'guest' && (status === 'pending' || status === 'confirmed')) {
    return (
      <button
        onClick={() => act('cancelled')}
        disabled={isPending}
        className="rounded-full border border-shell bg-white px-3 py-1.5 text-[12px] text-text-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
      >
        Cancelar pedido
      </button>
    )
  }

  return null
}
