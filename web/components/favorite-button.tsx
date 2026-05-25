'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleFavorite } from '@/app/actions/favorites'
import { HeartIcon } from '@/components/icons'

interface FavoriteButtonProps {
  listingId: string
  /** Whether this listing is already in the user's favorites (from the server). */
  initialFavorited: boolean
  className?: string
}

/**
 * Heart button that toggles a listing in/out of the current user's favorites.
 * Uses optimistic UI — the visual state flips immediately without waiting for
 * the server roundtrip. If the user is not logged in, redirects to /login.
 */
export function FavoriteButton({
  listingId,
  initialFavorited,
  className = '',
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick(e: React.MouseEvent) {
    // Prevent the event from reaching any parent Link element.
    e.preventDefault()
    e.stopPropagation()

    // Optimistic flip.
    setFavorited((prev) => !prev)

    startTransition(async () => {
      const result = await toggleFavorite(listingId)
      if (!result.ok) {
        if (result.error === 'unauthenticated') {
          // Revert optimistic flip before navigating away.
          setFavorited(favorited)
          router.push(`/login?next=/listings/${listingId}`)
        } else {
          // Server error — revert.
          setFavorited(favorited)
        }
        return
      }
      // Confirm the server's truth.
      setFavorited(result.favorited)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
      className={[
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/10 backdrop-blur',
        'transition-all hover:scale-105 hover:bg-white',
        'disabled:opacity-60',
        favorited ? 'text-coral' : 'text-text-3 hover:text-coral',
        className,
      ].join(' ')}
    >
      <HeartIcon filled={favorited} className="h-4 w-4" />
    </button>
  )
}
