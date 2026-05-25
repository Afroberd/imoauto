'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview, deleteReview } from '@/app/actions/reviews'
import { StarRatingInput } from '@/components/star-rating'

interface Props {
  listingId: string
  existing?: { id: string; rating: number; body: string | null }
}

export function ReviewForm({ listingId, existing }: Props) {
  const router = useRouter()
  const [rating, setRating] = useState(existing?.rating ?? 5)
  const [body, setBody] = useState(existing?.body ?? '')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)
    setDone(false)
    startTransition(async () => {
      const r = await submitReview({ listingId, rating, body })
      if (!r.ok) {
        if (r.error === 'unauthenticated') {
          router.push(`/login?next=/listings/${listingId}`)
          return
        }
        if (r.error === 'ineligible') {
          setError('Só podes avaliar depois de contactar o anunciante ou completar uma reserva.')
          return
        }
        setError(r.error)
        return
      }
      setDone(true)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!existing) return
    startTransition(async () => {
      const r = await deleteReview(existing.id, listingId)
      if (r.ok) {
        setRating(5)
        setBody('')
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-shell bg-paper-soft p-4">
      <h3 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">
        {existing ? 'A tua avaliação' : 'Deixar uma avaliação'}
      </h3>

      <div className="mt-3">
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Conta a tua experiência…"
        className="mt-3 w-full resize-none rounded-xl border border-shell bg-white px-3 py-2 text-sm text-ink placeholder:text-text-3 focus:border-ink focus:outline-none"
        maxLength={2000}
      />

      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      {done && <p className="mt-2 text-[13px] text-green-700">Avaliação guardada.</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-ink-deep disabled:opacity-50"
        >
          {isPending ? 'A guardar…' : existing ? 'Atualizar' : 'Publicar avaliação'}
        </button>
        {existing && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-full border border-shell bg-white px-4 py-2 text-[13px] text-text-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
          >
            Apagar
          </button>
        )}
      </div>
    </div>
  )
}
