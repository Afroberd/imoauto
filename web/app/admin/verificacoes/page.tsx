import Link from 'next/link'
import { listVerifications } from '@/app/actions/admin'
import { VerificationReview } from '@/components/admin/verification-review'

export const dynamic = 'force-dynamic'

const FILTERS = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'all', label: 'Todas' },
] as const

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const filter: 'pending' | 'all' = sp.filter === 'all' ? 'all' : 'pending'
  const rows = await listVerifications(filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter
          return (
            <Link
              key={f.key}
              href={`/admin/verificacoes?filter=${f.key}`}
              className={
                active
                  ? 'rounded-full bg-ink px-4 py-1.5 text-sm text-paper'
                  : 'rounded-full border border-shell px-4 py-1.5 text-sm text-text-2 transition-colors hover:border-ink hover:text-ink'
              }
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-shell bg-paper-soft p-8 text-center text-sm text-text-2">
          {filter === 'pending'
            ? 'Não há verificações pendentes. 🎉'
            : 'Ainda não há verificações submetidas.'}
        </div>
      ) : (
        <ul className="space-y-4">
          {rows.map((v) => (
            <li key={v.user_id}>
              <VerificationReview v={v} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
