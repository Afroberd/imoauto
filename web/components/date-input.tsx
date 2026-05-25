'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  value: string // ISO date YYYY-MM-DD
  onChange: (iso: string) => void
  min?: string // ISO
  placeholder?: string
  className?: string
  ariaLabel?: string
}

/**
 * Date input that displays dd/mm/yyyy regardless of browser locale.
 * Stores ISO YYYY-MM-DD internally to match Supabase / Postgres `date`.
 *
 * Layout: text mask + small icon that opens a hidden native date picker
 * (so users still get a calendar to click through if they prefer).
 */
export function DateInput({
  value,
  onChange,
  min,
  placeholder = 'dd/mm/aaaa',
  className = '',
  ariaLabel,
}: Props) {
  const [text, setText] = useState(isoToPt(value))
  const nativeRef = useRef<HTMLInputElement>(null)

  // Sync text with external value changes
  useEffect(() => {
    setText(isoToPt(value))
  }, [value])

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Auto-insert slashes as user types digits
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    let masked = digits
    if (digits.length > 4) masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    else if (digits.length > 2) masked = `${digits.slice(0, 2)}/${digits.slice(2)}`
    setText(masked)

    // If we have a full valid date, push it up as ISO
    if (digits.length === 8) {
      const dd = parseInt(digits.slice(0, 2), 10)
      const mm = parseInt(digits.slice(2, 4), 10)
      const yyyy = parseInt(digits.slice(4), 10)
      if (isValidDate(yyyy, mm, dd)) {
        const iso = `${yyyy.toString().padStart(4, '0')}-${mm.toString().padStart(2, '0')}-${dd.toString().padStart(2, '0')}`
        if (!min || iso >= min) {
          onChange(iso)
        }
      }
    } else if (raw === '') {
      onChange('')
    }
  }

  function openPicker() {
    const el = nativeRef.current
    if (!el) return
    // showPicker is the modern API; fall back to focus+click for older browsers
    if (typeof el.showPicker === 'function') {
      try { el.showPicker() } catch { el.focus() }
    } else {
      el.focus()
      el.click()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={handleTextChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full rounded-xl border border-shell bg-paper-soft px-3 py-2 pr-10 text-sm text-ink placeholder:text-text-3 focus:border-ink focus:outline-none tnum"
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-text-3 hover:text-ink"
        aria-label="Abrir calendário"
        tabIndex={-1}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
      {/* Hidden native date input behind the icon button, for click-to-pick */}
      <input
        ref={nativeRef}
        type="date"
        value={value}
        min={min}
        onChange={(e) => {
          onChange(e.target.value)
          setText(isoToPt(e.target.value))
        }}
        className="pointer-events-none absolute right-2 top-1/2 h-0 w-0 -translate-y-1/2 opacity-0"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  )
}

function isoToPt(iso: string): string {
  if (!iso || iso.length !== 10) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2100) return false
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}
