'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

interface NavLink {
  href: string
  label: string
}

interface Props {
  loggedIn: boolean
  loggedInLinks: NavLink[]
  loggedOutLinks: NavLink[]
  baseLinks: NavLink[]
}

export function MobileNav({ loggedIn, loggedInLinks, loggedOutLinks, baseLinks }: Props) {
  const [open, setOpen] = useState(false)

  // Close drawer on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-shell-soft hover:text-ink md:hidden"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed left-0 top-0 z-40 h-screen w-screen bg-ink/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="fixed right-0 top-0 z-50 h-screen w-[85%] max-w-xs overflow-y-auto bg-paper p-6 shadow-2xl md:hidden">
            <div className="flex items-center justify-between">
              <p className="text-[12px] uppercase tracking-[0.18em] text-text-3">Menu</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-2 transition-colors hover:bg-shell-soft hover:text-ink"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <ul className="mt-8 space-y-1">
              {baseLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 text-base text-ink transition-colors hover:bg-shell-soft"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-shell pt-6">
              <ul className="space-y-1">
                {(loggedIn ? loggedInLinks : loggedOutLinks).map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-3 text-base text-ink transition-colors hover:bg-shell-soft"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {loggedIn && (
              <form action={signOut} className="mt-6 border-t border-shell pt-6">
                <button
                  type="submit"
                  className="w-full rounded-full border border-shell px-4 py-2 text-sm text-text-2 transition-colors hover:border-ink hover:text-ink"
                >
                  Sair
                </button>
              </form>
            )}
          </nav>
        </>
      )}
    </>
  )
}
