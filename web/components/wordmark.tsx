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
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* House: roof + right wall + chimney */}
          <path d="M66 40 L92 14 L114 36 L114 62" />
          <path d="M104 25 L104 16 L109 16 L109 29" />
          {/* Car: sleek silhouette flowing into the house */}
          <path d="M8 62 L8 53 Q8 47.5 13.5 45.5 L25 42 Q28 39 32 39 L50 38 L58 30 Q61.5 28 67 28 L84 30 Q99 33 104 62" />
          {/* Ground */}
          <line x1="8" y1="62" x2="114" y2="62" />
          {/* Front wheel */}
          <circle cx="34" cy="56" r="6.4" />
          <circle cx="34" cy="56" r="1.7" fill="currentColor" stroke="none" />
          {/* Headlight */}
          <circle cx="11" cy="54" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="font-display text-[22px] font-medium leading-none tracking-[-0.03em]">
        Imo<span className="italic">Auto</span>
      </span>
    </Link>
  )
}
