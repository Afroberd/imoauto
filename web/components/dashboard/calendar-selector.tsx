'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface Listing {
  id: string
  title: string
  kind: 'property' | 'vehicle'
}

interface Props {
  listings: Listing[]
  selectedId: string | 'all'
}

export function CalendarListingSelector({ listings, selectedId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  function setListing(id: string) {
    const next = new URLSearchParams(sp.toString())
    if (id === 'all') next.delete('listing')
    else next.set('listing', id)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => setListing('all')}
        className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
          selectedId === 'all'
            ? 'border-ink bg-ink text-paper'
            : 'border-shell bg-white text-text-2 hover:border-ink hover:text-ink'
        }`}
      >
        Todos ({listings.length})
      </button>
      {listings.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => setListing(l.id)}
          className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
            selectedId === l.id
              ? 'border-ink bg-ink text-paper'
              : 'border-shell bg-white text-text-2 hover:border-ink hover:text-ink'
          }`}
        >
          {l.kind === 'vehicle' ? '🚗' : '🏠'} {l.title.length > 30 ? l.title.slice(0, 30) + '…' : l.title}
        </button>
      ))}
    </div>
  )
}
