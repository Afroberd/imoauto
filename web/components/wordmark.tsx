import Link from 'next/link'

export function Wordmark({ tone = 'ink' }: { tone?: 'ink' | 'paper' }) {
  const colorClass = tone === 'ink' ? 'text-ink' : 'text-paper'
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${colorClass}`}>
      <span aria-hidden className="inline-block h-7 w-[42px]">
        <svg
          viewBox="0 0 120 80"
          className="h-full w-full"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Roof + chimney */}
          <path d="M52 44 L78 20 L108 40 L108 62" />
          <path d="M96 30 L96 16 L103 16 L103 34" />
          {/* Car body */}
          <path d="M6 62 L6 53 Q6 47 12 45 L23 42 Q26 39 30 39 L48 39 L56 31 L80 31" />
          {/* Ground */}
          <line x1="6" y1="62" x2="108" y2="62" />
          {/* Wheel */}
          <circle cx="30" cy="62" r="6.5" />
          <circle cx="30" cy="62" r="1.8" fill="currentColor" stroke="none" />
          {/* Headlight */}
          <circle cx="9" cy="54" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="font-display text-[22px] font-medium leading-none tracking-[-0.03em]">
        Imo<span className="italic">Auto</span>
      </span>
    </Link>
  )
}
