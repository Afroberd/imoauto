'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Segmented filter (Todos · Imóveis · Automóveis) for host dashboard lists.
 * Uses the `kind` query param; the server page reads it and filters.
 */
export function KindFilter({
  counts,
}: {
  counts?: { all: number; property: number; vehicle: number }
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get('kind') ?? 'all'

  const options: { value: string; label: string; n?: number }[] = [
    { value: 'all', label: 'Todos', n: counts?.all },
    { value: 'property', label: '🏠 Imóveis', n: counts?.property },
    { value: 'vehicle', label: '🚗 Automóveis', n: counts?.vehicle },
  ]

  return (
    <div className="inline-flex rounded-full border border-shell bg-paper-soft p-0.5">
      {options.map((o) => {
        const active = current === o.value
        const href = o.value === 'all' ? pathname : `${pathname}?kind=${o.value}`
        return (
          <Link
            key={o.value}
            href={href}
            scroll={false}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              active ? 'bg-ink text-paper' : 'text-text-2 hover:text-ink'
            }`}
          >
            {o.label}
            {typeof o.n === 'number' && (
              <span className={`ml-1.5 tnum ${active ? 'text-paper/70' : 'text-text-3'}`}>{o.n}</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
