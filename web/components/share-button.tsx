'use client'

import { useState } from 'react'

export function ShareButton({ title }: { title: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle')

  async function handleShare() {
    if (typeof window === 'undefined') return
    const url = window.location.href

    // Prefer native share on mobile
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> })
          .share({ title, url })
        setStatus('shared')
        setTimeout(() => setStatus('idle'), 1800)
        return
      } catch {
        // user cancelled or share unavailable — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 1800)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2400)
    }
  }

  const label =
    status === 'copied' ? 'Link copiado ✓' :
    status === 'shared' ? 'Partilhado ✓' :
    status === 'error'  ? 'Erro ao copiar' :
    'Partilhar anúncio'

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full rounded-full border border-shell bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-ink"
    >
      {label}
    </button>
  )
}
