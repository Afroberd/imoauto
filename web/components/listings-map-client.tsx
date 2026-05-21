'use client'

import dynamic from 'next/dynamic'
import type { Listing } from '@/lib/listings/types'

const ListingsMap = dynamic(() => import('./listings-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[68vh] min-h-[480px] w-full items-center justify-center rounded-[var(--radius-card)] border border-shell bg-paper-soft text-sm text-text-3">
      A carregar mapa…
    </div>
  ),
})

export default function ListingsMapClient({ listings }: { listings: Listing[] }) {
  return <ListingsMap listings={listings} />
}
