import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRightIcon } from '@/components/icons'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/profile')

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null

  return (
    <main className="bg-paper">
      <section className="border-b border-shell/70 bg-paper-soft">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.2em] text-text-3 sm:tracking-[0.22em]">
            <span className="h-px w-8 bg-line-strong" />
            Conta
          </div>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.022em] text-ink sm:text-4xl md:text-5xl">
            {fullName ? `Olá, ${fullName.split(' ')[0]}` : 'O teu perfil'}
          </h1>
          <p className="mt-2 text-text-2">
            Gestão da tua conta IMOAUTO.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
        <dl className="overflow-hidden rounded-[var(--radius-card)] border border-shell bg-white shadow-[var(--shadow-card)]">
          <Row label="Email" value={user.email ?? '—'} />
          <Row label="Nome" value={fullName ?? '—'} />
          <Row label="Conta criada" value={new Date(user.created_at).toLocaleString('pt-PT')} />
          <Row label="ID" value={user.id} mono />
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/my-listings"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-ink-deep"
          >
            Ver os meus anúncios
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-shell px-4 py-2.5 text-sm text-text-2 transition-colors hover:border-ink hover:text-ink"
            >
              Terminar sessão
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-shell/70 px-5 py-3.5 text-sm last:border-0">
      <dt className="text-[12px] font-medium uppercase tracking-[0.12em] text-text-3">
        {label}
      </dt>
      <dd className={`col-span-2 ${mono ? 'font-mono text-xs' : ''} text-text-1`}>
        {value}
      </dd>
    </div>
  )
}
