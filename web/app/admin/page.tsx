import Link from 'next/link'
import { listVerifications } from '@/app/actions/admin'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const pending = await listVerifications('pending')

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/admin/verificacoes"
        className="group rounded-[var(--radius-card)] border border-shell bg-white p-5 shadow-[var(--shadow-card)] transition-colors hover:border-ink"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.15em] text-text-3">
            Verificações de identidade
          </h2>
          {pending.length > 0 && (
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-ink px-2 text-[12px] font-medium text-paper">
              {pending.length}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-text-2">
          {pending.length > 0
            ? `${pending.length} ${pending.length === 1 ? 'pedido' : 'pedidos'} à espera de revisão.`
            : 'Sem pedidos pendentes.'}
        </p>
        <span className="mt-3 inline-block text-sm text-ink underline-offset-4 group-hover:underline">
          Abrir →
        </span>
      </Link>
    </div>
  )
}
