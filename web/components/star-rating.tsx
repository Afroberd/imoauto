'use client'

import { useState } from 'react'
import { StarIcon } from '@/components/icons'

/** Read-only star rating display. */
export function StarRatingDisplay({
  value,
  count,
  size = 'sm',
}: {
  value: number | null
  count?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const stars = Math.round((value ?? 0) * 2) / 2 // rounded to nearest 0.5
  const px = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'
  return (
    <span className="inline-flex items-center gap-1 text-coral">
      <span className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon
            key={i}
            filled={i <= stars}
            className={`${px} ${i <= stars ? 'text-coral' : 'text-shell-soft'}`}
          />
        ))}
      </span>
      {value != null && (
        <span className="text-[12px] font-medium text-ink tnum">
          {value.toFixed(1)}
        </span>
      )}
      {count != null && (
        <span className="text-[12px] text-text-3 tnum">({count})</span>
      )}
    </span>
  )
}

/** Interactive star input — used in the review form. */
export function StarRatingInput({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value
  return (
    <div className="inline-flex" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="p-1 transition-transform hover:scale-110"
          aria-label={`${i} estrelas`}
        >
          <StarIcon
            filled={i <= shown}
            className={`h-7 w-7 ${i <= shown ? 'text-coral' : 'text-shell'}`}
          />
        </button>
      ))}
    </div>
  )
}
