import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { robots: { index: false, follow: false } }

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin')

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!adminRow) redirect('/')

  return (
    <main className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8 md:py-12">
        <header className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-text-3 sm:text-[12px] sm:tracking-[0.22em]">
            <span className="h-px w-6 bg-line-strong sm:w-8" />
            Administração
          </div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-2xl font-medium tracking-[-0.022em] text-ink sm:text-3xl md:text-4xl">
              Admin
            </h1>
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/admin/verificacoes"
                className="rounded-full px-3 py-1.5 text-text-2 transition-colors hover:bg-shell-soft hover:text-ink"
              >
                Verificações
              </Link>
            </nav>
          </div>
        </header>

        {children}
      </div>
    </main>
  )
}
